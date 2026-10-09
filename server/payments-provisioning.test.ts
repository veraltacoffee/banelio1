import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  validateStripePaymentIntentForOrder,
  isStripeEventProcessed,
  markStripeEventProcessed,
  clearProcessedStripeEvents,
  claimStripeWebhookEvent,
  markStripeWebhookEventProcessed,
  markStripeWebhookEventFailed
} from './payments';
import { provisionPaidOrder, retryProvisionOrder } from './provisioning';
import { authorizeOrderAccess, createOrder, toPublicOrder, OrderValidationError } from './orders';
import { seedCatalog } from './catalog';
import { buildBridgeAuthHeaders, verifyBridgeAuth } from './phpBridgeAuth';
import { prisma } from './db';

// ============================================================================
// 1. Solicitud PHP sin firma: rechazada
// ============================================================================
test('1. Solicitud PHP sin firma: rechazada', () => {
  const result = verifyBridgeAuth(
    'POST',
    '/api/domains/provision.php',
    JSON.stringify({ action: 'register', domain: 'banelio-test.com' }),
    undefined, // Sin timestamp
    undefined, // Sin firma
    'test_secret_key_123'
  );
  assert.equal(result.valid, false);
  assert.match(result.error || '', /firma de autenticación requerida/i);
});

// ============================================================================
// 2. Firma incorrecta o vencida: rechazada
// ============================================================================
test('2. Firma incorrecta o vencida: rechazada', () => {
  const secret = 'test_secret_key_123';
  const pathUrl = '/api/domains/provision.php';
  const body = JSON.stringify({ action: 'register', domain: 'banelio-test.com' });
  const now = Math.floor(Date.now() / 1000);

  // 2a. Firma incorrecta
  const badSigResult = verifyBridgeAuth(
    'POST',
    pathUrl,
    body,
    String(now),
    'deadbeef1234567890abcdef1234567890abcdef1234567890abcdef1234567890ab',
    secret
  );
  assert.equal(badSigResult.valid, false);
  assert.match(badSigResult.error || '', /firma de autenticación inválida/i);

  // 2b. Marca de tiempo vencida (> 300 segundos en el pasado)
  const expiredTimestamp = String(now - 350);
  const expiredHeaders = buildBridgeAuthHeaders('POST', pathUrl, body, now - 350, secret);
  const expiredResult = verifyBridgeAuth(
    'POST',
    pathUrl,
    body,
    expiredTimestamp,
    expiredHeaders['X-Banelio-Signature'],
    secret
  );
  assert.equal(expiredResult.valid, false);
  assert.match(expiredResult.error || '', /expirada/i);
});

// ============================================================================
// 3. Solicitud válida firmada desde el backend: aceptada en la prueba controlada
// ============================================================================
test('3. Solicitud válida firmada desde el backend: aceptada en la prueba controlada', () => {
  const secret = 'shared_secret_banelio_2026';
  const pathUrl = '/api/domains/provision.php';
  const body = JSON.stringify({ action: 'register', domain: 'banelio-firmado.com' });
  const now = Math.floor(Date.now() / 1000);

  const headers = buildBridgeAuthHeaders('POST', pathUrl, body, now, secret);
  assert.ok(headers['X-Banelio-Timestamp']);
  assert.ok(headers['X-Banelio-Signature']);

  const verification = verifyBridgeAuth(
    'POST',
    pathUrl,
    body,
    headers['X-Banelio-Timestamp'],
    headers['X-Banelio-Signature'],
    secret,
    now
  );
  assert.equal(verification.valid, true);
});

// ============================================================================
// 4. Falta un dato obligatorio del registrante: no se llama a ResellerClub
// ============================================================================
test('4. Falta un dato obligatorio del registrante: no se llama a ResellerClub', async () => {
  const dummyMissingFieldOrder = {
    id: 'ord_missing_field_' + Date.now(),
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: 'incomplete-fields.com',
        registrant: {
          name: 'Cliente Incompleto',
          email: 'incompleto@ejemplo.com',
          phone: '5512345678',
          phone_cc: '52',
          // Faltan dirección, ciudad, estado, país y código postal
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyMissingFieldOrder as any });

  try {
    let bridgeCalled = false;
    const result = await provisionPaidOrder(created.id, {
      bridgeFetch: async () => {
        bridgeCalled = true;
        return new Response('{}', { status: 200 });
      }
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'FAILED');
    assert.equal(bridgeCalled, false, 'No debe llamar al proveedor si faltan datos obligatorios');
    assert.match(result.error || '', /Faltan datos obligatorios de contacto del registrante/);
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 5. Prefijo telefónico ausente: no se inventa uno
// ============================================================================
test('5. Prefijo telefónico ausente: no se inventa uno', async () => {
  const dummyNoCcOrder = {
    id: 'ord_no_phone_cc_' + Date.now(),
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: 'sin-prefijo-telefonico.com',
        registrant: {
          name: 'Juan Perez',
          email: 'juan@banelio-real.com',
          phone: '5512345678', // Sin código de país y sin phone_cc
          address: 'Calle Reforma 100',
          city: 'Ciudad de Mexico',
          state: 'CDMX',
          country: 'MX',
          postalCode: '06600'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyNoCcOrder as any });

  try {
    let bridgeCalled = false;
    const result = await provisionPaidOrder(created.id, {
      bridgeFetch: async () => {
        bridgeCalled = true;
        return new Response('{}', { status: 200 });
      }
    });

    assert.equal(result.success, false);
    assert.equal(result.status, 'FAILED');
    assert.equal(bridgeCalled, false, 'No debe inventarse el código de país del teléfono');
    assert.match(result.error || '', /código de país del teléfono/i);
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 6. Búsqueda automatizada que detecte los valores ficticios conocidos en los flujos de aprovisionamiento
// ============================================================================
test('6. Búsqueda automatizada que detecte los valores ficticios conocidos en los flujos de aprovisionamiento', () => {
  const filesToCheck = [
    path.resolve(process.cwd(), 'server/php/domains/provision.php'),
    path.resolve(process.cwd(), 'server/php/domains/customer.php'),
    path.resolve(process.cwd(), 'server/php/domains/contacts.php'),
    path.resolve(process.cwd(), 'server/provisioning.ts')
  ];

  for (const filePath of filesToCheck) {
    assert.ok(fs.existsSync(filePath), `El archivo ${filePath} debe existir.`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Verificar que no contengan valores inventados o fallbacks hardcoded prohibidos
    assert.equal(
      content.includes('6691000000'),
      false,
      `Se encontró el teléfono ficticio 6691000000 en ${path.basename(filePath)}`
    );
    assert.equal(
      content.includes("'N/A'") || content.includes('"N/A"'),
      false,
      `Se encontró fallback de estado N/A en ${path.basename(filePath)}`
    );
    assert.equal(
      content.includes("'00000'") || content.includes('"00000"'),
      false,
      `Se encontró fallback de código postal 00000 en ${path.basename(filePath)}`
    );
  }
});

// ============================================================================
// 7. Evento Stripe duplicado tras recuperar el estado desde la base de datos: no se procesa dos veces
// ============================================================================
test('7. Evento Stripe duplicado tras recuperar el estado desde la base de datos: no se procesa dos veces', async () => {
  await clearProcessedStripeEvents();
  const eventId = 'evt_db_dedup_' + Date.now();

  const firstClaim = await claimStripeWebhookEvent(eventId, 'payment_intent.succeeded');
  assert.equal(firstClaim.claimed, true);
  assert.equal(firstClaim.status, 'NEW');

  await markStripeWebhookEventProcessed(eventId);

  // Segunda entrega del mismo evento tras persistir en DB
  const secondClaim = await claimStripeWebhookEvent(eventId, 'payment_intent.succeeded');
  assert.equal(secondClaim.claimed, false);
  assert.equal(secondClaim.status, 'PROCESSED');

  const isProcessed = await isStripeEventProcessed(eventId);
  assert.equal(isProcessed, true);

  await clearProcessedStripeEvents();
});

// ============================================================================
// 8. Dos entregas simultáneas del mismo evento: una sola ejecución efectiva del procesamiento
// ============================================================================
test('8. Dos entregas simultáneas del mismo evento: una sola ejecución efectiva del procesamiento', async () => {
  await clearProcessedStripeEvents();
  const eventId = 'evt_concurrent_' + Date.now();

  // Entregas paralelas exactamente simultáneas
  const [claimA, claimB] = await Promise.all([
    claimStripeWebhookEvent(eventId, 'payment_intent.succeeded'),
    claimStripeWebhookEvent(eventId, 'payment_intent.succeeded')
  ]);

  const claimedCount = [claimA, claimB].filter((c) => c.claimed).length;
  assert.equal(claimedCount, 1, 'Exactamente una solicitud concurrente debe reclamar el evento');

  const inProgressCount = [claimA, claimB].filter((c) => !c.claimed && c.status === 'PROCESSING').length;
  assert.equal(inProgressCount, 1, 'La solicitud concurrente secundaria debe reportar PROCESSING');

  await clearProcessedStripeEvents();
});

// ============================================================================
// 9. Fallo de procesamiento: recuperación segura sin marcar falsamente el evento como terminado
// ============================================================================
test('9. Fallo de procesamiento: recuperación segura sin marcar falsamente el evento como terminado', async () => {
  await clearProcessedStripeEvents();
  const eventId = 'evt_fail_recover_' + Date.now();

  const claim = await claimStripeWebhookEvent(eventId, 'payment_intent.succeeded');
  assert.equal(claim.claimed, true);

  // Registrar fallo transitorio
  await markStripeWebhookEventFailed(eventId, 'Error de conexión temporal a pasarela');

  const isProcessed = await isStripeEventProcessed(eventId);
  assert.equal(isProcessed, false, 'El evento fallido NUNCA debe marcarse como PROCESSED');

  // Reintento posterior de entrega permite recuperación segura
  const retryClaim = await claimStripeWebhookEvent(eventId, 'payment_intent.succeeded');
  assert.equal(retryClaim.claimed, true, 'El reintento debe poder procesarse');

  await clearProcessedStripeEvents();
});

// ============================================================================
// 10. Orden no pagada: aprovisionamiento bloqueado
// ============================================================================
test('10. Orden no pagada: aprovisionamiento bloqueado', async () => {
  const dummyUnpaidOrder = {
    id: 'ord_unpaid_block_' + Date.now(),
    customerId: null,
    status: 'CREATED',
    paymentStatus: 'PENDING_PAYMENT',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: 'unpaid-block.com'
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyUnpaidOrder as any });

  try {
    const result = await provisionPaidOrder(created.id);
    assert.equal(result.success, false);
    assert.equal(result.status, 'FAILED');
    assert.match(result.error || '', /No se puede aprovisionar una orden con pago no confirmado/);
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 11. Orden con un cliente distinto al usuario autenticado: acceso denegado
// ============================================================================
test('11. Orden con un cliente distinto al usuario autenticado: acceso denegado', () => {
  const orderOfCustomerA = {
    id: 'ord_cust_a',
    customerId: 'cust_id_AAA'
  };

  // Usuario B intentando acceder
  const customerB = { id: 'cust_id_BBB', role: 'CUSTOMER' };
  const authB = authorizeOrderAccess(customerB, orderOfCustomerA);
  assert.equal(authB.authorized, false);
  assert.equal(authB.status, 403);

  // Administrador accediendo a la orden de Customer A
  const admin = { id: 'cust_id_ADMIN', role: 'ADMIN' };
  const authAdmin = authorizeOrderAccess(admin, orderOfCustomerA);
  assert.equal(authAdmin.authorized, true);
  assert.equal(authAdmin.status, 200);
});

// ============================================================================
// 12. Orden sin customerId: no se permite eludir el control de acceso
// ============================================================================
test('12. Orden sin customerId: no se permite eludir el control de acceso', () => {
  const guestOrder = {
    id: 'ord_guest_xyz',
    customerId: null
  };

  // Sin autenticación
  const unauth = authorizeOrderAccess(null, guestOrder);
  assert.equal(unauth.authorized, false);
  assert.equal(unauth.status, 401);

  // Cliente común (no admin) no puede operar órdenes sin customerId
  const normalCustomer = { id: 'cust_id_CCC', role: 'CUSTOMER' };
  const authNormal = authorizeOrderAccess(normalCustomer, guestOrder);
  assert.equal(authNormal.authorized, false);
  assert.equal(authNormal.status, 403);
  assert.match(authNormal.error || '', /requieren autorización administrativa/);

  // Administrador sí puede operar órdenes sin customerId
  const admin = { id: 'cust_id_ADMIN', role: 'ADMIN' };
  const authAdmin = authorizeOrderAccess(admin, guestOrder);
  assert.equal(authAdmin.authorized, true);
  assert.equal(authAdmin.status, 200);
});

// ============================================================================
// 13. Dos intentos simultáneos de aprovisionamiento del mismo ítem: no duplican operaciones externas
// ============================================================================
test('13. Dos intentos simultáneos de aprovisionamiento del mismo ítem: no duplican operaciones externas', async () => {
  const orderId = 'ord_concurrent_item_' + Date.now();
  const domainName = 'concurrency-domain-test.com';
  const sku = 'domain-com';

  const dummyOrder = {
    id: orderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku,
        category: 'DOMAIN',
        domain: domainName,
        registrant: {
          name: 'Registro Valido',
          email: 'valido@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Insurgentes Sur 100',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '03900'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyOrder as any });

  // Pre-crear la operación en estado IN_PROGRESS
  const opKey = `${orderId}:${sku}:${domainName}`;
  await prisma.provisioningOperation.create({
    data: {
      operationKey: opKey,
      orderId,
      sku,
      domain: domainName,
      action: 'register',
      status: 'IN_PROGRESS',
      attempts: 1
    }
  });

  try {
    let mockCalled = false;
    const result = await provisionPaidOrder(orderId, {
      bridgeFetch: async () => {
        mockCalled = true;
        return new Response('{}', { status: 200 });
      }
    });

    assert.equal(result.success, false);
    assert.equal(mockCalled, false, 'No debe llamar al proveedor si la operación ya está en curso');
    assert.match(result.error || '', /en curso/);
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 14. ResellerClub acepta una solicitud, pero la respuesta se pierde: no se reenvía a ciegas
// ============================================================================
test('14. ResellerClub acepta una solicitud, pero la respuesta se pierde: no se reenvía a ciegas', async () => {
  const orderId = 'ord_lost_resp_' + Date.now();
  const domainName = 'lost-response-test.com';
  const sku = 'domain-com';

  const dummyOrder = {
    id: orderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku,
        category: 'DOMAIN',
        domain: domainName,
        registrant: {
          name: 'Registro Perdido',
          email: 'perdido@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Paseo de la Reforma 500',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '06500'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyOrder as any });

  try {
    // 14a. Simular error de red / timeout tras enviar
    const firstAttempt = await provisionPaidOrder(orderId, {
      bridgeFetch: async () => {
        throw new Error('Timeout al esperar respuesta del socket del proveedor');
      }
    });

    assert.equal(firstAttempt.success, false);

    // Verificar que en base de datos quedó como UNCERTAIN
    const op = await prisma.provisioningOperation.findUnique({
      where: { operationKey: `${orderId}:${sku}:${domainName}` }
    });
    assert.equal(op?.status, 'UNCERTAIN');

    // 14b. Reintento: NO debe reenviar a ciegas a ResellerClub
    let secondFetchCalled = false;
    const retryAttempt = await retryProvisionOrder(orderId, {
      bridgeFetch: async () => {
        secondFetchCalled = true;
        return new Response('{}', { status: 200 });
      }
    });

    assert.equal(retryAttempt.success, false);
    assert.equal(secondFetchCalled, false, 'No debe reenviar la solicitud a ciegas con resultado incierto');
    assert.match(retryAttempt.error || '', /incierto/i);
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 15. Una orden con varios dominios y un fallo parcial: no se repiten los dominios ya confirmados
// ============================================================================
test('15. Una orden con varios dominios y un fallo parcial: no se repiten los dominios ya confirmados', async () => {
  const orderId = 'ord_multi_domain_' + Date.now();
  const domainA = 'dominio-confirmado-a.com';
  const domainB = 'dominio-pendiente-b.com';

  const multiOrder = {
    id: orderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 20.0,
    tax: 0,
    total: 20.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: domainA,
        registrant: {
          name: 'Registro Multi',
          email: 'multi@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Av Universidad 100',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '03100'
        }
      },
      {
        sku: 'domain-net',
        category: 'DOMAIN',
        domain: domainB,
        registrant: {
          name: 'Registro Multi',
          email: 'multi@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Av Universidad 100',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '03100'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: multiOrder as any });

  // Pre-confirmar dominio A en base de datos
  await prisma.provisioningOperation.create({
    data: {
      operationKey: `${orderId}:domain-com:${domainA}`,
      orderId,
      sku: 'domain-com',
      domain: domainA,
      action: 'register',
      status: 'CONFIRMED',
      providerOrderId: 'RC_ORDER_DOM_A',
      attempts: 1
    }
  });

  try {
    const calledDomains: string[] = [];

    const result = await provisionPaidOrder(orderId, {
      bridgeFetch: async (_url, init) => {
        const body = JSON.parse((init?.body as string) || '{}');
        calledDomains.push(body.domain);
        return new Response(
          JSON.stringify({
            success: true,
            action: 'register',
            domain: body.domain,
            orderId: 'RC_ORDER_DOM_B',
            status: 'PROVISIONED'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(result.success, true);
    // Solo debe llamarse para dominio B; dominio A se recupera sin re-ejecución
    assert.deepEqual(calledDomains, [domainB]);
    assert.equal(result.results?.length, 2);
    assert.equal(result.results?.[0]?.providerOrderId, 'RC_ORDER_DOM_A');
    assert.equal(result.results?.[1]?.providerOrderId, 'RC_ORDER_DOM_B');
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 16. Registro pendiente: no se marca falsamente PROVISIONED
// ============================================================================
test('16. Registro pendiente: no se marca falsamente PROVISIONED', async () => {
  const orderId = 'ord_pending_reg_' + Date.now();
  const domainName = 'registro-pendiente.com';

  const dummyOrder = {
    id: orderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 10.0,
    tax: 0,
    total: 10.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: domainName,
        registrant: {
          name: 'Registro Pendiente',
          email: 'pendiente@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Av Insurgentes 500',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '03100'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyOrder as any });

  try {
    const result = await provisionPaidOrder(orderId, {
      bridgeFetch: async () => {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'register',
            domain: domainName,
            orderId: 'RC_PENDING_112233',
            status: 'PENDING_REGISTRATION'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(result.success, true);
    assert.notEqual(result.status, 'PROVISIONED', 'No debe marcarse como PROVISIONED');
    assert.equal(result.status, 'PROVISIONING');
    assert.equal(result.results?.[0]?.status, 'PENDING');

    const inDb = await prisma.order.findUnique({ where: { id: orderId } });
    assert.equal(inDb?.provisionStatus, 'PROVISIONING');
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 17. Transferencia aceptada: permanece pendiente de finalización
// ============================================================================
test('17. Transferencia aceptada: permanece pendiente de finalización', async () => {
  const orderId = 'ord_trans_pending_' + Date.now();
  const domainName = 'transfer-permanece-pendiente.com';

  const dummyOrder = {
    id: orderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 12.99,
    tax: 0,
    total: 12.99,
    items: [
      {
        sku: 'DOMAIN_TRANSFER',
        category: 'DOMAIN',
        isTransfer: true,
        domain: domainName,
        eppCode: 'AuthSecret123!',
        registrant: {
          name: 'Registrante Transfer',
          email: 'admin@transfer-permanece-pendiente.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Paseo de la Reforma 222',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          postalCode: '06600'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyOrder as any });

  try {
    const result = await provisionPaidOrder(orderId, {
      bridgeFetch: async () => {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'transfer',
            domain: domainName,
            orderId: 'RC_TRANS_987',
            status: 'TRANSFER_INITIATED'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'PROVISIONING', 'Transferencia aceptada permanece PROVISIONING');
    assert.equal(result.results?.[0]?.status, 'TRANSFER_INITIATED');

    const inDb = await prisma.order.findUnique({ where: { id: orderId } });
    assert.equal(inDb?.provisionStatus, 'PROVISIONING');
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 18. OXXO con importe o moneda incorrectos: rechazado
// ============================================================================
test('18. OXXO con importe o moneda incorrectos: rechazado', () => {
  const oxxoOrder = {
    id: 'ord_oxxo_val_18',
    gatewayReference: 'pi_oxxo_test_18',
    paymentMethod: 'OXXO_PAY',
    currency: 'USD',
    total: 25.0,
    items: [
      {
        _paymentMetadata: true,
        method: 'OXXO_PAY',
        paymentIntentId: 'pi_oxxo_test_18',
        expectedAmountCents: 45625, // 456.25 MXN
        expectedCurrency: 'mxn',
        fxRate: 18.25,
        orderTotalUSD: 25.0,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // 18a. Moneda incorrecta (USD en vez de MXN)
  const wrongCurrencyEvent = {
    id: 'pi_oxxo_test_18',
    status: 'succeeded',
    currency: 'usd',
    amount: 2500,
    amount_received: 2500
  };
  const resCurrency = validateStripePaymentIntentForOrder(oxxoOrder, wrongCurrencyEvent);
  assert.equal(resCurrency.valid, false);
  assert.match(resCurrency.error || '', /Moneda inconsistente para pago OXXO/);

  // 18b. Importe alterado en MXN
  const wrongAmountEvent = {
    id: 'pi_oxxo_test_18',
    status: 'succeeded',
    currency: 'mxn',
    amount: 30000,
    amount_received: 30000
  };
  const resAmount = validateStripePaymentIntentForOrder(oxxoOrder, wrongAmountEvent);
  assert.equal(resAmount.valid, false);
  assert.match(resAmount.error || '', /El importe cobrado en OXXO no coincide/);
});

// ============================================================================
// 19. Tarjeta con importe, moneda o PaymentIntent incorrectos: rechazada
// ============================================================================
test('19. Tarjeta con importe, moneda o PaymentIntent incorrectos: rechazada', () => {
  const cardOrder = {
    id: 'ord_card_val_19',
    gatewayReference: 'pi_card_valid_19',
    paymentMethod: 'STRIPE_CARD',
    currency: 'USD',
    total: 20.0,
    items: [
      {
        _paymentMetadata: true,
        method: 'STRIPE_CARD',
        paymentIntentId: 'pi_card_valid_19',
        expectedAmountCents: 2000,
        expectedCurrency: 'usd',
        orderTotalUSD: 20.0,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // 19a. PaymentIntent ajeno a la orden
  const wrongPiEvent = {
    id: 'pi_card_DIFF_99',
    status: 'succeeded',
    currency: 'usd',
    amount: 2000,
    amount_received: 2000
  };
  const resPi = validateStripePaymentIntentForOrder(cardOrder, wrongPiEvent);
  assert.equal(resPi.valid, false);
  assert.match(resPi.error || '', /no coincide con la orden/);

  // 19b. Importe menor
  const wrongAmountEvent = {
    id: 'pi_card_valid_19',
    status: 'succeeded',
    currency: 'usd',
    amount: 1500,
    amount_received: 1500
  };
  const resAmount = validateStripePaymentIntentForOrder(cardOrder, wrongAmountEvent);
  assert.equal(resAmount.valid, false);
  assert.match(resAmount.error || '', /Importe cobrado no coincide con la orden/);

  // 19c. Moneda diferente
  const wrongCurrencyEvent = {
    id: 'pi_card_valid_19',
    status: 'succeeded',
    currency: 'eur',
    amount: 2000,
    amount_received: 2000
  };
  const resCurrency = validateStripePaymentIntentForOrder(cardOrder, wrongCurrencyEvent);
  assert.equal(resCurrency.valid, false);
  assert.match(resCurrency.error || '', /Moneda inconsistente/);
});

// ============================================================================
// 20. Hosting, correo y SSL sin integración real: no se marcan como aprovisionados
// ============================================================================
test('20. Hosting, correo y SSL sin integración real: no se marcan como aprovisionados', async () => {
  const dummyHostingOrder = {
    id: 'ord_hosting_only_' + Date.now(),
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 15.0,
    tax: 0,
    total: 15.0,
    items: [
      {
        sku: 'hosting-cloud-nvme-plus',
        category: 'HOSTING',
        name: 'Cloud Hosting NVMe Plus'
      },
      {
        sku: 'ssl-wildcard-annual',
        category: 'SSL',
        name: 'Certificado SSL Wildcard'
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyHostingOrder as any });

  try {
    const result = await provisionPaidOrder(created.id);
    assert.equal(result.success, true);
    assert.equal(result.status, 'NONE', 'Servicios complementarios deben conservar status NONE');
    assert.match(result.message || '', /Sin dominios para aprovisionar/);

    const inDb = await prisma.order.findUnique({ where: { id: created.id } });
    assert.equal(inDb?.provisionStatus, 'NONE');
    assert.match(inDb?.failureReason || '', /requiere flujo específico o manual/);
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

// ============================================================================
// 21. Reintento de aprovisionamiento tras fallo: recupera orden y procesa exitosamente
// ============================================================================
test('21. Reintento de aprovisionamiento tras fallo: recupera orden y procesa exitosamente', async () => {
  const retryOrderId = 'ord_retry_test_' + Date.now();
  const domainName = 'banelio-retry-test.com';

  const orderData = {
    id: retryOrderId,
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'FAILED',
    failureReason: 'Error transitorio previo de conexión.',
    currency: 'USD',
    subtotal: 12.0,
    tax: 0,
    total: 12.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: domainName,
        registrant: {
          name: 'Cliente Reintento',
          email: 'retry@banelio.com',
          phone: '5512345678',
          phone_cc: '52',
          address: 'Av. Reforma 100',
          city: 'CDMX',
          state: 'CDMX',
          country: 'MX',
          zipcode: '06600'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: orderData as any });

  try {
    let bridgeCalled = false;
    const result = await retryProvisionOrder(retryOrderId, {
      bridgeFetch: async () => {
        bridgeCalled = true;
        return new Response(
          JSON.stringify({
            success: true,
            action: 'register',
            domain: domainName,
            orderId: 'RC_ORDER_RETRY_123',
            status: 'SUCCESS'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'PROVISIONED');
    assert.equal(bridgeCalled, true);

    const updatedOrder = await prisma.order.findUnique({ where: { id: retryOrderId } });
    assert.equal(updatedOrder?.provisionStatus, 'PROVISIONED');
    assert.equal(updatedOrder?.failureReason, null);

    const op = await prisma.provisioningOperation.findUnique({
      where: { operationKey: `${retryOrderId}:domain-com:${domainName}` }
    });
    assert.equal(op?.status, 'CONFIRMED');
    assert.equal(op?.providerOrderId, 'RC_ORDER_RETRY_123');
  } finally {
    await prisma.provisioningOperation.deleteMany({ where: { orderId: retryOrderId } });
    await prisma.order.delete({ where: { id: retryOrderId } });
  }
});

// ============================================================================
// 22. Validación de transferencia: exige Auth/EPP Code y no lo expone en la orden pública
// ============================================================================
test('22. Validación de transferencia: exige Auth/EPP Code y no lo expone en la orden pública', async () => {
  await seedCatalog(prisma);

  // 22a. Sin código EPP debe arrojar error de validación
  await assert.rejects(
    async () => {
      await createOrder({
        items: [
          {
            sku: 'DOMAIN_TRANSFER',
            domain: 'transfer-no-epp.com',
            isTransfer: true
            // sin eppCode
          }
        ]
      });
    },
    (err: any) => {
      assert.ok(err instanceof OrderValidationError);
      assert.equal(err.status, 400);
      assert.match(err.message, /Auth\/EPP es obligatorio/i);
      return true;
    }
  );

  // 22b. Con código EPP inválido (< 6 caracteres)
  await assert.rejects(
    async () => {
      await createOrder({
        items: [
          {
            sku: 'DOMAIN_TRANSFER',
            domain: 'transfer-short-epp.com',
            isTransfer: true,
            eppCode: '123'
          }
        ]
      });
    },
    (err: any) => {
      assert.ok(err instanceof OrderValidationError);
      assert.equal(err.status, 400);
      assert.match(err.message, /entre 6 y 32 caracteres/i);
      return true;
    }
  );

  // 22c. Con código EPP válido: se crea y se sanitiza en toPublicOrder (hasEppCode: true sin filtrar el texto plano)
  const validTransferOrder = await createOrder({
    countryCode: 'MX',
    items: [
      {
        sku: 'DOMAIN_TRANSFER',
        domain: 'transfer-valid-epp.com',
        isTransfer: true,
        eppCode: 'SecretAuthCode123!'
      }
    ]
  });

  try {
    assert.ok(validTransferOrder.order.id);
    const publicItem = validTransferOrder.order.items[0];
    assert.equal(publicItem.hasEppCode, true);
    assert.equal(publicItem.eppCode, undefined, 'El código EPP no debe exponerse en texto plano en la orden pública');

    // Comprobar que en la base de datos el valor completo sí fue almacenado de forma segura
    const stored = await prisma.order.findUnique({ where: { id: validTransferOrder.order.id } });
    const storedItems = stored?.items as any[];
    assert.equal(storedItems[0].eppCode, 'SecretAuthCode123!');
  } finally {
    await prisma.order.delete({ where: { id: validTransferOrder.order.id } });
  }
});

// ============================================================================
// 23. Creación server-authoritative de orden: precios e impuestos calculados en backend
// ============================================================================
test('23. Creación server-authoritative de orden: precios e impuestos calculados en backend', async () => {
  const result = await createOrder({
    countryCode: 'MX',
    items: [
      {
        sku: 'domain-com',
        quantity: 1,
        periodYearsOrMonths: 1,
        periodUnit: 'year'
      }
    ],
    customer: {
      registrant: {
        country: 'MX'
      }
    }
  });

  try {
    const { order } = result;
    assert.ok(order.id);
    assert.equal(order.status, 'CREATED');
    assert.equal(order.paymentStatus, 'PENDING_PAYMENT');
    assert.equal(order.currency, 'USD');

    // El catálogo tiene domain-com (precio retail authoritativo)
    const catalogItem = await prisma.catalogItem.findUnique({ where: { sku: 'domain-com' } });
    const expectedSubtotal = Number(catalogItem?.price);
    assert.equal(order.subtotal, expectedSubtotal);

    // Impuesto México (16% IVA)
    const expectedTax = Math.round(expectedSubtotal * 0.16 * 100) / 100;
    assert.equal(order.tax, expectedTax);
    assert.equal(order.total, Math.round((expectedSubtotal + expectedTax) * 100) / 100);
  } finally {
    await prisma.order.delete({ where: { id: result.order.id } });
  }
});

