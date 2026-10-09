import crypto from 'crypto';
import { prisma } from './db';

/**
 * BANELIO - Payment gateway helpers (FASE GRANDE: Stripe + PayPal + OXXO + webhooks).
 *
 * Principios:
 *  - El MONTO siempre se deriva de la orden en Prisma. El cliente NUNCA envía
 *    montos ni estados; solo pide crear/capturar con el orderId.
 *  - Sin credenciales => lanzar "NOT_CONFIGURED"; el endpoint responde 503 con
 *    { configured: false, status: 'unavailable', reason }.
 *  - webhooks verificados por firma (HMAC SHA-256, node:crypto). Sin SDK.
 *  - Los montos en MXN provienen de una conversión REAL con caché
 *    (API pública configurable + override opcional FX_USD_MXN_RATE).
 *    Nunca se inventa un tipo de cambio.
 */

// ---------------------------------------------------------------------------
// Config helpers
// ---------------------------------------------------------------------------

export function stripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripeWebhookConfigured(): boolean {
  return Boolean(process.env.STRIPE_WEBHOOK_SECRET);
}

export function paypalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

// ---------------------------------------------------------------------------
// FX: USD -> MXN (real, con caché)
// ---------------------------------------------------------------------------

const FX_CACHE_TTL_MS = 60 * 60 * 1000;
let fxCache: { rate: number; fetchedAt: number } | null = null;

/**
 * Tipo de cambio USD->MXN autoritativo:
 * 1) Override del operador FX_USD_MXN_RATE (tasa de venta del negocio).
 * 2) API pública real con caché de 1h (open.er-api.com por defecto).
 * Si no hay override y la fuente falla => lanza FX_UNAVAILABLE (nunca inventa).
 */
export async function getUsdMxnRate(): Promise<number> {
  const rawOverride = process.env.FX_USD_MXN_RATE;
  const trimmed = rawOverride === undefined || rawOverride === null ? '' : String(rawOverride).trim();
  if (trimmed !== '') {
    const n = Number(trimmed);
    if (Number.isFinite(n) && n > 0) return n;
  }

  if (fxCache && Date.now() - fxCache.fetchedAt < FX_CACHE_TTL_MS) {
    return fxCache.rate;
  }

  const baseUrl = (process.env.FX_API_BASE_URL || 'https://open.er-api.com/v6/latest/USD').trim();
  const resp = await fetch(baseUrl, {
    headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' }
  });
  if (!resp.ok) throw new Error('FX_UNAVAILABLE');
  const data: any = await resp.json();

  let rate = Number(data?.rates?.MXN);
  if (!Number.isFinite(rate) || rate <= 0) {
    rate = Number(data?.conversion_rates?.MXN);
  }
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('FX_UNAVAILABLE');
  }

  fxCache = { rate, fetchedAt: Date.now() };
  return rate;
}

/** Convierte un total USD (number) a centavos MXN usando la tasa real. */
export async function usdToMxnCents(amountUSD: number): Promise<number> {
  const rate = await getUsdMxnRate();
  return Math.round(amountUSD * rate * 100);
}

// ---------------------------------------------------------------------------
// Verificación de firma de webhooks Stripe (estándar v1).
// Ref: Stripe webhooks: signature = HMAC_SHA256(secret, `${t}.${payload}`)
// ---------------------------------------------------------------------------

const STRIPE_SIGNATURE_TOLERANCE_SEC = 300;

export function verifyStripeSignature(
  rawBody: Buffer,
  sigHeader: string | undefined,
  secret: string,
  nowMs: number = Date.now()
): { valid: boolean; timestamp: number | null } {
  if (!rawBody || !sigHeader || !secret) return { valid: false, timestamp: null };

  const parts = new Map<string, string>();
  for (const part of String(sigHeader).split(',')) {
    const idx = part.indexOf('=');
    if (idx > -1) parts.set(part.slice(0, idx).trim(), part.slice(idx + 1).trim());
  }
  const t = parts.get('t');
  const v1 = parts.get('v1');
  if (!t || !v1) return { valid: false, timestamp: null };

  const timestamp = Number(t);
  if (!Number.isFinite(timestamp) || Math.abs(nowMs / 1000 - timestamp) > STRIPE_SIGNATURE_TOLERANCE_SEC) {
    return { valid: false, timestamp };
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${t}.${rawBody}`)
    .digest('hex');
  const a = Buffer.from(String(v1), 'hex');
  const b = Buffer.from(expected, 'hex');
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, timestamp };
}

/**
 * Valida la firma y parsea el evento Stripe.
 * Devuelve { ok:false, reason } o { ok:true, event }.
 */
export function parseStripeWebhookEvent(
  rawBody: Buffer,
  sigHeader: string | undefined,
  secret: string
): { ok: true; event: any } | { ok: false; reason: string } {
  const { valid } = verifyStripeSignature(rawBody, sigHeader, secret);
  if (!valid) return { ok: false, reason: 'INVALID_SIGNATURE' };

  let event: any;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return { ok: false, reason: 'INVALID_BODY' };
  }
  if (!event || typeof event !== 'object' || typeof event.id !== 'string') {
    return { ok: false, reason: 'INVALID_BODY' };
  }
  return { ok: true, event };
}

// ---------------------------------------------------------------------------
// Validación estricta y autoritativa de PaymentIntent y orden (Stripe & OXXO)
// ---------------------------------------------------------------------------

export interface PaymentMetadata {
  _paymentMetadata: boolean;
  method: 'OXXO_PAY' | 'STRIPE_CARD' | 'PAYPAL';
  paymentIntentId: string;
  expectedAmountCents: number;
  expectedCurrency: string;
  fxRate?: number;
  orderTotalUSD: number;
  createdAt: string;
}

export function getOrderPaymentMetadata(order: any): PaymentMetadata | null {
  if (!order || !Array.isArray(order.items)) return null;
  const found = order.items.find(
    (item: any) => item && typeof item === 'object' && item._paymentMetadata === true
  );
  return found ? (found as PaymentMetadata) : null;
}

const processedStripeEventsCache = new Set<string>();
const MAX_PROCESSED_EVENTS = 5000;

/**
 * Reclama atómicamente un evento de webhook en la base de datos (restricción única en eventId).
 * Protege contra entregas concurrentes y evita re-procesar eventos ya completados.
 */
export async function claimStripeWebhookEvent(
  eventId: string,
  eventType: string = 'unknown'
): Promise<{ claimed: boolean; status: 'NEW' | 'PROCESSED' | 'PROCESSING' | 'FAILED'; error?: string }> {
  if (!eventId || typeof eventId !== 'string') {
    return { claimed: false, status: 'FAILED', error: 'Identificador de evento inválido.' };
  }

  try {
    // Inserción atómica en base de datos con estado inicial PROCESSING
    await prisma.stripeWebhookEvent.create({
      data: {
        eventId,
        eventType,
        status: 'PROCESSING'
      }
    });
    return { claimed: true, status: 'NEW' };
  } catch (err: any) {
    // Unique constraint violation (P2002): el evento ya existe en base de datos
    if (err?.code === 'P2002' || String(err?.message).includes('Unique constraint failed')) {
      const existing = await prisma.stripeWebhookEvent.findUnique({
        where: { eventId }
      });

      if (!existing) {
        return { claimed: false, status: 'FAILED', error: 'Error al consultar estado del evento concurrente.' };
      }

      if (existing.status === 'PROCESSED') {
        processedStripeEventsCache.add(eventId);
        return { claimed: false, status: 'PROCESSED' };
      }

      if (existing.status === 'PROCESSING') {
        const ageMs = Date.now() - new Date(existing.receivedAt).getTime();
        // Si fue recibido hace menos de 60 segundos, otra instancia lo está procesando activamente
        if (ageMs < 60000) {
          return { claimed: false, status: 'PROCESSING' };
        }
        // Recuperación por timeout o proceso abortado anteriormente
        await prisma.stripeWebhookEvent.update({
          where: { eventId },
          data: { attempts: { increment: 1 }, receivedAt: new Date() }
        });
        return { claimed: true, status: 'NEW' };
      }

      if (existing.status === 'FAILED') {
        // Recuperación segura: reintentar evento previamente fallido
        await prisma.stripeWebhookEvent.update({
          where: { eventId },
          data: { status: 'PROCESSING', attempts: { increment: 1 } }
        });
        return { claimed: true, status: 'NEW' };
      }
    }

    return { claimed: false, status: 'FAILED', error: err?.message || 'Error al persistir evento.' };
  }
}

/**
 * Marca persistentemente el evento como PROCESSED en la base de datos tras completar el cobro.
 */
export async function markStripeWebhookEventProcessed(eventId: string): Promise<void> {
  if (!eventId || typeof eventId !== 'string') return;
  processedStripeEventsCache.add(eventId);
  try {
    await prisma.stripeWebhookEvent.upsert({
      where: { eventId },
      update: {
        status: 'PROCESSED',
        processedAt: new Date(),
        errorMessage: null
      },
      create: {
        eventId,
        eventType: 'payment_intent.succeeded',
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });
  } catch (err: any) {
    console.error('BANELIO: error al persistir estado PROCESSED de webhook:', err?.message);
  }
}

/**
 * Registra un fallo en el procesamiento de un evento sin marcarlo falsamente como PROCESSED.
 */
export async function markStripeWebhookEventFailed(eventId: string, errorMessage: string): Promise<void> {
  if (!eventId || typeof eventId !== 'string') return;
  try {
    await prisma.stripeWebhookEvent.upsert({
      where: { eventId },
      update: {
        status: 'FAILED',
        errorMessage: String(errorMessage).slice(0, 500)
      },
      create: {
        eventId,
        eventType: 'unknown',
        status: 'FAILED',
        errorMessage: String(errorMessage).slice(0, 500)
      }
    });
  } catch (err: any) {
    console.error('BANELIO: error al registrar fallo de evento webhook:', err?.message);
  }
}

export async function isStripeEventProcessed(eventId: string): Promise<boolean> {
  if (!eventId || typeof eventId !== 'string') return false;
  if (processedStripeEventsCache.has(eventId)) return true;

  try {
    const record = await prisma.stripeWebhookEvent.findUnique({
      where: { eventId }
    });
    if (record?.status === 'PROCESSED') {
      processedStripeEventsCache.add(eventId);
      return true;
    }
  } catch {}
  return false;
}

export async function markStripeEventProcessed(eventId: string): Promise<void> {
  if (!eventId || typeof eventId !== 'string') return;
  if (processedStripeEventsCache.size >= MAX_PROCESSED_EVENTS) {
    const first = processedStripeEventsCache.values().next().value;
    if (first) processedStripeEventsCache.delete(first);
  }
  processedStripeEventsCache.add(eventId);
  await markStripeWebhookEventProcessed(eventId);
}

export async function clearProcessedStripeEvents(): Promise<void> {
  processedStripeEventsCache.clear();
  try {
    await prisma.stripeWebhookEvent.deleteMany({});
  } catch {}
}

/**
 * Valida un PaymentIntent recibido por webhook contra los datos reales de la orden en Prisma.
 * - Para OXXO Pay: la moneda debe ser 'mxn' y el importe debe coincidir con el voucher MXN esperado.
 * - Para Tarjeta: la moneda debe ser 'usd' (o la moneda de la orden) y el importe debe coincidir con el total USD.
 * - Evita confirmar pagos con datos ausentes, corruptos o inconsistentes.
 */
export function validateStripePaymentIntentForOrder(
  order: any,
  dataObject: any
): { valid: boolean; error?: string; expectedAmountCents?: number; expectedCurrency?: string } {
  if (!order) {
    return { valid: false, error: 'Orden no proporcionada para validación.' };
  }
  if (!dataObject || typeof dataObject !== 'object') {
    return { valid: false, error: 'Objeto de pago no válido en el evento.' };
  }

  const piId = String(dataObject.id || '').trim();
  if (!piId || !piId.startsWith('pi_')) {
    return { valid: false, error: 'ID de PaymentIntent no válido o ausente.' };
  }

  if (order.gatewayReference && order.gatewayReference !== piId) {
    return {
      valid: false,
      error: `La referencia del PaymentIntent (${piId}) no coincide con la orden (${order.gatewayReference}).`
    };
  }

  const status = String(dataObject.status || '').toLowerCase();
  if (status !== 'succeeded') {
    return {
      valid: false,
      error: `El estado del PaymentIntent no es exitoso (recibido: ${status || 'desconocido'}).`
    };
  }

  const receivedAmountCents = Number(dataObject.amount_received ?? dataObject.amount ?? NaN);
  const receivedCurrency = String(dataObject.currency || '').toLowerCase();

  if (!Number.isFinite(receivedAmountCents) || receivedAmountCents <= 0) {
    return { valid: false, error: 'Importe cobrado ausente o no válido en el evento.' };
  }
  if (!receivedCurrency) {
    return { valid: false, error: 'Moneda cobrada ausente en el evento.' };
  }

  const paymentMeta = getOrderPaymentMetadata(order);
  const isOxxo =
    order.paymentMethod === 'OXXO_PAY' ||
    paymentMeta?.method === 'OXXO_PAY' ||
    receivedCurrency === 'mxn';

  if (isOxxo) {
    // Para OXXO, la moneda obligatoria y autoritativa es MXN
    if (receivedCurrency !== 'mxn') {
      return {
        valid: false,
        error: `Moneda inconsistente para pago OXXO: esperado=mxn, recibido=${receivedCurrency}.`
      };
    }

    if (!paymentMeta || paymentMeta.expectedCurrency.toLowerCase() !== 'mxn' || !paymentMeta.expectedAmountCents) {
      return {
        valid: false,
        error: 'Referencia de importe OXXO MXN esperado ausente o inconsistente en el registro de la orden.'
      };
    }

    const expectedAmountCents = paymentMeta.expectedAmountCents;
    const expectedCurrency = 'mxn';

    if (receivedAmountCents !== expectedAmountCents) {
      return {
        valid: false,
        error: `El importe cobrado en OXXO no coincide con el voucher esperado: esperado=${expectedAmountCents} mxn, recibido=${receivedAmountCents} mxn.`,
        expectedAmountCents,
        expectedCurrency
      };
    }

    return { valid: true, expectedAmountCents, expectedCurrency };
  }

  // Tarjeta (moneda base de la orden, por defecto USD)
  const expectedCurrency = String(paymentMeta?.expectedCurrency || order.currency || 'usd').toLowerCase();
  const expectedAmountCents = paymentMeta?.expectedAmountCents ?? Math.round(Number(order.total) * 100);

  if (receivedCurrency !== expectedCurrency) {
    return {
      valid: false,
      error: `Moneda inconsistente: esperado=${expectedCurrency}, recibido=${receivedCurrency}.`,
      expectedAmountCents,
      expectedCurrency
    };
  }

  if (receivedAmountCents !== expectedAmountCents) {
    return {
      valid: false,
      error: `Importe cobrado no coincide con la orden: esperado=${expectedAmountCents} ${expectedCurrency}, recibido=${receivedAmountCents} ${receivedCurrency}.`,
      expectedAmountCents,
      expectedCurrency
    };
  }

  return { valid: true, expectedAmountCents, expectedCurrency };
}

// ---------------------------------------------------------------------------
// Stripe: PaymentIntent (tarjeta) y OXXO Pay
// ---------------------------------------------------------------------------

async function stripeFetchJson(url: string, init: RequestInit & { secret: string }): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${init.secret}`,
      ...(init.headers || {})
    }
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

export async function stripeCreatePaymentIntent(opts: {
  amountCents: number;
  currency: string;
  customerEmail?: string;
  description?: string;
  paymentMethodTypes?: string[];
}): Promise<{
  id: string;
  clientSecret: string | null;
  status: string;
  amountCents: number;
  currency: string;
  nextAction: any | null;
}> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_NOT_CONFIGURED');

  const params = new URLSearchParams();
  params.append('amount', String(opts.amountCents));
  params.append('currency', String(opts.currency).toLowerCase());
  for (const t of opts.paymentMethodTypes && opts.paymentMethodTypes.length ? opts.paymentMethodTypes : ['card']) {
    params.append('payment_method_types[]', t);
  }
  if (opts.customerEmail) params.append('receipt_email', String(opts.customerEmail).slice(0, 190));
  if (opts.description) params.append('description', String(opts.description).slice(0, 200));

  const { ok, data } = await stripeFetchJson('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    secret,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString()
  });
  if (!ok || !data.id) {
    throw new Error(data?.error?.message || 'STRIPE_CREATE_FAILED');
  }
  return {
    id: data.id,
    clientSecret: data.client_secret || null,
    status: data.status,
    amountCents: data.amount ?? opts.amountCents,
    currency: data.currency ?? String(opts.currency).toLowerCase(),
    nextAction: data.next_action || null
  };
}

export async function stripeRetrievePaymentIntent(paymentIntentId: string): Promise<{
  id: string;
  status: string;
  clientSecret: string | null;
  confirmed: boolean;
  amount: number;
  amountReceived: number;
  currency: string | null;
}> {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) throw new Error('STRIPE_NOT_CONFIGURED');

  const { ok, data } = await stripeFetchJson(
    `https://api.stripe.com/v1/payment_intents/${encodeURIComponent(paymentIntentId)}`,
    { method: 'GET', secret }
  );
  if (!ok || !data.id) {
    throw new Error(data?.error?.message || 'STRIPE_RETRIEVE_FAILED');
  }
  return {
    id: data.id,
    status: data.status,
    clientSecret: data.client_secret || null,
    confirmed: data.status === 'succeeded',
    amountReceived: data.amount_received ?? 0,
    amount: data.amount ?? 0,
    currency: data.currency ?? null
  };
}

// ---------------------------------------------------------------------------
// PayPal (Orders v2): create y capture server-side
// ---------------------------------------------------------------------------

function paypalEndpoints() {
  const isSandbox = (process.env.PAYPAL_MODE || 'sandbox') === 'sandbox';
  const base = isSandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
  return {
    isSandbox,
    tokenUrl: `${base}/v1/oauth2/token`,
    ordersUrl: `${base}/v2/checkout/orders`
  };
}

async function paypalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('PAYPAL_NOT_CONFIGURED');

  const eps = paypalEndpoints();
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(eps.tokenUrl, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(data?.error_description || 'PAYPAL_TOKEN_FAILED');
  }
  return data.access_token;
}

export async function paypalCreateOrder(amountUSD: number, description?: string): Promise<{
  orderId: string;
  status: string;
  approveUrl: string | null;
}> {
  const token = await paypalAccessToken();
  const eps = paypalEndpoints();
  const res = await fetch(eps.ordersUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: { currency_code: 'USD', value: amountUSD.toFixed(2) },
          description: description || 'Banelio Cloud & Domain Services'
        }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok || !data.id) {
    throw new Error(data?.message || 'PAYPAL_CREATE_FAILED');
  }
  const approve = (data.links || []).find((l: any) => l.rel === 'approve')?.href || null;
  return { orderId: data.id, status: data.status, approveUrl: approve };
}

export async function paypalCaptureOrder(paypalOrderId: string): Promise<{
  confirmed: boolean;
  captureId: string | null;
  amountUSD: number | null;
  currency: string | null;
  rawId: string | null;
}> {
  const token = await paypalAccessToken();
  const eps = paypalEndpoints();
  const res = await fetch(`${eps.ordersUrl}/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: '{}'
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || 'PAYPAL_CAPTURE_FAILED');
  }

  const confirmed = data.status === 'COMPLETED';
  let captureId: string | null = null;
  let amountUSD: number | null = null;
  let currency: string | null = null;
  if (data.purchase_units && data.purchase_units[0]) {
    const pu = data.purchase_units[0];
    const cap = pu.payments?.captures?.[0];
    captureId = cap?.id || null;
    amountUSD = cap?.amount?.value !== undefined && cap?.amount?.value !== null ? Number(cap.amount.value) : null;
    currency = cap?.amount?.currency_code || null;
  }
  return { confirmed, captureId, amountUSD, currency, rawId: data.id || paypalOrderId };
}