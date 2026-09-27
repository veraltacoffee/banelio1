import type { PrismaClientType } from './db';

export interface HealthIntegrationState {
  key: string;
  label: string;
  status: 'configured' | 'not_configured';
  details: string;
}

/**
 * BANELIO - Health check (Fase 2).
 *
 * Devuelve el estado real y sanitizado del backend. Nunca expone secretos:
 * solo booleanos de configuración y conteos agregados.
 */
export async function getHealth(prisma: PrismaClientType, startedAt: number) {
  let database = { status: 'up' as 'up' | 'down', error: null as string | null, catalogItems: 0, orders: 0, customers: 0 };
  try {
    const [catalogItems, orders, customers] = await Promise.all([
      prisma.catalogItem.count(),
      prisma.order.count(),
      prisma.customer.count()
    ]);
    database = { status: 'up', error: null, catalogItems, orders, customers };
  } catch (err: any) {
    database = { status: 'down', error: err.message, catalogItems: 0, orders: 0, customers: 0 };
  }

  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY);
  const paypalReady = Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
  const fxOverride = Boolean((process.env.FX_USD_MXN_RATE || '').trim());

  let transferPricingConfigured = false;
  try {
    const transfers = await prisma.catalogItem.count({
      where: { active: true, sku: { endsWith: '-transfer' } }
    });
    const renews = await prisma.catalogItem.count({
      where: { active: true, sku: { endsWith: '-renew' } }
    });
    transferPricingConfigured = transfers > 0 && renews > 0;
  } catch { /* ignore */ }

  const integrations: HealthIntegrationState[] = [
    {
      key: 'registry',
      label: 'Banelio Registry',
      status: Boolean(process.env.REGISTRY_PARTNER_ID && process.env.REGISTRY_API_KEY) || Boolean(process.env.BANELIO_API_KEY)
        ? 'configured'
        : 'not_configured',
      details: 'REGISTRY_PARTNER_ID / REGISTRY_API_KEY'
    },
    {
      key: 'stripe',
      label: 'Stripe',
      status: stripeReady ? 'configured' : 'not_configured',
      details: 'STRIPE_SECRET_KEY'
    },
    {
      key: 'stripe_webhook',
      label: 'Stripe Webhook',
      status: Boolean(process.env.STRIPE_WEBHOOK_SECRET) ? 'configured' : 'not_configured',
      details: 'STRIPE_WEBHOOK_SECRET — único camino a PAID para Stripe/OXXO'
    },
    {
      key: 'paypal',
      label: 'PayPal',
      status: paypalReady ? 'configured' : 'not_configured',
      details: 'PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET'
    },
    {
      key: 'oxxo',
      label: 'OXXO Pay',
      status: stripeReady ? 'configured' : 'not_configured',
      details: 'vía STRIPE_SECRET_KEY (Stripe OXXO, MXN con FX real)'
    },
    {
      key: 'fx',
      label: 'FX USD→MXN',
      status: fxOverride ? 'configured' : (stripeReady ? 'configured' : 'not_configured'),
      details: fxOverride ? 'FX_USD_MXN_RATE (override)' : 'API pública con caché (open.er-api.com)'
    },
    {
      key: 'transfer_pricing',
      label: 'Pricing Transferencias/Renewal',
      status: transferPricingConfigured ? 'configured' : 'not_configured',
      details: 'TRANSFER_TLDS / RENEWAL_TLDS en catalog.ts'
    }
  ];

  const overall = database.status === 'up' ? 'ok' : 'degraded';

  return {
    status: overall,
    service: 'banelio-backend',
    version: '1.0.0',
    time: new Date().toISOString(),
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000),
    environment: process.env.NODE_ENV || 'development',
    paymentsEnv: process.env.PAYMENTS_ENV || 'dev',
    database,
    integrations
  };
}
