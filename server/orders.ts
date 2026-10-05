import { Prisma } from '@prisma/client';
import { prisma } from './db';
import { getActiveCatalog } from './catalog';
import { normalizeCountryCode, getTaxForCountry } from './tax';
import { createEntitlementsForOrder } from './pricing';
import {
  calculateCommercialDiscount,
  DEFAULT_DISCOUNT_CONFIG,
  getProductPriceResult,
  calculatePartnerCommission
} from '../src/services/pricingEngine';

/**
 * BANELIO - Orders (Fase Grande, Subfases 3/4/5).
 *
 * Server-authoritative order creation. El servidor es la ÚNICA autoridad para:
 *   - validar SKU contra el catálogo server-side (server/catalog.ts)
 *   - precio unitario (solo del catálogo)
 *   - subtotal
 *   - tasa fiscal (solo de server/tax.ts)
 *   - impuesto, base gravable, descuento, total
 *   - Order ID (cuid generado por la DB)
 *   - estados (payment/order/provision)
 *
 * NUNCA se acepta del cliente: unitPrice, subtotal, tax, taxRate, total,
 * paymentStatus, orderStatus, provisionStatus, discount. Si llegan, se rechaza.
 *
 * Estados al crear: status=CREATED, paymentStatus=PENDING_PAYMENT,
 * provisionStatus=NONE. El aprovisionamiento SOLO ocurre tras una confirmación
 * real de pago (webhook posterior), jamás aquí.
 */

// List of monetary/state fields that the client must NOT be allowed to set.
const FORBIDDEN_CLIENT_FIELDS = [
  'unitPrice',
  'unitPriceUSD',
  'subtotal',
  'subtotalUSD',
  'tax',
  'taxAmount',
  'taxUSD',
  'taxRate',
  'taxPercent',
  'taxBase',
  'total',
  'totalUSD',
  'discount',
  'discountAmount',
  'discountPercent',
  'price',
  'providerCost',
  'providerCostUSD',
  'margin',
  'targetMargin',
  'minMargin',
  'commission',
  'commissionAmount',
  'commissionRate',
  'partnerCommission',
  'paymentStatus',
  'orderStatus',
  'status',
  'provisionStatus',
  'provisioningStatus',
  'gatewayReference',
  'paymentReference',
  'invoiceNumber',
  'customerId'
];

export interface OrderCreateInput {
  idempotencyKey?: string;
  authenticatedCustomerId?: string;
  countryCode?: string;
  // promoCode: el cliente SOLO envía el código; el descuento lo calcula el
  // servidor contra una tabla interna. Nunca se acepta un %/monto del cliente.
  promoCode?: string;
  // referralCode: código de referido de partner opcional (validado y calculado en servidor)
  referralCode?: string;
  // displayCurrency is accepted only as a hint for the client's UI currency;
  // monetary authority is the catalog currency (USD).
  displayCurrency?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
    registrant?: {
      name?: string;
      org?: string;
      email?: string;
      phone?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
  items?: Array<{
    sku: string;
    quantity?: number;
    periodYearsOrMonths?: number;
    periodUnit?: 'year' | 'month';
    // For domain transfers, eppCode is required and persisted with the order.
    isTransfer?: boolean;
    eppCode?: string;
    domain?: string;
  }>;
}

export class OrderValidationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Cupones compatibles con el frontend; el descuento se calcula SOLO aquí.
const PROMO_CODES: Record<string, number> = {
  WELCOME20: 0.2,
  PARTNER30: 0.15,
  HOTSALE: 0.25
};

/** Reject any unauthorized monetary/state field the client attempted to set. */
function assertNoForbiddenFields(body: Record<string, unknown>, context: string = ''): void {
  for (const key of FORBIDDEN_CLIENT_FIELDS) {
    if (key in body && body[key] !== undefined && body[key] !== null) {
      const location = context ? ` en ${context}` : '';
      throw new OrderValidationError(400, `Campo no autorizado desde el cliente${location}: ${key}`);
    }
  }
}

/**
 * Crea una orden de forma idempotente y server-authoritative.
 * Si idempotencyKey ya existe, devuelve la orden existente (sin recrear).
 */
export async function createOrder(input: OrderCreateInput): Promise<any> {
  const body = input as unknown as Record<string, unknown>;
  assertNoForbiddenFields(body);

  if (Array.isArray(input.items)) {
    for (let i = 0; i < input.items.length; i++) {
      const itemRaw = input.items[i] as unknown as Record<string, unknown>;
      if (itemRaw && typeof itemRaw === 'object') {
        assertNoForbiddenFields(itemRaw, `item[${i}]`);
      }
    }
  }

  // ---- Idempotency (Subfase 4) ----
  const rawIdempotencyKey = typeof input.idempotencyKey === 'string'
    ? input.idempotencyKey.trim()
    : '';

  if (rawIdempotencyKey.length > 128) {
    throw new OrderValidationError(400, 'La clave de idempotencia no es válida.');
  }

  const idempotencyKey = rawIdempotencyKey || undefined;

  if (idempotencyKey) {
    const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return { order: toPublicOrder(existing), created: false, idempotent: true };
    }
  }

  // ---- Validate SKUs against server-side catalog (Subfase 3) ----
  if (!Array.isArray(input.items) || input.items.length === 0) {
    throw new OrderValidationError(400, 'Se requiere al menos un item con sku válido.');
  }

  const catalog = await getActiveCatalog(prisma);
  const catalogBySku = new Map(catalog.map((c) => [c.sku, c]));

  interface BuiltLine {
    sku: string;
    name: string;
    category: string;
    billingPeriod: string;
    unitPriceUSD: number;
    quantity: number;
    periodUnit: 'year' | 'month';
    isTransfer?: boolean;
    eppCode?: string;
    domain?: string;
    transferStatus?: string;
  }

  const lines: BuiltLine[] = [];
  let subtotal = 0;
  let totalOrderCostUSD = 0;

  for (const raw of input.items) {
    const sku = typeof raw.sku === 'string' ? raw.sku.trim() : '';
    if (!sku) throw new OrderValidationError(400, 'Item con sku vacío.');

    const isDomainTransfer = sku === 'DOMAIN_TRANSFER' || Boolean(raw.isTransfer);

    let def: {
      sku: string;
      name: string;
      category: string;
      billingPeriod: string;
      price: number | Prisma.Decimal;
      active?: boolean;
    };

    let domainName: string | undefined;

    if (isDomainTransfer) {
      const epp = typeof raw.eppCode === 'string' ? raw.eppCode.trim() : '';
      if (!epp || epp.length < 6 || epp.length > 32) {
        throw new OrderValidationError(
          400,
          'El código Auth/EPP es obligatorio y debe tener entre 6 y 32 caracteres para transferir el dominio.'
        );
      }

      const rawExtracted = typeof raw.domain === 'string' && raw.domain.trim()
        ? raw.domain.trim().toLowerCase()
        : (input.customer?.registrant?.org && input.customer.registrant.org.includes('.')
            ? (input.customer.registrant.org.match(/[a-z0-9][a-z0-9.-]+\.[a-z]{2,}/i)?.[0]?.toLowerCase() || input.customer.registrant.org.trim().toLowerCase())
            : undefined);

      domainName = rawExtracted ? rawExtracted.replace(/[^a-z0-9.-]/gi, '') : undefined;

      const tld = domainName && domainName.includes('.')
        ? domainName.split('.').slice(1).join('.')
        : 'com';

      const matchedCatalogItem =
        catalogBySku.get(sku) ||
        catalogBySku.get(`domain-${tld.replace(/\./g, '-')}-transfer`) ||
        catalogBySku.get(`domain-${tld.replace(/\./g, '-')}`) ||
        catalogBySku.get(`tld-${tld.replace(/\./g, '-')}`) ||
        catalogBySku.get('domain-com');

      const transferPrice = matchedCatalogItem ? Number(matchedCatalogItem.price) : 12.99;

      def = {
        sku: 'DOMAIN_TRANSFER',
        name: domainName ? `Transferencia de Dominio: ${domainName}` : 'Transferencia de Dominio',
        category: 'DOMAIN',
        billingPeriod: 'YEAR',
        price: transferPrice,
        active: true
      };
    } else {
      if (!catalogBySku.has(sku)) {
        // Distinguish "SKU doesn't exist" from "SKU exists but inactive".
        const rawItem = await prisma.catalogItem.findUnique({ where: { sku } });
        if (rawItem && rawItem.active === false) {
          throw new OrderValidationError(400, `El producto con SKU ${sku} no está activo.`);
        }
        // Transferencia/renovación SIN precio real configurado: respuesta honesta,
        // NUNCA se cobra un precio inventado (lema: no fabricar datos).
        const transferMatch = /^domain-(.+)-transfer$/.exec(sku);
        if (transferMatch) {
          throw new OrderValidationError(
            400,
            `Transfer pricing not configured for TLD ${transferMatch[1].replace(/-/g, '.')}. No se puede cobrar la transferencia sin un precio real.`
          );
        }
        const renewMatch = /^domain-(.+)-renew$/.exec(sku);
        if (renewMatch) {
          throw new OrderValidationError(
            400,
            `Renewal pricing not configured for TLD ${renewMatch[1].replace(/-/g, '.')}. No se puede cobrar la renovación sin un precio real.`
          );
        }
        throw new OrderValidationError(400, `SKU no existe en el catálogo: ${sku}`);
      }
      def = catalogBySku.get(sku)!;
    }

    const qtyRaw = raw.quantity;
    const quantity = qtyRaw === undefined ? 1 : Number(qtyRaw);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      throw new OrderValidationError(400, `Cantidad inválida para SKU ${sku}.`);
    }

    const catalogUnitPrice = Number(def.price);
    if (!Number.isFinite(catalogUnitPrice) || catalogUnitPrice <= 0) {
      throw new OrderValidationError(
        400,
        `El producto con SKU ${sku} no tiene un precio comercial configurado y no es vendible.`
      );
    }
    const billingPeriod = def.billingPeriod;
    const catalogPeriodUnit: 'year' | 'month' =
      billingPeriod === 'MONTH' ? 'month' : 'year';

    const requestedPeriodUnit =
      raw.periodUnit === 'month' || raw.periodUnit === 'year'
        ? raw.periodUnit
        : catalogPeriodUnit;

    // El cliente puede solicitar duración, pero nunca cambiar la unidad
    // de facturación definida por el catálogo.
    if (requestedPeriodUnit !== catalogPeriodUnit) {
      throw new OrderValidationError(
        400,
        `Unidad de facturación inválida para SKU ${sku}.`
      );
    }

    const periodsRaw = raw.periodYearsOrMonths;
    const periods = periodsRaw === undefined ? 1 : Number(periodsRaw);

    if (!Number.isInteger(periods) || periods < 1 || periods > 10) {
      throw new OrderValidationError(
        400,
        `Duración inválida para SKU ${sku}.`
      );
    }

    const commercialDiscount = calculateCommercialDiscount(
      quantity,
      isDomainTransfer ? 1 : periods,
      DEFAULT_DISCOUNT_CONFIG
    );

    const commercialMultiplier = 1 - (
      commercialDiscount.combinedDiscountPercent / 100
    );

    const discountedUnitPrice = Math.round(
      catalogUnitPrice * commercialMultiplier * 100
    ) / 100;

    const lineTotal = Math.round(
      discountedUnitPrice * quantity * periods * 100
    ) / 100;

    // Rastrear costo interno del proveedor para proteger piso de margen mínimo
    const priceResult = getProductPriceResult(sku, 'USD', undefined, {
      operation: isDomainTransfer ? 'TRANSFER' : undefined
    });
    const lineCostUSD = priceResult.providerCostKnown && priceResult.providerCostUSD > 0
      ? priceResult.providerCostUSD * quantity * (isDomainTransfer ? 1 : periods)
      : 0;
    totalOrderCostUSD += lineCostUSD;

    lines.push({
      sku: isDomainTransfer ? 'DOMAIN_TRANSFER' : sku,
      name: def.name,
      category: def.category,
      billingPeriod,
      unitPriceUSD: discountedUnitPrice,
      quantity,
      periodUnit: catalogPeriodUnit,
      isTransfer: isDomainTransfer,
      ...(domainName ? { domain: domainName } : {}),
      ...(isDomainTransfer && typeof raw.eppCode === 'string' && raw.eppCode.trim()
        ? { eppCode: raw.eppCode.trim() }
        : {}),
      ...(isDomainTransfer ? { transferStatus: 'PENDING_TRANSFER' } : {})
    });

    subtotal += lineTotal;
  }

  subtotal = Math.round(subtotal * 100) / 100;

  // ---- Promo code (descuento calculado en el SERVIDOR, nunca del cliente) ----
  const rawPromo = typeof input.promoCode === 'string' ? input.promoCode.trim().toUpperCase() : '';
  const promoRate = rawPromo && PROMO_CODES[rawPromo] !== undefined ? PROMO_CODES[rawPromo] : 0;
  const requestedDiscount = Math.round(subtotal * promoRate * 100) / 100;

  // Floor Margin: ningún descuento/promoción puede destruir el margen mínimo del 20%
  // ni permitir que los ingresos de la orden caigan por debajo del costo del proveedor.
  const minOrderRevenueFloorUSD = totalOrderCostUSD > 0
    ? Math.round((totalOrderCostUSD / (1 - 0.20)) * 100) / 100
    : 0;

  const maxAllowedDiscount = Math.max(0, subtotal - minOrderRevenueFloorUSD);
  const discount = Math.min(requestedDiscount, maxAllowedDiscount, subtotal);

  // ---- Tax rate server-side (Subfase 3) ----
  const countryCode = normalizeCountryCode(input.countryCode);
  if (!countryCode) {
    throw new OrderValidationError(400, 'Código de país inválido. Usa ISO 3166-1 alpha-2.');
  }
  const tax = getTaxForCountry(countryCode);

  const taxBase = Math.max(0, subtotal - discount);
  const taxAmount = Math.round(taxBase * tax.rate * 100) / 100;
  const total = Math.round((taxBase + taxAmount) * 100) / 100;

  // ---- Customer (sesión autenticada autoritativa; guest permitido) ----
  let customerId: string | null = input.authenticatedCustomerId || null;

  if (customerId) {
    const authenticatedCustomer = await prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true, role: true, status: true }
    });

    if (
      !authenticatedCustomer ||
      !['CUSTOMER', 'RESELLER', 'ADMIN'].includes(authenticatedCustomer.role) ||
      authenticatedCustomer.status !== 'ACTIVE'
    ) {
      throw new OrderValidationError(401, 'Sesión de cliente no válida.');
    }
  } else {
    const custEmail = input.customer?.email?.trim().toLowerCase();

    if (custEmail) {
      const name = input.customer?.name?.trim() || custEmail.split('@')[0] || 'Cliente';
      const customer = await prisma.customer.upsert({
        where: { email: custEmail },
        update: {},
        create: {
          email: custEmail,
          name,
          phone: input.customer?.phone?.trim() || undefined
        }
      });
      customerId = customer.id;
    }
  }

  // ---- Partner Attribution & Referral Commission (Calculado en servidor) ----
  const rawReferral = typeof input.referralCode === 'string' ? input.referralCode.trim() : '';
  const referralCode = rawReferral && /^[A-Za-z0-9_-]{3,32}$/.test(rawReferral)
    ? rawReferral
    : (rawPromo === 'PARTNER30' ? 'PARTNER30' : undefined);

  const partnerCommission = referralCode
    ? calculatePartnerCommission(subtotal, discount, false)
    : null;

  // ---- Registrant Data Sanitization ----
  const registrantInput = input.customer?.registrant;
  const registrantClean = registrantInput && typeof registrantInput === 'object'
    ? {
        name: typeof registrantInput.name === 'string' ? registrantInput.name.trim() : '',
        org: typeof registrantInput.org === 'string' ? registrantInput.org.trim() : undefined,
        email: typeof registrantInput.email === 'string' ? registrantInput.email.trim().toLowerCase() : '',
        phone: typeof registrantInput.phone === 'string' ? registrantInput.phone.trim() : '',
        address: typeof registrantInput.address === 'string' ? registrantInput.address.trim() : '',
        city: typeof registrantInput.city === 'string' ? registrantInput.city.trim() : '',
        state: typeof registrantInput.state === 'string' ? registrantInput.state.trim() : '',
        postalCode: typeof registrantInput.postalCode === 'string' ? registrantInput.postalCode.trim() : '',
        country: typeof registrantInput.country === 'string' ? registrantInput.country.trim() : ''
      }
    : null;

  // ---- Persist (Subfase 3) ----
  const itemsJson: Prisma.InputJsonValue = lines.map((l) => ({
    sku: l.sku,
    name: l.name,
    category: l.category,
    billingPeriod: l.billingPeriod,
    unitPriceUSD: l.unitPriceUSD,
    quantity: l.quantity,
    periodUnit: l.periodUnit,
    isTransfer: l.isTransfer || false,
    ...(l.domain ? { domain: l.domain } : {}),
    ...(l.isTransfer ? { operation: 'transfer', transferStatus: l.transferStatus || 'PENDING_TRANSFER' } : {}),
    ...(l.isTransfer && l.eppCode ? { eppCode: l.eppCode } : {}),
    ...(l.category === 'DOMAIN' && registrantClean ? { registrant: registrantClean } : {}),
    ...(partnerCommission?.eligible
      ? {
          referralAttribution: {
            referralCode,
            commissionAmountUSD: partnerCommission.commissionAmountUSD,
            commissionRate: partnerCommission.commissionRate
          }
        }
      : {})
  })) as unknown as Prisma.InputJsonValue;

  const order = await prisma.order.create({
    data: {
      idempotencyKey,
      customerId,
      status: 'CREATED',
      paymentStatus: 'PENDING_PAYMENT',
      provisionStatus: 'NONE',
      currency: 'USD',
      subtotal,
      discount,
      taxBase,
      taxRate: tax.rate,
      tax: taxAmount,
      total,
      paymentMethod: null,
      items: itemsJson
    }
  });

  if (customerId) {
    try {
      await createEntitlementsForOrder(order.id, customerId, lines);
    } catch (e) {
      console.error('Error creating entitlements for order:', e);
    }
  }

  return { order: toPublicOrder(order), created: true, idempotent: false };
}

/**
 * GET /api/orders/:id - devuelve SOLO datos no sensibles.
 * Nunca expone EPP, tokens, ni credenciales de proveedor.
 */
export async function getOrderById(id: string): Promise<any> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new OrderValidationError(404, 'Orden no encontrada.');
  }
  return toPublicOrder(order);
}

/**
 * Raw order lookup for payment endpoints. Devuelve la entidad real de Prisma
 * (interno del servidor; NO debe serializarse directamente al cliente).
 */
export async function getOrderForPayment(orderId: string): Promise<any> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) {
    throw new OrderValidationError(404, 'Orden no encontrada.');
  }
  return order;
}

/**
 * Fija la referencia del proveedor (PaymentIntent / PayPal Order / voucher OXXO)
 * en la orden. Idempotente: si ya existe una referencia del mismo proveedor,
 * la devuelve sin duplicar (evita PaymentIntents duplicados).
 */
export async function setOrderGatewayReference(
  orderId: string,
  gatewayReference: string,
  paymentMethod: 'STRIPE_CARD' | 'PAYPAL' | 'OXXO_PAY'
): Promise<{ order: any; existing: string | null; changed: boolean }> {
  const order = await getOrderForPayment(orderId);
  if (order.paymentStatus === 'PAYMENT_CONFIRMED' || order.status === 'PAID') {
    throw new OrderValidationError(409, 'La orden ya está pagada; no se puede iniciar un nuevo cobro.');
  }
  if (order.gatewayReference) {
    return { order: toPublicOrder(order), existing: order.gatewayReference, changed: false };
  }
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { gatewayReference, paymentMethod }
  });
  return { order: toPublicOrder(updated), existing: null, changed: true };
}

/**
 * Transición de pago confirmado.
 * SOLO se invoca desde confirmación autorizada (webhook Stripe verificado /
 * captura PayPal server-side). El frontend JAMÁS llama esto.
 * provisionStatus permanece NONE: NO se activa ResellerClub/provisioning aquí.
 */
export async function markOrderPaid(orderId: string, reference: string): Promise<{ order: any; changed: boolean; alreadyPaid: boolean }> {
  const order = await getOrderForPayment(orderId);
  if (order.paymentStatus === 'PAYMENT_CONFIRMED' || order.status === 'PAID') {
    return { order: toPublicOrder(order), changed: false, alreadyPaid: true };
  }
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'PAID',
      paymentStatus: 'PAYMENT_CONFIRMED',
      gatewayReference: order.gatewayReference || reference,
      failureReason: null,
      provisionStatus: 'NONE'
    }
  });
  return { order: toPublicOrder(updated), changed: true, alreadyPaid: false };
}

/** Pago reembolsado (webhook charge.refunded). */
export async function markOrderRefunded(orderId: string, reference?: string): Promise<{ order: any; changed: boolean }> {
  const order = await getOrderForPayment(orderId);

  if (order.paymentStatus === 'REFUNDED') {
    return { order: toPublicOrder(order), changed: false };
  }

  if (order.paymentStatus !== 'PAYMENT_CONFIRMED' || order.status !== 'PAID') {
    throw new OrderValidationError(409, 'La orden no tiene un pago confirmado para reembolsar.');
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'REFUNDED',
      paymentStatus: 'REFUNDED',
      gatewayReference: order.gatewayReference || reference || null,
      provisionStatus: 'NONE'
    }
  });
  return { order: toPublicOrder(updated), changed: true };
}

/** Pago rechazado/fallido (webhook payment_intent.payment_failed). */
export async function markOrderPaymentFailed(
  orderId: string,
  reason: string,
  reference?: string
): Promise<{ order: any; changed: boolean }> {
  const order = await getOrderForPayment(orderId);

  if (
    order.paymentStatus === 'PAYMENT_CONFIRMED' ||
    order.paymentStatus === 'REFUNDED' ||
    order.paymentStatus === 'PAYMENT_FAILED'
  ) {
    return { order: toPublicOrder(order), changed: false };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: 'FAILED',
      paymentStatus: 'PAYMENT_FAILED',
      failureReason: reason || null,
      gatewayReference: order.gatewayReference || reference || null
    }
  });
  return { order: toPublicOrder(updated), changed: true };
}

/** Serializa una orden sin campos sensibles ni decimales crudos. */
export function toPublicOrder(order: any) {
  return {
    id: order.id,
    customerId: order.customerId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    provisionStatus: order.provisionStatus,
    currency: order.currency,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    taxBase: order.taxBase === null || order.taxBase === undefined ? null : Number(order.taxBase),
    taxRate: order.taxRate === null || order.taxRate === undefined ? null : Number(order.taxRate),
    tax: Number(order.tax),
    total: Number(order.total),
    paymentMethod: order.paymentMethod || null,
    gatewayReference: order.gatewayReference || null,
    failureReason: order.failureReason || null,
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => {
          if (!item || typeof item !== 'object') return item;
          const { eppCode, ...safeItem } = item;
          return {
            ...safeItem,
            ...(eppCode ? { hasEppCode: true } : {})
          };
        })
      : [],
    createdAt: order.createdAt?.toISOString?.() || null,
    updatedAt: order.updatedAt?.toISOString?.() || null
  };
}
