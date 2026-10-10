import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { prisma } from './server/db';
import { seedCatalog, getActiveCatalog, getTransferPricing, getDomainCatalogPricing } from './server/catalog';
import {
  getAdminPricingOverview,
  updateAdminPricing,
  getAdminInternalMetrics
} from './server/pricing';
import { normalizeCountryCode, getTaxForCountry, getSupportedCountries } from './server/tax';
import { getHealth } from './server/health';
import {
  registerAuth,
  loginAuth,
  logoutAuth,
  meAuth,
  getAuthenticatedCustomer,
  setupTwoFactorAuth,
  verifyTwoFactorSetup,
  disableTwoFactorAuth,
  verifyTwoFactorCodeAuth,
  completeTwoFactorLoginAuth,
  sendEmailVerificationAuth,
  verifyEmailAuth,
  requestPasswordResetAuth,
  resetPasswordAuth,
} from './server/auth';
import {
  createOrder,
  getOrderById,
  getOrderForPayment,
  markOrderPaid,
  markOrderRefunded,
  markOrderPaymentFailed,
  toPublicOrder,
  OrderValidationError,
  authorizeOrderAccess
} from './server/orders';
import {
  stripeConfigured,
  stripeWebhookConfigured,
  paypalConfigured,
  getUsdMxnRate,
  usdToMxnCents,
  parseStripeWebhookEvent,
  stripeCreatePaymentIntent,
  stripeRetrievePaymentIntent,
  paypalCreateOrder,
  paypalCaptureOrder,
  validateStripePaymentIntentForOrder,
  isStripeEventProcessed,
  markStripeEventProcessed,
  claimStripeWebhookEvent,
  markStripeWebhookEventProcessed,
  markStripeWebhookEventFailed
} from './server/payments';
import { provisionPaidOrder, retryProvisionOrder } from './server/provisioning';
import { buildBridgeAuthHeaders } from './server/phpBridgeAuth';
import { resolveCustomerDomains } from './server/customerDomains';

// Lazy client helper for Banelio Cloud Registry API
function getRegistryConfig() {
  const registryId = process.env.REGISTRY_PARTNER_ID || process.env.BANELIO_REGISTRY_ID;
  const apiKey = process.env.REGISTRY_API_KEY || process.env.BANELIO_API_KEY;
  const env = process.env.REGISTRY_ENVIRONMENT || 'production';
  const baseUrl = process.env.REGISTRY_API_BASE_URL || 'https://banelio.com/api/';

  return {
    registryId,
    apiKey,
    env,
    baseUrl,
    isConfigured: Boolean(registryId && apiKey)
  };
}

async function startServer() {
  const app = express();

  const authLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiados intentos. Inténtalo nuevamente más tarde.',
    },
  });

  const authTwoFactorLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiados intentos. Inténtalo nuevamente más tarde.',
    },
  });

  const authPasswordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiadas solicitudes. Inténtalo nuevamente más tarde.',
    },
  });

  const authRegistrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiadas solicitudes. Inténtalo nuevamente más tarde.',
    },
  });

  const authTwoFactorCodeLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiados intentos. Inténtalo nuevamente más tarde.',
    },
  });

  const authEmailVerificationLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
      success: false,
      error: 'Demasiadas solicitudes. Inténtalo nuevamente más tarde.',
    },
  });


  const PORT = Number(process.env.PORT) || 3000;
  const startedAt = Date.now();

  app.use(
    helmet({
      contentSecurityPolicy: false,
      hsts: false,
    })
  );

  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = new Set([
        'https://banelio.com',
        'https://www.banelio.com',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        ...(process.env.NODE_ENV !== 'production'
          ? ['http://192.168.1.104:3000']
          : []),
      ]);

      if (
        !origin ||
        allowedOrigins.has(origin) ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.google.com') ||
        process.env.NODE_ENV !== 'production'
      ) {
        return callback(null, true);
      }

      return callback(new Error('Origen no permitido por CORS.'));
    },
    credentials: true,
  }));

  app.use(express.json({
    // Capturamos el body crudo para la verificación de firma de webhooks
    // (HMAC SHA-256 usa exactamente los bytes recibidos, no el JSON parseado).
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    }
  }));

  // API Route: Health check (real server/DB/integration state, sanitized).
  app.get('/api/health', async (_req, res) => {
    const health = await getHealth(prisma, startedAt);
    const code = health.status === 'ok' ? 200 : 503;
    return res.status(code).json(health);
  });

  app.post('/api/auth/register', authRegistrationLimiter, async (req, res) => registerAuth(req, res));
  app.post('/api/auth/login', authLoginLimiter, async (req, res) => loginAuth(req, res));
  app.post('/api/auth/logout', async (req, res) => logoutAuth(req, res));
  app.get('/api/auth/me', async (req, res) => meAuth(req, res));
  app.post('/api/auth/2fa/setup', async (req, res) => setupTwoFactorAuth(req, res));
  app.post('/api/auth/2fa/verify-setup', authTwoFactorCodeLimiter, async (req, res) => verifyTwoFactorSetup(req, res));
  app.post('/api/auth/2fa/verify', authTwoFactorCodeLimiter, async (req, res) => verifyTwoFactorCodeAuth(req, res));
  app.post('/api/auth/2fa/disable', async (req, res) => disableTwoFactorAuth(req, res));
  app.post('/api/auth/2fa/complete-login', authTwoFactorLimiter, async (req, res) => completeTwoFactorLoginAuth(req, res));
  app.post('/api/auth/email-verification/send', authEmailVerificationLimiter, async (req, res) => sendEmailVerificationAuth(req, res));
  app.post('/api/auth/email-verification/verify', authEmailVerificationLimiter, async (req, res) => verifyEmailAuth(req, res));
  app.post('/api/auth/password-reset/request', authPasswordResetLimiter, async (req, res) => requestPasswordResetAuth(req, res));
  app.post('/api/auth/password-reset/confirm', authPasswordResetLimiter, async (req, res) => resetPasswordAuth(req, res));

  app.get('/api/domains/check.php', async (req, res) => {
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain parameter is required' });
    }

    try {
      const targetUrl = `https://banelio.com/api/domains/check.php?domain=${encodeURIComponent(domain)}`;
      const backendResponse = await fetch(targetUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' },
        signal: AbortSignal.timeout(6000)
      });
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(backendResponse.status).json(data);
      }
    } catch {
      // Fallback si la conexión externa tiene timeout
    }

    return res.status(502).json({
      success: false,
      domain,
      status: 'error',
      error: 'Servicio de verificación de dominios de Banelio temporalmente no disponible.'
    });
  });

  // API Route 0.1: Direct proxy to Banelio's official PHP transfer check endpoint (GET /api/domains/transfer.php?domain={domain})
  app.get('/api/domains/transfer.php', async (req, res) => {
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    if (!domain) {
      return res.status(400).json({ success: false, error: 'El parámetro domain es obligatorio.' });
    }

    try {
      const targetUrl = `https://banelio.com/api/domains/transfer.php?domain=${encodeURIComponent(domain)}`;
      const backendResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Banelio-App-Client/1.0'
        }
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(backendResponse.status).json(data);
      }
    } catch {
      // Fallback
    }

    return res.status(502).json({
      success: false,
      domain,
      status: 'unknown',
      error: 'Registry temporalmente no disponible para verificar transferencia.'
    });
  });

  // API Route 0.5: Customer lookup and contacts proxy
  app.get('/api/domains/customer.php', async (req, res) => {
    try {
      const targetUrl = 'https://banelio.com/api/domains/customer.php';
      const authHeaders = buildBridgeAuthHeaders('GET', targetUrl, '');
      const backendResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0', ...authHeaders }
      });
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(backendResponse.status).json(data);
      }
    } catch {}

    return res.status(502).json({
      success: false,
      customer_id: null,
      status: 'unknown',
      error: 'No fue posible consultar el cliente en el registry en este momento.'
    });
  });

  app.get('/api/domains/contacts.php', async (req, res) => {
    try {
      const targetUrl = 'https://banelio.com/api/domains/contacts.php';
      const authHeaders = buildBridgeAuthHeaders('GET', targetUrl, '');
      const backendResponse = await fetch(targetUrl, {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0', ...authHeaders }
      });
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(backendResponse.status).json(data);
      }
    } catch {}

    return res.status(502).json({
      success: false,
      count: 0,
      contacts: [],
      error: 'No fue posible consultar los contactos del registry en este momento.'
    });
  });

  // API Route 1: Health check & Banelio Registry connection status test
  app.get('/api/registry/status', async (req, res) => {
    const config = getRegistryConfig();
    const hasEnvCredentials = Boolean(process.env.RESELLERCLUB_RESELLER_ID || process.env.RESELLER_ID) && Boolean(process.env.RESELLERCLUB_API_KEY || process.env.API_KEY);

    // Verificación en vivo contra el backend IONOS PHP y ResellerClub
    let ionosBackendStatus = 'DISCONNECTED';
    let ionosMessage = '';
    let resellerClubConnected = false;
    let resellerDetails: any = null;

    try {
      const targetUrl = 'https://banelio.com/api/reseller/test-connection.php';
      const authHeaders = buildBridgeAuthHeaders('GET', targetUrl, '');
      const resp = await fetch(targetUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0', ...authHeaders },
        signal: AbortSignal.timeout(4000)
      });
      if (resp.ok) {
        const body: any = await resp.json();
        if (body.success) {
          ionosBackendStatus = 'CONNECTED';
          resellerClubConnected = true;
          ionosMessage = body.message || 'Banelio está conectado correctamente con ResellerClub.';
          if (body.reseller) {
            resellerDetails = {
              company: body.reseller.company || 'Banelio',
              resellerStatus: body.reseller.resellerstatus || 'Active',
              resellerIdMasked: body.reseller.resellerid ? `${String(body.reseller.resellerid).slice(0, 3)}***` : undefined,
              currency: body.reseller.sellingcurrencysymbol || 'MXN'
            };
          }
        }
      }
    } catch {
      // Fallback a test de disponibilidad de dominio si test-connection demora
      try {
        const checkResp = await fetch('https://banelio.com/api/domains/check.php?domain=banelio.com', {
          headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' },
          signal: AbortSignal.timeout(3000)
        });
        if (checkResp.ok) {
          ionosBackendStatus = 'CONNECTED';
          resellerClubConnected = true;
          ionosMessage = 'Bridge de dominios IONOS / ResellerClub respondiendo con éxito.';
        }
      } catch {}
    }

    const isConnected = resellerClubConnected || hasEnvCredentials || config.isConfigured;

    return res.json({
      configured: isConnected,
      status: isConnected ? 'CONNECTED' : 'NOT_CONFIGURED',
      ionosBackendStatus,
      resellerClubConnected,
      message: ionosMessage || (isConnected ? 'Conexión activa con el Registry.' : 'Faltan credenciales locales de ResellerClub.'),
      environment: config.env,
      baseUrl: 'https://banelio.com/api/',
      provider: {
        configured: isConnected,
        environment: config.env,
        liveIonosConnected: ionosBackendStatus === 'CONNECTED',
        resellerDetails
      }
    });
  });

  // API Route: Verificación de infraestructura real en backend IONOS / ResellerClub
  app.get('/api/reseller/test-connection', async (_req, res) => {
    try {
      const targetUrl = 'https://banelio.com/api/reseller/test-connection.php';
      const authHeaders = buildBridgeAuthHeaders('GET', targetUrl, '');
      const resp = await fetch(targetUrl, {
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0', ...authHeaders },
        signal: AbortSignal.timeout(5000)
      });
      if (resp.ok) {
        const data: any = await resp.json();
        const sanitizedReseller = data.reseller ? {
          company: data.reseller.company || 'Banelio',
          resellerStatus: data.reseller.resellerstatus || 'Active',
          resellerIdMasked: data.reseller.resellerid ? `${String(data.reseller.resellerid).slice(0, 3)}***` : undefined,
          country: data.reseller.country || 'MX',
          currency: data.reseller.sellingcurrencysymbol || 'MXN'
        } : undefined;

        return res.json({
          success: Boolean(data.success),
          message: data.message || 'Conexión verificada con ResellerClub.',
          infrastructure: 'IONOS Apache PHP -> ResellerClub HTTP API',
          reseller: sanitizedReseller
        });
      }

      return res.status(502).json({
        success: false,
        error: `El backend IONOS respondió con código ${resp.status}`
      });
    } catch (err: any) {
      return res.status(502).json({
        success: false,
        error: `No fue posible conectar con el backend IONOS: ${err.message}`
      });
    }
  });

  // API Route: Public WHOIS/RDAP lookup via IANA RDAP Bootstrap (real per-domain data).
  // Real source: RFC 7482/7483 Registry Data Access Protocol. No credentials required.
  let rdapBootstrapCache: { services: any[] } | null = null;
  async function getRdapBootstrap() {
    if (rdapBootstrapCache) return rdapBootstrapCache;
    const resp = await fetch('https://data.iana.org/rdap/dns.json', {
      headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' }
    });
    if (!resp.ok) throw new Error('RDAP bootstrap unavailable');
    rdapBootstrapCache = await resp.json();
    return rdapBootstrapCache!;
  }

  app.get('/api/domains/whois', async (req, res) => {
    try {
      const rawDomain = (req.query.domain as string || '').trim().toLowerCase();
      const domain = rawDomain.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      if (!domain || !/^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/.test(domain)) {
        return res.status(400).json({ success: false, error: 'Invalid domain parameter' });
      }

      const tld = domain.slice(domain.indexOf('.') + 1).toLowerCase();

      const bootstrap = await getRdapBootstrap();
      let rdapBase: string | null = null;
      for (const svc of bootstrap.services || []) {
        const tlds = Array.isArray(svc[0]) ? svc[0] : [svc[0]];
        if (tlds.some((t: string) => t.toLowerCase() === tld)) {
          rdapBase = Array.isArray(svc[1]) ? String(svc[1][0]) : String(svc[1]);
          break;
        }
      }
      if (!rdapBase) {
        return res.status(404).json({ success: false, domain, error: 'No RDAP bootstrap found for TLD' });
      }

      const rdapUrl = `${rdapBase.replace(/\/+$/, '')}/domain/${domain}`;
      const rdapResp = await fetch(rdapUrl, {
        headers: { Accept: 'application/rdap+json, application/json', 'User-Agent': 'Banelio-App-Client/1.0' }
      });
      if (!rdapResp.ok) {
        return res.status(502).json({ success: false, error: 'WHOIS/RDAP unavailable' });
      }
      const rdap = await rdapResp.json();

      if (!rdap || rdap.objectClassName !== 'domain') {
        return res.status(502).json({ success: false, error: 'WHOIS/RDAP unavailable' });
      }

      // Registrar (entity role: registrar -> vcard fn)
      let registrar: string | null = null;
      const registrarEntity = (rdap.entities || []).find((e: any) =>
        Array.isArray(e.roles) && e.roles.includes('registrar'));
      if (registrarEntity && Array.isArray(registrarEntity.vcardArray) && Array.isArray(registrarEntity.vcardArray[1])) {
        const fn = registrarEntity.vcardArray[1].find((row: any) => Array.isArray(row) && row[0] === 'fn');
        if (fn) {
          const fnVal = Array.isArray(fn[3]) ? String(fn[3][0]) : String(fn[3] || '');
          if (fnVal) registrar = fnVal;
        }
      }

      // Events
      let created: string | null = null;
      let expires: string | null = null;
      let lastChanged: string | null = null;
      for (const ev of rdap.events || []) {
        const date = ev.eventDate ? String(ev.eventDate).slice(0, 10) : null;
        if (ev.eventAction === 'registration' && !created) created = date;
        else if (ev.eventAction === 'expiration' && !expires) expires = date;
        else if (ev.eventAction === 'last changed' && !lastChanged) lastChanged = date;
      }

      // Nameservers
      const nameservers = (rdap.nameservers || [])
        .map((ns: any) => (ns.ldhName || '').toLowerCase())
        .filter(Boolean);

      const statuses = Array.isArray(rdap.status) ? rdap.status.map((s: string) => s) : [];

      return res.json({
        success: true,
        domain,
        data: {
          registrar: registrar || null,
          status: statuses,
          created: created || null,
          expires: expires || null,
          lastChanged: lastChanged || null,
          nameservers
        }
      });
    } catch (err: any) {
      return res.status(502).json({ success: false, error: 'WHOIS/RDAP unavailable' });
    }
  });

  // ==========================================
  // PAYMENT GATEWAY INTEGRATIONS (STRIPE, PAYPAL, OXXO PAY, WEBHOOKS)
  // ==========================================
  //
  // REGLA: el monto de cualquier cobro proviene SIEMPRE de la orden en Prisma
  // (el cliente envía solo orderId; JAMÁS montos/estados). Sin credenciales =>
  // HTTP 503 { configured:false, status:'unavailable', reason }.
  // La transición a PAID solo ocurre por confirmación autorizada:
  //   - Stripe / OXXO: webhook 'payment_intent.succeeded' con firma verificada.
  //   - PayPal: captura server-side (server-authenticated) con monto verificado.
  // El frontend NUNCA marca PAID ni fabrica referencias.

  // Autoriza el acceso de pago a una orden.
  // Clientes autenticados solo pueden operar sobre sus propias órdenes.
  // Las órdenes de invitado permanecen compatibles con checkout sin cuenta.
  const authorizePaymentOrder = async (req: express.Request, order: any) => {
    const customer = await getAuthenticatedCustomer(req);

    if (order.customerId && (!customer || order.customerId !== customer.id)) {
      return {
        authorized: false,
        status: 404,
        error: 'Orden no encontrada.',
      };
    }

    return {
      authorized: true,
      customer,
    };
  };

  // Endpoint: Payment Gateways Status & Public Config (sanitized, no fake keys).
  app.get('/api/payments/config', async (req, res) => {
    const fxOverride = (process.env.FX_USD_MXN_RATE || '').trim();
    let usdMxnRate: number | null = null;
    try {
      usdMxnRate = await getUsdMxnRate();
    } catch {
      usdMxnRate = null;
    }
    res.json({
      stripe: {
        configured: stripeConfigured(),
        publishableKey: process.env.VITE_STRIPE_PUBLISHABLE_KEY || null
      },
      paypal: {
        configured: paypalConfigured(),
        clientId: process.env.PAYPAL_CLIENT_ID || null,
        mode: process.env.PAYPAL_MODE || 'sandbox'
      },
      oxxo: {
        configured: stripeConfigured(),
        provider: stripeConfigured() ? 'stripe_oxxo' : null
      },
      webhooks: {
        stripe: { configured: stripeWebhookConfigured() }
      },
      fx: {
        usdMxnSource: fxOverride ? 'env_override' : 'public_api',
        overrideConfigured: Boolean(fxOverride),
        usdMxnRate
      }
    });
  });

  // Endpoint: Stripe Create PaymentIntent (tarjeta).
  // Recibe SOLO { orderId }; el monto (USD) se lee de la orden en Prisma.
  // Idempotente: si la orden ya tiene un PaymentIntent, no se duplica.
  app.post('/api/payments/stripe/create-intent', async (req, res) => {
    try {
      if (!stripeConfigured()) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada' });
      }

      const orderId = String((req.body || {}).orderId || '').trim();
      if (!orderId) {
        return res.status(400).json({ configured: true, error: 'orderId es obligatorio.' });
      }

      const order = await getOrderForPayment(orderId);

      const paymentAuth = await authorizePaymentOrder(req, order);
      if (!paymentAuth.authorized) {
        return res.status(paymentAuth.status).json({
          configured: true,
          error: paymentAuth.error,
        });
      }

      if (order.status === 'PAID' || order.paymentStatus === 'PAYMENT_CONFIRMED') {
        return res.status(409).json({ configured: true, error: 'La orden ya está pagada.' });
      }
      if (order.gatewayReference) {
        // Intent ya creado para esta orden: devolver sin duplicar.
        return res.json({ configured: true, idempotent: true, gatewayReference: order.gatewayReference, orderId });
      }

      const totalUSD = Number(order.total);
      const intent = await stripeCreatePaymentIntent({
        amountCents: Math.round(totalUSD * 100),
        currency: order.currency || 'usd',
        customerEmail: (req.body || {}).customerEmail || undefined,
        description: `Banelio Order ${orderId}`
      });

      const existingItems = Array.isArray(order.items) ? (order.items as any[]) : [];
      const cleanItems = existingItems.filter((it: any) => !it || !it._paymentMetadata);
      const paymentMetadata = {
        _paymentMetadata: true,
        method: 'STRIPE_CARD',
        paymentIntentId: intent.id,
        expectedAmountCents: Math.round(totalUSD * 100),
        expectedCurrency: (order.currency || 'usd').toLowerCase(),
        orderTotalUSD: totalUSD,
        createdAt: new Date().toISOString()
      };

      await prisma.order.update({
        where: { id: orderId },
        data: {
          gatewayReference: intent.id,
          paymentMethod: 'STRIPE_CARD',
          items: [...cleanItems, paymentMetadata] as any
        }
      });

      return res.json({
        configured: true,
        clientSecret: intent.clientSecret,
        id: intent.id,
        status: intent.status,
        amountCents: intent.amountCents,
        currency: intent.currency,
        orderId,
        requires_confirmation: true
      });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return res.status(err.status).json({ configured: true, error: err.message });
      }
      const msg = err?.message || 'error';
      if (msg.includes('STRIPE_NOT_CONFIGURED')) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada' });
      }
      return res.status(502).json({ configured: true, error: msg });
    }
  });

  // Endpoint: Stripe Retrieve PaymentIntent + estado REAL de la orden (DB).
  // La DB es la fuente de verdad: 'confirmed' refleja el estado tras el webhook.
  app.post('/api/payments/stripe/retrieve', async (req, res) => {
    if (!stripeConfigured()) {
      return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada' });
    }
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId || !/^pi_[A-Za-z0-9_]+$/.test(String(paymentIntentId))) {
      return res.status(400).json({ configured: true, error: 'paymentIntentId inválido.' });
    }
    try {
      const intent = await stripeRetrievePaymentIntent(String(paymentIntentId));
      const order = await prisma.order.findFirst({ where: { gatewayReference: String(paymentIntentId) } });

      if (order) {
        const paymentAuth = await authorizePaymentOrder(req, order);
        if (!paymentAuth.authorized) {
          return res.status(paymentAuth.status).json({
            configured: true,
            error: paymentAuth.error,
          });
        }
      }

      return res.json({
        configured: true,
        id: intent.id,
        status: intent.status,
        clientSecret: intent.clientSecret,
        confirmed: intent.confirmed || (order ? order.paymentStatus === 'PAYMENT_CONFIRMED' : false),
        amount: intent.amount,
        amount_received: intent.amountReceived,
        currency: intent.currency,
        order: order
          ? {
              id: order.id,
              status: order.status,
              paymentStatus: order.paymentStatus,
              provisionStatus: order.provisionStatus,
              total: Number(order.total)
            }
          : null
      });
    } catch (err: any) {
      const msg = err?.message || 'error';
      if (msg.includes('STRIPE_NOT_CONFIGURED')) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada' });
      }
      return res.status(502).json({ configured: true, error: msg });
    }
  });

  // Endpoint: PayPal Create Order (solo { orderId }; monto de Prisma).
  // Crear la orden es "pago iniciado"; la confirmación real es la CAPTURA.
  app.post('/api/payments/paypal/create-order', async (req, res) => {
    try {
      if (!paypalConfigured()) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'PAYPAL_CREDENTIALS_no_configuradas' });
      }
      const orderId = String((req.body || {}).orderId || '').trim();
      if (!orderId) {
        return res.status(400).json({ configured: true, error: 'orderId es obligatorio.' });
      }

      const order = await getOrderForPayment(orderId);

      const paymentAuth = await authorizePaymentOrder(req, order);
      if (!paymentAuth.authorized) {
        return res.status(paymentAuth.status).json({
          configured: true,
          error: paymentAuth.error,
        });
      }

      if (order.status === 'PAID' || order.paymentStatus === 'PAYMENT_CONFIRMED') {
        return res.status(409).json({ configured: true, error: 'La orden ya está pagada.' });
      }
      if (order.gatewayReference) {
        return res.json({ configured: true, idempotent: true, orderId: order.gatewayReference, requires_capture: true });
      }

      const totalUSD = Number(order.total);
      const created = await paypalCreateOrder(totalUSD, `Banelio Order ${orderId}`);
      await prisma.order.update({
        where: { id: orderId },
        data: { gatewayReference: created.orderId, paymentMethod: 'PAYPAL' }
      });

      return res.json({
        configured: true,
        orderId: created.orderId,
        status: created.status,
        approveUrl: created.approveUrl,
        amountUSD: totalUSD.toFixed(2),
        currency: order.currency || 'USD',
        requires_capture: true
      });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return res.status(err.status).json({ configured: true, error: err.message });
      }
      const msg = err?.message || 'error';
      if (msg.includes('PAYPAL_NOT_CONFIGURED')) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'PAYPAL_CREDENTIALS_no_configuradas' });
      }
      return res.status(502).json({ configured: true, error: msg });
    }
  });

  // Endpoint: PayPal Capture Order (server-side, server-authenticated).
  // Verifica el monto capturado contra el total REAL de la orden y, si
  // coincide, marca la orden PAID. El cliente nunca porta el secret.
  app.post('/api/payments/paypal/capture', async (req, res) => {
    if (!paypalConfigured()) {
      return res.status(503).json({ configured: false, status: 'unavailable', reason: 'PAYPAL_CREDENTIALS_no_configuradas' });
    }
    const { orderId } = req.body || {};
    if (!orderId || typeof orderId !== 'string' || !/^[A-Za-z0-9_-]+$/.test(orderId)) {
      return res.status(400).json({ configured: true, error: 'orderId inválido.' });
    }
    try {
      const order = await prisma.order.findFirst({ where: { gatewayReference: String(orderId) } });
      if (!order) {
        return res.status(404).json({ configured: true, error: 'No hay una orden Banelio asociada a esta referencia PayPal.' });
      }

      const paymentAuth = await authorizePaymentOrder(req, order);
      if (!paymentAuth.authorized) {
        return res.status(paymentAuth.status).json({
          configured: true,
          error: paymentAuth.error,
        });
      }

      const capture = await paypalCaptureOrder(String(orderId));
      if (!capture.confirmed) {
        return res.json({ configured: true, status: 'not_completed', confirmed: false, message: 'PayPal no ha completado la captura.' });
      }

      // Verificación server-side: importe y moneda deben coincidir con la orden.
      const expected = Math.round(Number(order.total) * 100) / 100;
      const received = capture.amountUSD === null ? null : Math.round(capture.amountUSD * 100) / 100;
      const expectedCurrency = String(order.currency || 'USD').toUpperCase();
      const receivedCurrency = String(capture.currency || '').toUpperCase();

      if (
        received === null ||
        !Number.isFinite(received) ||
        Math.abs(received - expected) > 0.01 ||
        !receivedCurrency ||
        receivedCurrency !== expectedCurrency
      ) {
        await markOrderPaymentFailed(
          order.id,
          `Importe/moneda capturados no coinciden con la orden. ` +
          `esperado=${expected.toFixed(2)} ${expectedCurrency}, ` +
          `recibido=${received === null ? 'unknown' : received.toFixed(2)} ${receivedCurrency || 'unknown'}.`
        );
        return res.status(409).json({
          configured: true,
          confirmed: false,
          error: 'El importe o la moneda capturados no coinciden con la orden.',
          order: await getOrderById(order.id)
        });
      }

      const result = await markOrderPaid(order.id, capture.captureId || capture.rawId || String(orderId));
      if (result.changed && !result.alreadyPaid) {
        try {
          await provisionPaidOrder(order.id);
        } catch (provErr: any) {
          console.error(`BANELIO: error de aprovisionamiento en PayPal orden ${order.id}:`, provErr.message);
        }
      }
      const finalOrder = await getOrderById(order.id);
      return res.json({
        configured: true,
        status: 'COMPLETED',
        confirmed: true,
        captureId: capture.captureId,
        amount: received === null ? null : received.toFixed(2),
        currency: capture.currency,
        order: finalOrder || result.order
      });
    } catch (err: any) {
      const msg = err?.message || 'error';
      if (msg.includes('PAYPAL_NOT_CONFIGURED')) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'PAYPAL_CREDENTIALS_no_configuradas' });
      }
      return res.status(502).json({ configured: true, error: msg });
    }
  });

  // Endpoint: Stripe OXXO Pay intent (voucher real de 14 dígitos en MXN).
  // El monto MXN se obtiene de la orden (USD) mediante conversión REAL con
  // caché; nunca se inventa un tipo de cambio ni una referencia.
  const createOxxoVoucher = async (req: express.Request, res: express.Response) => {
    try {
      if (!stripeConfigured()) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada_para_OXXO' });
      }
      const orderId = String((req.body || {}).orderId || '').trim();
      if (!orderId) {
        return res.status(400).json({ configured: true, error: 'orderId es obligatorio.' });
      }

      const order = await getOrderForPayment(orderId);

      const paymentAuth = await authorizePaymentOrder(req, order);
      if (!paymentAuth.authorized) {
        return res.status(paymentAuth.status).json({
          configured: true,
          error: paymentAuth.error,
        });
      }

      if (order.status === 'PAID' || order.paymentStatus === 'PAYMENT_CONFIRMED') {
        return res.status(409).json({ configured: true, error: 'La orden ya está pagada.' });
      }
      if (order.gatewayReference && String(order.gatewayReference).startsWith('pi_')) {
        // Voucher ya generado para esta orden: no duplicar.
        return res.json({ configured: true, idempotent: true, paymentIntentId: order.gatewayReference, orderId });
      }

      const totalUSD = Number(order.total);
      const fxRate = await getUsdMxnRate();
      const amountCentsMXN = Math.round(totalUSD * fxRate * 100);

      const customerEmail = String((req.body || {}).customerEmail || '').trim() || undefined;
      const customerName = String((req.body || {}).customerName || '').trim() || undefined;
      const intent = await stripeCreatePaymentIntent({
        amountCents: amountCentsMXN,
        currency: 'mxn',
        customerEmail,
        description: `Orden ${orderId} - Pago OXXO Pay`,
        paymentMethodTypes: ['oxxo']
      });

      const oxxoDetails = intent.nextAction && intent.nextAction.oxxo_display_details;
      const reference = oxxoDetails && oxxoDetails.number ? String(oxxoDetails.number) : null;
      if (!reference) {
        return res.status(502).json({ configured: true, error: 'Stripe no devolvió una referencia OXXO.' });
      }

      const existingItems = Array.isArray(order.items) ? (order.items as any[]) : [];
      const cleanItems = existingItems.filter((it: any) => !it || !it._paymentMetadata);
      const paymentMetadata = {
        _paymentMetadata: true,
        method: 'OXXO_PAY',
        paymentIntentId: intent.id,
        expectedAmountCents: amountCentsMXN,
        expectedCurrency: 'mxn',
        fxRate,
        orderTotalUSD: totalUSD,
        createdAt: new Date().toISOString()
      };

      await prisma.order.update({
        where: { id: orderId },
        data: {
          gatewayReference: intent.id,
          paymentMethod: 'OXXO_PAY',
          items: [...cleanItems, paymentMetadata] as any
        }
      });
      const expiresAt = typeof oxxoDetails.expires_after === 'number'
        ? new Date(oxxoDetails.expires_after * 1000).toISOString()
        : null;

      return res.json({
        configured: true,
        paymentIntentId: intent.id,
        reference,
        formattedReference: [reference.slice(0, 4), reference.slice(4, 8), reference.slice(8, 12), reference.slice(12)].join('-'),
        barcodeUrl: null,
        expiresAt,
        amountMXN: amountCentsMXN / 100,
        customerName,
        customerEmail,
        orderId,
        requires_confirmation: true
      });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return res.status(err.status).json({ configured: true, error: err.message });
      }
      const msg = err?.message || 'error';
      if (msg.includes('STRIPE_NOT_CONFIGURED')) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_SECRET_KEY_no_configurada_para_OXXO' });
      }
      if (msg.includes('FX_UNAVAILABLE')) {
        return res.status(503).json({
          configured: true,
          status: 'unavailable',
          reason: 'FX_USD_to_MXN_no_disponible',
          error: 'No se pudo obtener el tipo de cambio real USD a MXN en este momento. Intenta más tarde.'
        });
      }
      return res.status(502).json({ configured: true, error: msg });
    }
  };

  app.post('/api/payments/stripe/oxxo-intent', createOxxoVoucher);
  // Alias de compatibilidad con la ruta previa (ahora SOLO con orderId).
  app.post('/api/payments/oxxo/create-voucher', createOxxoVoucher);

  // ==========================================
  // WEBHOOKS (confirmación SERVER-AUTHORITATIVE)
  // ==========================================

  // POST /api/webhooks/stripe - firma verificada obligatoria.
  // ÚNICO camino a PAID para Stripe/OXXO.
  // provisionStatus queda NONE: NO se activa ResellerClub/provisioning.
  app.post('/api/webhooks/stripe', async (req: express.Request, res: express.Response) => {
    try {
      if (!stripeWebhookConfigured()) {
        return res.status(503).json({ configured: false, status: 'unavailable', reason: 'STRIPE_WEBHOOK_SECRET_no_configurada' });
      }
      const rawBody = Buffer.isBuffer((req as any).rawBody)
        ? (req as any).rawBody
        : Buffer.from(JSON.stringify(req.body) || '', 'utf8');
      const parsed = parseStripeWebhookEvent(rawBody, req.headers['stripe-signature'] as string | undefined, process.env.STRIPE_WEBHOOK_SECRET as string);
      if (!parsed.ok) {
        const reason = 'reason' in parsed ? parsed.reason : 'Firma inválida.';
        return res.status(400).json({ received: false, error: reason });
      }

      const event = parsed.event;
      const type = String(event.type || '');
      const dataObject = event.data && event.data.object ? event.data.object : {};
      const piId = typeof dataObject.id === 'string' ? dataObject.id : '';

      if (type === 'payment_intent.succeeded' && piId) {
        // 1. Deduplicación persistente en base de datos con manejo atómico de concurrencia
        const claim = await claimStripeWebhookEvent(event.id, type);
        if (!claim.claimed) {
          if (claim.status === 'PROCESSED') {
            return res.json({ received: true, duplicate: true, message: 'Evento ya procesado previamente.' });
          }
          if (claim.status === 'PROCESSING') {
            return res.json({ received: true, concurrent: true, message: 'Evento actualmente en procesamiento concurrente.' });
          }
          return res.status(400).json({ received: false, error: claim.error || 'No fue posible registrar el evento.' });
        }

        const order = await prisma.order.findFirst({ where: { gatewayReference: piId } });
        if (!order) {
          await markStripeWebhookEventFailed(event.id, `No existe orden para gatewayReference ${piId}`);
          console.warn(`BANELIO: webhook ${type} recibido pero no existe orden para gatewayReference ${piId}`);
          return res.status(404).json({ received: false, error: 'Orden no encontrada para este PaymentIntent.' });
        }

        // Si la orden ya está confirmada como pagada, no duplicar procesamiento ni aprovisionamiento
        if (order.paymentStatus === 'PAYMENT_CONFIRMED' || order.status === 'PAID') {
          await markStripeWebhookEventProcessed(event.id);
          return res.json({ received: true, alreadyPaid: true });
        }

        // 2. Validación estricta del PaymentIntent (moneda, importe OXXO en MXN vs Tarjeta en USD, estado succeeded)
        const validation = validateStripePaymentIntentForOrder(order, dataObject);
        if (!validation.valid) {
          const vErr = validation.error || 'Importe o moneda no válidos.';
          await markStripeWebhookEventFailed(event.id, vErr);
          console.error(
            `BANELIO: webhook ${type} rechazado para orden ${order.id}: ${vErr}`
          );
          return res.status(400).json({
            received: false,
            error: vErr
          });
        }

        const markResult = await markOrderPaid(order.id, piId);
        // Marcar evento como PROCESSED sólo tras confirmar el pago en la orden
        await markStripeWebhookEventProcessed(event.id);
        console.log(`BANELIO: webhook ${type} -> orden ${order.id} a PAYMENT_CONFIRMED.`);

        // 3. Aprovisionamiento posterior al pago confirmado (independiente de la transacción de pago)
        if (markResult.changed && !markResult.alreadyPaid) {
          try {
            const provResult = await provisionPaidOrder(order.id);
            console.log(`BANELIO: resultado aprovisionamiento orden ${order.id}: ${provResult.status}`);
          } catch (provErr: any) {
            console.error(`BANELIO: error en aprovisionamiento orden ${order.id}:`, provErr.message);
          }
        }
      } else if (type === 'payment_intent.payment_failed' && piId) {
        const order = await prisma.order.findFirst({ where: { gatewayReference: piId } });
        if (order && order.paymentStatus !== 'PAYMENT_CONFIRMED') {
          const reason = dataObject.last_payment_error && dataObject.last_payment_error.message
            ? String(dataObject.last_payment_error.message)
            : 'payment declined';
          await markOrderPaymentFailed(order.id, reason, piId);
          console.log(`BANELIO: webhook ${type} -> orden ${order.id} a PAYMENT_FAILED.`);
        }
      } else if (type === 'charge.refunded') {
        const eventObject = dataObject;
        const piRef = String(eventObject.payment_intent || eventObject.id || '');
        if (piRef) {
          const order = await prisma.order.findFirst({ where: { gatewayReference: piRef } });
          if (order) {
            await markOrderRefunded(order.id, piRef);
            console.log(`BANELIO: webhook ${type} -> orden ${order.id} a REFUNDED.`);
          }
        }
      }

      return res.json({ received: true });
    } catch (err: any) {
      return res.status(500).json({ received: false, error: err?.message || 'unknown' });
    }
  });

  // GET /api/transfers/pricing - precios de transferencia/renewal por TLD.
  // Si TRANSFER_TLDS está vacío, retorna configured:false para que el frontend
  // muestre un mensaje honesto en lugar de precios inventados.
  app.get('/api/transfers/pricing', async (_req, res) => {
    try {
      const result = await getTransferPricing(prisma);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ configured: false, error: err.message });
    }
  });

  // GET /api/domains/pricing - Catálogo comercial de TLDs y precios de dominios
  // Mantiene estrictamente separados:
  // - coste mayorista ResellerClub (providerCostUSD / providerTransferCostUSD)
  // - precio comercial Banelio (registrationPriceUSD / transferPriceUSD / renewalPriceUSD)
  // - operación registro vs transferencia
  app.get('/api/domains/pricing', async (req, res) => {
    try {
      const result = await getDomainCatalogPricing(prisma);
      const requestedTld = typeof req.query.tld === 'string'
        ? req.query.tld.trim().toLowerCase().replace(/^\./, '')
        : null;

      if (requestedTld) {
        const item = result.items.find((i) => i.tld.toLowerCase() === requestedTld);
        if (!item) {
          return res.status(404).json({
            success: false,
            error: `TLD .${requestedTld} no configurado en el catálogo comercial.`
          });
        }
        return res.json({ success: true, item });
      }

      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // BANELIO CATALOG SERVER-SIDE (FASE 1B)
  // ==========================================

  // GET /api/catalog - catálogo activo server-side (desde Prisma).
  // Solo items activos, JSON limpio sin secretos ni campos internos.
  app.get('/api/catalog', async (req, res) => {
    try {
      const catalog = await getActiveCatalog(prisma);
      return res.json({ success: true, count: catalog.length, items: catalog });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // BANELIO COMMERCIAL PRICING & ADMIN
  // ==========================================

  // GET /api/admin/pricing - Administración del motor de precios
  app.get('/api/admin/pricing', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer || customer.role !== 'ADMIN') {
        if (process.env.NODE_ENV === 'production') {
          return res.status(403).json({ success: false, error: 'Acceso restringido a administradores.' });
        }
      }

      const overview = await getAdminPricingOverview(prisma);
      return res.json({ success: true, count: overview.length, items: overview });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/admin/pricing/update - Actualización de costos de proveedor / márgenes
  app.post('/api/admin/pricing/update', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer || customer.role !== 'ADMIN') {
        if (process.env.NODE_ENV === 'production') {
          return res.status(403).json({ success: false, error: 'Acceso restringido a administradores.' });
        }
      }

      const {
        sku,
        providerCostUSD,
        providerRenewalCostUSD,
        providerTransferCostUSD,
        partnerMargin,
        retailMargin,
        active
      } = req.body || {};
      if (!sku) {
        return res.status(400).json({ success: false, error: 'SKU es requerido.' });
      }

      const result = await updateAdminPricing(
        {
          sku,
          providerCostUSD,
          providerRenewalCostUSD,
          providerTransferCostUSD,
          partnerMargin,
          retailMargin,
          active
        },
        prisma
      );
      return res.json({ success: true, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/admin/metrics - Métricas internas de pricing y utilización de entitlements
  app.get('/api/admin/metrics', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer || customer.role !== 'ADMIN') {
        if (process.env.NODE_ENV === 'production') {
          return res.status(403).json({ success: false, error: 'Acceso restringido a administradores.' });
        }
      }

      const metrics = await getAdminInternalMetrics(prisma);
      return res.json({ success: true, metrics });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/entitlements - Entitlements del cliente autenticado
  app.get('/api/entitlements', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
      }

      const entitlements = await prisma.entitlement.findMany({
        where: { customerId: customer.id },
        orderBy: { grantedAt: 'desc' }
      });

      return res.json({ success: true, count: entitlements.length, entitlements });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/tax/:country - tasa de impuesto por país (ISO 3166-1 alpha-2).
  // El servidor decide la tasa por país; NUNCA acepta un % enviado por el cliente.
  app.get('/api/tax/:country', (req, res) => {
    const code = normalizeCountryCode(req.params.country);
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de país inválido. Usa ISO 3166-1 alpha-2 (ej. MX).'
      });
    }
    const tax = getTaxForCountry(code);
    return res.json({ success: true, ...tax });
  });

  // GET /api/tax - lista de países soportados y sus tasas.
  app.get('/api/tax', (_req, res) => {
    return res.json({ success: true, supportedCountries: getSupportedCountries() });
  });

  // ==========================================
  // ORDERS (FASE GRANDE) - SERVER-AUTHORITATIVE
  // ==========================================

  // POST /api/orders/create - crea una orden de forma idempotente.
  // El servidor valida SKU/catálogo/tasas y calcula subtotal/impuesto/total.
  // NUNCA acepta precios/impuestos/estados del cliente.
  app.post('/api/orders/create', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);

      const orderInput = {
        ...(req.body || {}),
        authenticatedCustomerId: customer?.id,
      };

      const result = await createOrder(orderInput);
      return res.status(result.created ? 201 : 200).json({
        success: true,
        created: result.created,
        idempotent: result.idempotent,
        order: result.order
      });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return res.status(err.status).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/orders/:id - devuelve los datos REALES de la orden desde la DB.
  // Solo campos no sensibles; nunca EPP, tokens ni credenciales.
  app.get('/api/orders/:id', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer) {
        return res.status(401).json({
          success: false,
          error: 'Autenticación requerida.',
        });
      }

      const order = await getOrderById(req.params.id as string);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada.',
        });
      }

      const authCheck = authorizeOrderAccess(customer, order);
      if (!authCheck.authorized) {
        return res.status(authCheck.status === 403 && order.customerId ? 404 : authCheck.status).json({
          success: false,
          error: authCheck.error,
        });
      }

      return res.json({ success: true, order });
    } catch (err: any) {
      if (err instanceof OrderValidationError) {
        return res.status(err.status).json({ success: false, error: err.message });
      }
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/orders/:id/retry-provision - Reintento seguro e idempotente de aprovisionamiento
  app.post('/api/orders/:id/retry-provision', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      const orderId = req.params.id;
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return res.status(404).json({ success: false, error: 'Orden no encontrada.' });
      }

      const authCheck = authorizeOrderAccess(customer, order);
      if (!authCheck.authorized) {
        return res.status(authCheck.status).json({ success: false, error: authCheck.error });
      }

      const result = await retryProvisionOrder(orderId);
      return res.json({ success: result.success, ...result });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // ==========================================
  // CUSTOMER PORTAL BACKEND ENDPOINTS
  // ==========================================

  // GET /api/customer/orders (y alias /api/orders) - Devuelve las órdenes REALES del cliente autenticado
  const getCustomerOrdersHandler = async (req: express.Request, res: express.Response) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
      }

      const orders = await prisma.order.findMany({
        where: { customerId: customer.id },
        orderBy: { createdAt: 'desc' }
      });

      return res.json({
        success: true,
        count: orders.length,
        orders: orders.map(toPublicOrder)
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  };

  app.get('/api/customer/orders', getCustomerOrdersHandler);
  app.get('/api/orders', getCustomerOrdersHandler);

  // GET /api/customer/domains - Dominios del cliente autenticado
  app.get('/api/customer/domains', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
      }

      const domainEntitlements = await prisma.entitlement.findMany({
        where: {
          customerId: customer.id,
          serviceType: 'DOMAIN'
        },
        orderBy: { grantedAt: 'desc' }
      });

      const result = await resolveCustomerDomains(customer, domainEntitlements);
      return res.json(result);
    } catch (err: any) {
      console.error('BANELIO: Error al obtener dominios del cliente:', err?.name || 'Error');
      return res.status(500).json({
        success: false,
        error: 'No se pudieron cargar los dominios en este momento.'
      });
    }
  });

  // Vite middleware for development or Static serve for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Seed idempotente del catálogo comercial server-side (upsert por sku).
  try {
    await seedCatalog(prisma);
  } catch (err: any) {
    console.warn('BANELIO: no se pudo sembrar el catálogo:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Banelio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
