import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStripePaymentIntentForOrder,
  isStripeEventProcessed,
  markStripeEventProcessed,
  clearProcessedStripeEvents,
  getOrderPaymentMetadata,
  PaymentMetadata
} from './payments';
import { provisionPaidOrder, getBridgeBaseUrl } from './provisioning';
import { prisma } from './db';

test('1. Pagos OXXO en MXN: validación correcta contra referencia esperada', () => {
  const oxxoOrder = {
    id: 'ord_oxxo_test_1',
    gatewayReference: 'pi_oxxo_123',
    paymentMethod: 'OXXO_PAY',
    currency: 'USD',
    total: 20.0,
    items: [
      { sku: 'domain-com', name: '.com', price: 20.0 },
      {
        _paymentMetadata: true,
        method: 'OXXO_PAY',
        paymentIntentId: 'pi_oxxo_123',
        expectedAmountCents: 36500, // 365.00 MXN (e.g. rate 18.25)
        expectedCurrency: 'mxn',
        fxRate: 18.25,
        orderTotalUSD: 20.0,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // Evento válido de Stripe para OXXO en MXN
  const validOxxoEvent = {
    id: 'pi_oxxo_123',
    status: 'succeeded',
    currency: 'mxn',
    amount: 36500,
    amount_received: 36500
  };

  const result = validateStripePaymentIntentForOrder(oxxoOrder, validOxxoEvent);
  assert.equal(result.valid, true);
  assert.equal(result.expectedAmountCents, 36500);
  assert.equal(result.expectedCurrency, 'mxn');
});

test('2. Pagos OXXO en MXN: rechazo estricto si la moneda o importe son inconsistentes', () => {
  const oxxoOrder = {
    id: 'ord_oxxo_test_2',
    gatewayReference: 'pi_oxxo_456',
    paymentMethod: 'OXXO_PAY',
    currency: 'USD',
    total: 10.0,
    items: [
      {
        _paymentMetadata: true,
        method: 'OXXO_PAY',
        paymentIntentId: 'pi_oxxo_456',
        expectedAmountCents: 18250, // 182.50 MXN
        expectedCurrency: 'mxn',
        fxRate: 18.25,
        orderTotalUSD: 10.0,
        createdAt: new Date().toISOString()
      }
    ]
  };

  // Error: cobrado en USD (no es OXXO válido)
  const usdEvent = {
    id: 'pi_oxxo_456',
    status: 'succeeded',
    currency: 'usd',
    amount: 1000,
    amount_received: 1000
  };
  const resCurrency = validateStripePaymentIntentForOrder(oxxoOrder, usdEvent);
  assert.equal(resCurrency.valid, false);
  assert.match(resCurrency.error || '', /Moneda inconsistente para pago OXXO/);

  // Error: cobrado en MXN pero importe menor o alterado
  const wrongAmountEvent = {
    id: 'pi_oxxo_456',
    status: 'succeeded',
    currency: 'mxn',
    amount: 15000,
    amount_received: 15000
  };
  const resAmount = validateStripePaymentIntentForOrder(oxxoOrder, wrongAmountEvent);
  assert.equal(resAmount.valid, false);
  assert.match(resAmount.error || '', /El importe cobrado en OXXO no coincide con el voucher esperado/);

  // Error: datos de referencia ausentes en la orden
  const corruptOrder = {
    id: 'ord_oxxo_corrupt',
    gatewayReference: 'pi_oxxo_456',
    paymentMethod: 'OXXO_PAY',
    currency: 'USD',
    total: 10.0,
    items: []
  };
  const resCorrupt = validateStripePaymentIntentForOrder(corruptOrder, {
    id: 'pi_oxxo_456',
    status: 'succeeded',
    currency: 'mxn',
    amount_received: 18250
  });
  assert.equal(resCorrupt.valid, false);
  assert.match(resCorrupt.error || '', /Referencia de importe OXXO MXN esperado ausente/);
});

test('3. Pagos con tarjeta (Stripe card): validación en USD e importe de orden', () => {
  const cardOrder = {
    id: 'ord_card_test_1',
    gatewayReference: 'pi_card_789',
    paymentMethod: 'STRIPE_CARD',
    currency: 'USD',
    total: 15.5,
    items: [
      {
        sku: 'domain-net',
        name: '.net',
        price: 15.5
      },
      {
        _paymentMetadata: true,
        method: 'STRIPE_CARD',
        paymentIntentId: 'pi_card_789',
        expectedAmountCents: 1550,
        expectedCurrency: 'usd',
        orderTotalUSD: 15.5,
        createdAt: new Date().toISOString()
      }
    ]
  };

  const validCardEvent = {
    id: 'pi_card_789',
    status: 'succeeded',
    currency: 'usd',
    amount: 1550,
    amount_received: 1550
  };

  const result = validateStripePaymentIntentForOrder(cardOrder, validCardEvent);
  assert.equal(result.valid, true);
  assert.equal(result.expectedAmountCents, 1550);
  assert.equal(result.expectedCurrency, 'usd');

  // Rechazo por importe incorrecto
  const wrongCardAmount = {
    id: 'pi_card_789',
    status: 'succeeded',
    currency: 'usd',
    amount: 1000,
    amount_received: 1000
  };
  const resWrong = validateStripePaymentIntentForOrder(cardOrder, wrongCardAmount);
  assert.equal(resWrong.valid, false);
  assert.match(resWrong.error || '', /Importe cobrado no coincide con la orden/);
});

test('4. Eventos duplicados: deduplicación e idempotencia de webhook', () => {
  clearProcessedStripeEvents();

  const eventId = 'evt_test_dedup_001';
  assert.equal(isStripeEventProcessed(eventId), false);

  markStripeEventProcessed(eventId);
  assert.equal(isStripeEventProcessed(eventId), true);

  // Segundo evento idéntico es detectado
  assert.equal(isStripeEventProcessed(eventId), true);

  clearProcessedStripeEvents();
  assert.equal(isStripeEventProcessed(eventId), false);
});

test('5. Órdenes no pagadas: aprovisionamiento no permitido', async () => {
  const dummyUnpaidOrder = {
    id: 'ord_unpaid_test_' + Date.now(),
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
        name: '.com',
        category: 'DOMAIN',
        domain: 'unpaid-domain-test.com'
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

test('6. Aprovisionamiento idempotente: orden ya PROVISIONED no repite llamadas al proveedor', async () => {
  const dummyProvisionedOrder = {
    id: 'ord_already_prov_' + Date.now(),
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'PROVISIONED',
    currency: 'USD',
    subtotal: 12.0,
    tax: 0,
    total: 12.0,
    items: [
      {
        sku: 'domain-com',
        category: 'DOMAIN',
        domain: 'already-prov.com'
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyProvisionedOrder as any });

  try {
    let mockFetchCalled = false;
    const result = await provisionPaidOrder(created.id, {
      bridgeFetch: async () => {
        mockFetchCalled = true;
        return new Response('{}', { status: 200 });
      }
    });

    assert.equal(result.success, true);
    assert.equal(result.status, 'PROVISIONED');
    assert.equal(result.idempotent, true);
    assert.equal(mockFetchCalled, false, 'No debe invocar al bridge si la orden ya está PROVISIONED');
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

test('7. Transferencias de dominios: requiere código EPP y datos obligatorios de contacto', async () => {
  // Orden con transferencia sin EPP Code
  const dummyTransferNoEpp = {
    id: 'ord_trans_no_epp_' + Date.now(),
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
        domain: 'midominio-transfer.com'
        // Falta eppCode
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyTransferNoEpp as any });

  try {
    const result = await provisionPaidOrder(created.id);
    assert.equal(result.success, false);
    assert.equal(result.status, 'FAILED');
    assert.match(result.error || '', /El código Auth\/EPP es obligatorio/);

    const refreshed = await prisma.order.findUnique({ where: { id: created.id } });
    assert.equal(refreshed?.provisionStatus, 'FAILED');
    assert.match(refreshed?.failureReason || '', /Auth\/EPP/);
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

test('8. Aprovisionamiento verificable: confirmación real con provider orderId y manejo de errores', async () => {
  const dummyOrderSuccess = {
    id: 'ord_prov_success_' + Date.now(),
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
        domain: 'banelio-test-prov.com',
        registrant: {
          name: 'Admin Banelio',
          email: 'contacto@banelio.com',
          phone: '6691234567',
          address: 'Av del Mar 10',
          city: 'Mazatlan',
          country: 'MX'
        }
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyOrderSuccess as any });

  try {
    // 8a. Simulación de confirmación verificable desde el bridge de ResellerClub
    const successResult = await provisionPaidOrder(created.id, {
      bridgeFetch: async () => {
        return new Response(
          JSON.stringify({
            success: true,
            action: 'register',
            domain: 'banelio-test-prov.com',
            orderId: 'RC_ORDER_987654',
            status: 'PROVISIONED'
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(successResult.success, true);
    assert.equal(successResult.status, 'PROVISIONED');
    assert.equal(successResult.results?.[0]?.providerOrderId, 'RC_ORDER_987654');

    const orderInDb = await prisma.order.findUnique({ where: { id: created.id } });
    assert.equal(orderInDb?.provisionStatus, 'PROVISIONED');
    assert.equal(orderInDb?.failureReason, null);

    // 8b. Si el bridge responde con error (ej. endpoint no desplegado o rechazo de ResellerClub), NUNCA fingir éxito
    const dummyOrderFail = await prisma.order.create({
      data: {
        ...dummyOrderSuccess,
        id: 'ord_prov_fail_' + Date.now(),
        provisionStatus: 'NONE'
      } as any
    });

    const failResult = await provisionPaidOrder(dummyOrderFail.id, {
      bridgeFetch: async () => {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Dominio no disponible o fondos insuficientes en cuenta mayorista.'
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
    });

    assert.equal(failResult.success, false);
    assert.equal(failResult.status, 'FAILED');
    assert.match(failResult.error || '', /Dominio no disponible/);

    const failInDb = await prisma.order.findUnique({ where: { id: dummyOrderFail.id } });
    assert.equal(failInDb?.provisionStatus, 'FAILED');
    assert.match(failInDb?.failureReason || '', /Dominio no disponible/);

    await prisma.order.delete({ where: { id: dummyOrderFail.id } });
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});

test('9. Servicios complementarios (Hosting / Correo / SSL): no se activan automáticamente', async () => {
  const dummyHostingOrder = {
    id: 'ord_hosting_only_' + Date.now(),
    customerId: null,
    status: 'PAID',
    paymentStatus: 'PAYMENT_CONFIRMED',
    provisionStatus: 'NONE',
    currency: 'USD',
    subtotal: 5.0,
    tax: 0,
    total: 5.0,
    items: [
      {
        sku: 'hosting-plan-starter-month',
        category: 'HOSTING',
        name: 'Cloud Starter NVMe (Mensual)'
      }
    ]
  };

  const created = await prisma.order.create({ data: dummyHostingOrder as any });

  try {
    const result = await provisionPaidOrder(created.id);
    assert.equal(result.success, true);
    assert.equal(result.status, 'NONE');
    assert.match(result.message || '', /Sin dominios para aprovisionar/);

    const inDb = await prisma.order.findUnique({ where: { id: created.id } });
    assert.equal(inDb?.provisionStatus, 'NONE');
  } finally {
    await prisma.order.delete({ where: { id: created.id } });
  }
});
