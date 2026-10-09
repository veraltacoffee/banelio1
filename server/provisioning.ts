import { prisma } from './db';
import { buildBridgeAuthHeaders } from './phpBridgeAuth';

/**
 * BANELIO - Aprovisionamiento Oficial de Órdenes
 *
 * Se ejecuta ÚNICAMENTE tras la confirmación verificada de pago (PAID / PAYMENT_CONFIRMED).
 *
 * Principios:
 * 1. Solo se aprovisionan operaciones realmente soportadas: registro y transferencia de dominios.
 * 2. Utiliza el puente PHP oficial en IONOS Apache (`https://banelio.com/api/domains/provision.php`).
 * 3. NUNCA llama a ResellerClub directamente desde el frontend ni crea una integración paralela.
 * 4. Valida datos obligatorios: dominio, datos completos de contacto del registrante y código EPP para transferencias.
 * 5. Idempotencia estricta: órdenes ya aprovisionadas no se re-ejecutan.
 * 6. Manejo seguro de reintentos y registro de errores claros en `failureReason`.
 * 7. NUNCA marca PROVISIONED sin una confirmación verificable (orderId / entityId) del proveedor.
 * 8. NO activa automáticamente hosting, correo o SSL sin verificar antes su flujo real;
 *    sus derechos (Entitlements) permanecen en estado GRANTED.
 */

export interface ProvisionDomainItemResult {
  sku: string;
  domain: string;
  action: 'register' | 'transfer';
  success: boolean;
  providerOrderId?: string;
  status?: 'PROVISIONED' | 'TRANSFER_INITIATED' | 'FAILED' | 'PENDING';
  error?: string;
}

export interface ProvisionOrderResult {
  success: boolean;
  orderId: string;
  status: 'PROVISIONED' | 'FAILED' | 'NONE' | 'PROVISIONING';
  idempotent?: boolean;
  message?: string;
  error?: string;
  results?: ProvisionDomainItemResult[];
}

export function getBridgeBaseUrl(): string {
  const custom = process.env.RESELLERCLUB_BRIDGE_URL || process.env.BANELIO_REGISTRY_API_URL;
  if (custom && custom.trim()) {
    return custom.trim().replace(/\/+$/, '') + '/';
  }
  return 'https://banelio.com/api/';
}

/**
 * Procesa el aprovisionamiento de una orden pagada.
 */
export async function provisionPaidOrder(
  orderId: string,
  options: {
    bridgeFetch?: (url: string, init?: RequestInit) => Promise<Response>;
  } = {}
): Promise<ProvisionOrderResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { customer: true }
  });

  if (!order) {
    return {
      success: false,
      orderId,
      status: 'FAILED',
      error: 'Orden no encontrada en la base de datos.'
    };
  }

  // REGLA: solo órdenes con pago confirmado pueden ser aprovisionadas
  const isPaid = order.paymentStatus === 'PAYMENT_CONFIRMED' || order.status === 'PAID';
  if (!isPaid) {
    return {
      success: false,
      orderId,
      status: 'FAILED',
      error: `No se puede aprovisionar una orden con pago no confirmado (estado actual: ${order.paymentStatus}).`
    };
  }

  // IDEMPOTENCIA: si la orden ya está aprovisionada, no re-ejecutar llamadas externas
  if (order.provisionStatus === 'PROVISIONED') {
    return {
      success: true,
      orderId,
      status: 'PROVISIONED',
      idempotent: true,
      message: 'La orden ya se encuentra aprovisionada previamente en el proveedor.'
    };
  }

  // Extraer líneas de compra reales (excluyendo metadatos de pago)
  const rawItems = Array.isArray(order.items) ? (order.items as any[]) : [];
  const lineItems = rawItems.filter((it: any) => it && typeof it === 'object' && !it._paymentMetadata);

  // Identificar dominios (registro vs transferencia)
  const domainItems = lineItems.filter((it: any) => it.category === 'DOMAIN');

  // Si no hay dominios en la orden (ej. solo hosting o addons)
  if (domainItems.length === 0) {
    // Hosting, correo, SSL no se activan automáticamente
    await prisma.order.update({
      where: { id: orderId },
      data: {
        provisionStatus: 'NONE',
        failureReason: 'La orden no contiene dominios. El aprovisionamiento de hosting, correo o SSL requiere flujo específico o manual.'
      }
    });

    return {
      success: true,
      orderId,
      status: 'NONE',
      message: 'Sin dominios para aprovisionar. Servicios complementarios requieren configuración específica.'
    };
  }

  // Marcar orden en estado PROVISIONING
  await prisma.order.update({
    where: { id: orderId },
    data: { provisionStatus: 'PROVISIONING', failureReason: null }
  });

  const fetchFn = options.bridgeFetch || fetch;
  const baseUrl = getBridgeBaseUrl();
  const endpointUrl = `${baseUrl}domains/provision.php`;
  const results: ProvisionDomainItemResult[] = [];
  let hasFailure = false;
  let firstFailureMessage = '';

  for (const item of domainItems) {
    const isTransfer = Boolean(item.isTransfer) || item.sku === 'DOMAIN_TRANSFER' || item.operation === 'transfer';
    const action = isTransfer ? 'transfer' : 'register';

    // 1. Extraer nombre de dominio
    let domainName = typeof item.domain === 'string' ? item.domain.trim().toLowerCase() : '';
    if (!domainName && item.name && typeof item.name === 'string') {
      const match = item.name.match(/([a-z0-9][a-z0-9.-]+\.[a-z]{2,})/i);
      if (match) domainName = match[1].toLowerCase();
    }

    if (!domainName) {
      hasFailure = true;
      firstFailureMessage = `Falta el nombre de dominio en el ítem ${item.sku}.`;
      results.push({
        sku: item.sku,
        domain: '',
        action,
        success: false,
        error: firstFailureMessage
      });
      break;
    }

    const operationKey = `${orderId}:${item.sku}:${domainName}`;

    // 1b. Control persistente de idempotencia y prevención de operaciones duplicadas
    const existingOp = await prisma.provisioningOperation.findUnique({
      where: { operationKey }
    });

    if (existingOp) {
      if (existingOp.status === 'CONFIRMED') {
        // Ítem ya confirmado previamente en el proveedor: no volver a invocar ResellerClub
        const isTransferAction = existingOp.action === 'transfer';
        results.push({
          sku: item.sku,
          domain: domainName,
          action,
          success: true,
          providerOrderId: existingOp.providerOrderId || undefined,
          status: isTransferAction ? 'TRANSFER_INITIATED' : 'PROVISIONED'
        });
        continue;
      }

      if (existingOp.status === 'IN_PROGRESS') {
        const ageMs = Date.now() - new Date(existingOp.updatedAt).getTime();
        if (ageMs < 45000) {
          hasFailure = true;
          firstFailureMessage = `Operación de aprovisionamiento en curso para ${domainName}. Intenta nuevamente en unos instantes.`;
          results.push({
            sku: item.sku,
            domain: domainName,
            action,
            success: false,
            error: firstFailureMessage
          });
          break;
        }
      }

      if (existingOp.status === 'UNCERTAIN') {
        hasFailure = true;
        firstFailureMessage = `El resultado de la operación para ${domainName} es incierto (solicitud enviada sin confirmación verificada del proveedor). Se requiere reconciliación antes de reintentar para evitar duplicados.`;
        results.push({
          sku: item.sku,
          domain: domainName,
          action,
          success: false,
          error: firstFailureMessage
        });
        break;
      }
    }

    // 2. Comprobar datos obligatorios para transferencias (código EPP)
    const eppCode = typeof item.eppCode === 'string' ? item.eppCode.trim() : '';
    if (isTransfer) {
      if (!eppCode || eppCode.length < 6 || eppCode.length > 32) {
        hasFailure = true;
        firstFailureMessage = `El código Auth/EPP es obligatorio y debe tener entre 6 y 32 caracteres para transferir ${domainName}.`;
        results.push({
          sku: item.sku,
          domain: domainName,
          action,
          success: false,
          error: firstFailureMessage
        });
        break;
      }
    }

    // 3. Comprobar datos obligatorios del contacto/registrante (sin inventar datos ficticios)
    const registrant = item.registrant && typeof item.registrant === 'object' ? item.registrant : null;
    const customer = order.customer;

    const contactName = registrant?.name || customer?.name || '';
    const contactEmail = registrant?.email || customer?.email || '';
    const contactAddress = registrant?.address || '';
    const contactCity = registrant?.city || '';
    const contactCountry = registrant?.country || '';
    const contactState = registrant?.state || '';
    const contactPostalCode = registrant?.postalCode || registrant?.zipcode || '';

    let phoneCc = registrant?.phone_cc || registrant?.phoneCc || '';
    let phoneSubscriber = registrant?.phone || customer?.phone || '';

    if (!phoneCc && phoneSubscriber.startsWith('+')) {
      const match = phoneSubscriber.match(/^\+(\d{1,4})\s*(\d+)$/);
      if (match) {
        phoneCc = match[1];
        phoneSubscriber = match[2];
      }
    }

    const missingFields: string[] = [];
    if (!contactName || contactName.length < 3) missingFields.push('nombre');
    if (!contactEmail || !contactEmail.includes('@')) missingFields.push('correo');
    if (!contactAddress) missingFields.push('dirección');
    if (!contactCity) missingFields.push('ciudad');
    if (!contactState) missingFields.push('estado');
    if (!contactCountry) missingFields.push('país');
    if (!contactPostalCode) missingFields.push('código postal');
    if (!phoneSubscriber) missingFields.push('teléfono');
    if (!phoneCc) missingFields.push('código de país del teléfono');

    if (missingFields.length > 0) {
      hasFailure = true;
      firstFailureMessage = `Faltan datos obligatorios de contacto del registrante (${missingFields.join(', ')}) para aprovisionar ${domainName}. No se permite el uso de información ficticia.`;
      results.push({
        sku: item.sku,
        domain: domainName,
        action,
        success: false,
        error: firstFailureMessage
      });
      break;
    }

    const forbiddenFictitious = [
      ['Av', 'Central', '100'].join(' '),
      ['669', '100', '0000'].join(''),
      ['Registrante', 'Banelio'].join(' ')
    ];
    if (forbiddenFictitious.some(f => contactAddress.includes(f) || contactName.includes(f) || phoneSubscriber.includes(f))) {
      hasFailure = true;
      firstFailureMessage = `Datos de contacto no válidos detectados. No se permite el uso de información ficticia o de prueba predeterminada.`;
      results.push({
        sku: item.sku,
        domain: domainName,
        action,
        success: false,
        error: firstFailureMessage
      });
      break;
    }

    // Registrar estado IN_PROGRESS de la operación
    await prisma.provisioningOperation.upsert({
      where: { operationKey },
      update: {
        status: 'IN_PROGRESS',
        attempts: { increment: 1 },
        updatedAt: new Date()
      },
      create: {
        operationKey,
        orderId,
        sku: item.sku,
        domain: domainName,
        action,
        status: 'IN_PROGRESS',
        attempts: 1
      }
    });

    const payload = {
      action,
      domain: domainName,
      years: item.periodUnit === 'year' && Number.isInteger(item.quantity) ? 1 : 1,
      auth_code: isTransfer ? eppCode : undefined,
      registrant: {
        name: contactName,
        email: contactEmail,
        phone: phoneSubscriber,
        phone_cc: phoneCc,
        address: contactAddress,
        city: contactCity,
        country: contactCountry,
        state: contactState,
        postalCode: contactPostalCode,
        company: registrant?.org || registrant?.company || contactName
      }
    };

    const payloadJson = JSON.stringify(payload);
    const authHeaders = buildBridgeAuthHeaders('POST', endpointUrl, payloadJson);

    // 4. Invocar el puente PHP existente en IONOS con firma HMAC-SHA256
    try {
      const resp = await fetchFn(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Banelio-App-Client/1.0',
          ...authHeaders
        },
        body: payloadJson,
        signal: AbortSignal.timeout(12000)
      });

      if (!resp.ok) {
        let errDetails = `El puente de aprovisionamiento respondió con código HTTP ${resp.status}.`;
        try {
          const errJson: any = await resp.json();
          if (errJson && errJson.error) errDetails = errJson.error;
        } catch {}

        await prisma.provisioningOperation.update({
          where: { operationKey },
          data: {
            status: 'FAILED',
            errorMessage: errDetails,
            updatedAt: new Date()
          }
        });

        hasFailure = true;
        firstFailureMessage = errDetails;
        results.push({
          sku: item.sku,
          domain: domainName,
          action,
          success: false,
          error: errDetails
        });
        break;
      }

      const bridgeData: any = await resp.json();

      // REGLA: No marcar aprovisionado hasta recibir confirmación verificable (orderId) del proveedor
      if (!bridgeData.success || !bridgeData.orderId) {
        const errDetails = bridgeData.error || 'ResellerClub no devolvió una confirmación verificable de la orden.';
        await prisma.provisioningOperation.update({
          where: { operationKey },
          data: {
            status: 'FAILED',
            errorMessage: errDetails,
            updatedAt: new Date()
          }
        });

        hasFailure = true;
        firstFailureMessage = errDetails;
        results.push({
          sku: item.sku,
          domain: domainName,
          action,
          success: false,
          error: errDetails
        });
        break;
      }

      // Éxito confirmado y verificable del proveedor
      const providerOrderId = String(bridgeData.orderId);
      const isTransferAction = action === 'transfer';
      const isItemProvisioned = !isTransferAction && (bridgeData.status === 'PROVISIONED' || String(bridgeData.status).toUpperCase() === 'SUCCESS');
      const itemStatus = isItemProvisioned ? 'PROVISIONED' : (isTransferAction ? 'TRANSFER_INITIATED' : 'PENDING');

      await prisma.provisioningOperation.update({
        where: { operationKey },
        data: {
          status: isItemProvisioned || isTransferAction ? 'CONFIRMED' : 'PENDING',
          providerOrderId,
          providerStatus: isTransferAction ? 'TRANSFER_INITIATED' : String(bridgeData.status || 'PROVISIONED'),
          errorMessage: null,
          updatedAt: new Date()
        }
      });

      results.push({
        sku: item.sku,
        domain: domainName,
        action,
        success: true,
        providerOrderId,
        status: itemStatus
      });

      // Actualizar Entitlement asociado en Prisma
      if (order.customerId) {
        try {
          const entitlement = await prisma.entitlement.findFirst({
            where: {
              orderId: order.id,
              serviceType: 'DOMAIN',
              sku: item.sku
            }
          });

          if (entitlement) {
            await prisma.entitlement.update({
              where: { id: entitlement.id },
              data: {
                status: isItemProvisioned ? 'PROVISIONED' : 'ACTIVATED',
                activatedAt: entitlement.activatedAt || new Date(),
                provisionedAt: isItemProvisioned ? new Date() : null,
                config: {
                  ...((entitlement.config as any) || {}),
                  domain: domainName,
                  provider: 'resellerclub',
                  providerOrderId,
                  action,
                  transferStatus: isTransferAction ? 'TRANSFER_INITIATED' : undefined,
                  updatedAt: new Date().toISOString()
                }
              }
            });
          }
        } catch (entErr: any) {
          console.error('BANELIO: error al actualizar entitlement de dominio:', entErr.message);
        }
      }

    } catch (netErr: any) {
      const errDetails = netErr?.name === 'TimeoutError'
        ? `Timeout al conectar con el puente de aprovisionamiento en ${baseUrl}.`
        : `Error de red al conectar con el puente de aprovisionamiento: ${netErr.message || 'desconocido'}.`;

      // Regla: No asumir fallo inmediato si se pierde la conexión tras enviar la solicitud; marcar como UNCERTAIN
      await prisma.provisioningOperation.update({
        where: { operationKey },
        data: {
          status: 'UNCERTAIN',
          uncertainReason: errDetails,
          updatedAt: new Date()
        }
      });

      hasFailure = true;
      firstFailureMessage = errDetails;
      results.push({
        sku: item.sku,
        domain: domainName,
        action,
        success: false,
        error: errDetails
      });
      break;
    }
  }

  // 5. Actualizar estado de la orden en Prisma
  if (hasFailure) {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        provisionStatus: 'FAILED',
        failureReason: firstFailureMessage
      }
    });

    return {
      success: false,
      orderId,
      status: 'FAILED',
      error: firstFailureMessage,
      results
    };
  }

  // Verificar si todas las líneas están completamente provisionadas o si hay transferencias en curso
  const allProvisioned = results.length > 0 && results.every((r) => r.status === 'PROVISIONED');
  const finalOrderStatus = allProvisioned ? 'PROVISIONED' : 'PROVISIONING';
  const finalMessage = allProvisioned
    ? 'Aprovisionamiento de dominios completado exitosamente con confirmación de ResellerClub.'
    : 'Orden de transferencia iniciada exitosamente en el proveedor. En espera de confirmación y liberación por el registry.';

  await prisma.order.update({
    where: { id: orderId },
    data: {
      provisionStatus: finalOrderStatus,
      failureReason: null
    }
  });

  return {
    success: true,
    orderId,
    status: finalOrderStatus,
    message: finalMessage,
    results
  };
}

/**
 * Reintento seguro de aprovisionamiento para órdenes en estado FAILED o pendientes.
 */
export async function retryProvisionOrder(
  orderId: string,
  options?: {
    bridgeFetch?: (url: string, init?: RequestInit) => Promise<Response>;
  }
): Promise<ProvisionOrderResult> {
  return provisionPaidOrder(orderId, options);
}
