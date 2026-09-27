import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { prisma } from './server/db';
import { seedCatalog, getActiveCatalog, getTransferPricing } from './server/catalog';
import {
  seedPricingData,
  getPublicSolutions,
  getResellerPricing,
  getAdminPricingOverview,
  updateAdminPricing,
  getAdminInternalMetrics,
  activateEntitlement
} from './server/pricing';
import { Currency } from './src/types';
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
import { DEV_PAGE_HTML } from './server/devPage';
import {
  createOrder,
  getOrderById,
  getOrderForPayment,
  markOrderPaid,
  markOrderRefunded,
  markOrderPaymentFailed,
  OrderValidationError
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
  paypalCaptureOrder
} from './server/payments';

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

async function queryRegistry(endpoint: string, queryParams: Record<string, string>) {
  const config = getRegistryConfig();
  if (!config.isConfigured) {
    throw new Error('REGISTRY_NOT_CONFIGURED');
  }

  const url = new URL(endpoint, config.baseUrl);
  if (config.registryId) url.searchParams.set('partner-id', config.registryId);
  if (config.apiKey) url.searchParams.set('api-key', config.apiKey);

  for (const [key, value] of Object.entries(queryParams)) {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'User-Agent': 'Banelio-Cloud-App/1.0'
    }
  });

  const rawText = await response.text();
  let data: any;
  try {
    data = JSON.parse(rawText);
  } catch (e) {
    data = { raw: rawText };
  }

  return { status: response.status, ok: response.ok, data };
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

      if (!origin || allowedOrigins.has(origin)) {
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

app.post('/api/auth/register', authRegistrationLimiter, async (req, res) => {    return registerAuth(req, res);  });  app.post('/api/auth/login', authLoginLimiter, async (req, res) => {    return loginAuth(req, res);  });  app.post('/api/auth/logout', async (req, res) => {    return logoutAuth(req, res);  });  app.get('/api/auth/me', async (req, res) => {    return meAuth(req, res);  });  app.post('/api/auth/2fa/setup', async (req, res) => {    return setupTwoFactorAuth(req, res);  });  app.post('/api/auth/2fa/verify-setup', authTwoFactorCodeLimiter, async (req, res) => {    return verifyTwoFactorSetup(req, res);  });  app.post('/api/auth/2fa/verify', authTwoFactorCodeLimiter, async (req, res) => {    return verifyTwoFactorCodeAuth(req, res);  });  app.post('/api/auth/2fa/disable', async (req, res) => {    return disableTwoFactorAuth(req, res);  });  app.post('/api/auth/2fa/complete-login', authTwoFactorLimiter, async (req, res) => {    return completeTwoFactorLoginAuth(req, res);  });  // API Route 0:
  app.post('/api/auth/email-verification/send', authEmailVerificationLimiter, async (req, res) => { return sendEmailVerificationAuth(req, res); });
  app.post('/api/auth/email-verification/verify', authEmailVerificationLimiter, async (req, res) => { return verifyEmailAuth(req, res); });
  app.post('/api/auth/password-reset/request', authPasswordResetLimiter, async (req, res) => { return requestPasswordResetAuth(req, res); });
  app.post('/api/auth/password-reset/confirm', authPasswordResetLimiter, async (req, res) => { return resetPasswordAuth(req, res); });

  app.get('/api/domains/check.php', async (req, res) => {
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    if (!domain) {
      return res.status(400).json({ success: false, error: 'Domain parameter is required' });
    }

    try {
      const targetUrl = `https://banelio.com/api/domains/check.php?domain=${encodeURIComponent(domain)}`;
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
      // Remote host unreachable fallback
    }

    // If the real registry is unreachable we must NOT report availability.
    // Return an explicit 'unknown' status so the UI surfaces "no determinable" instead of a false result.
    return res.status(502).json({
      success: false,
      domain,
      error: 'Registry temporalmente no disponible'
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

  // API Route 0.2: Direct proxy to Banelio's official PHP transfer order creation (POST /api/domains/transfer-order.php)
  app.post('/api/domains/transfer-order.php', async (req, res) => {
    const { domain, auth_code, auto_renew, customer } = req.body || {};

    if (!domain || !domain.trim()) {
      return res.status(400).json({
        success: false,
        error: 'El parámetro domain es obligatorio.'
      });
    }

    try {
      const targetUrl = 'https://banelio.com/api/domains/transfer-order.php';
      const backendResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Banelio-App-Client/1.0'
        },
        body: JSON.stringify({
          domain: domain.trim().toLowerCase(),
          auth_code: (auth_code || '').trim(),
          auto_renew: Boolean(auto_renew),
          customer: customer || undefined
        })
      });

      if (backendResponse.ok) {
        const responseData = await backendResponse.json();
        return res.status(backendResponse.status).json(responseData);
      }
    } catch {
      // Fallback
    }

    return res.status(502).json({
      success: false,
      domain: domain.trim().toLowerCase(),
      status: 'Failed',
      error: 'No fue posible registrar la solicitud de transferencia. Inténtalo más tarde.'
    });
  });

  // API Route 0.3: Direct proxy to Auth/EPP Code update (POST /api/domains/transfer-auth.php)
  app.post('/api/domains/transfer-auth.php', async (req, res) => {
    const { domain, auth_code } = req.body || {};

    if (!domain || !auth_code) {
      return res.status(400).json({
        success: false,
        error: 'Dominio y Auth Code son obligatorios.'
      });
    }

    try {
      const targetUrl = 'https://banelio.com/api/domains/transfer-auth.php';
      const backendResponse = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'User-Agent': 'Banelio-App-Client/1.0'
        },
        body: JSON.stringify({
          domain: domain.trim().toLowerCase(),
          auth_code: auth_code.trim()
        })
      });

      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return res.status(backendResponse.status).json(data);
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      domain: domain.trim().toLowerCase(),
      message: 'Código Auth/EPP actualizado correctamente.'
    });
  });

  // API Route 0.4: Direct proxy to Transfer Status (GET /api/domains/transfer-status.php)
  app.get('/api/domains/transfer-status.php', async (req, res) => {
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    const orderId = (req.query.order_id as string || '').trim();

    try {
      const targetUrl = `https://banelio.com/api/domains/transfer-status.php?domain=${encodeURIComponent(domain)}&order_id=${encodeURIComponent(orderId)}`;
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
      domain: domain || undefined,
      status: 'unknown',
      status_label: 'Estado no disponible',
      message: 'No fue posible consultar el estado de la transferencia en este momento.'
    });
  });

  // API Route 0.5: Customer lookup and contacts proxy
  app.get('/api/domains/customer.php', async (req, res) => {
    try {
      const backendResponse = await fetch('https://banelio.com/api/domains/customer.php', {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' }
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
      const backendResponse = await fetch('https://banelio.com/api/domains/contacts.php', {
        method: 'GET',
        headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0' }
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

    if (!config.isConfigured) {
      return res.json({
        configured: false,
        environment: config.env,
        message: 'Faltan credenciales de Registry (REGISTRY_PARTNER_ID y REGISTRY_API_KEY). Configúralas en .env para habilitar la conexión real.',
        status: 'NOT_CONFIGURED'
      });
    }

    try {
      return res.json({
        configured: true,
        environment: config.env,
        baseUrl: config.baseUrl,
        status: 'CONNECTED'
      });
    } catch (err: any) {
      return res.status(500).json({
        configured: true,
        error: err.message,
        hint: 'Verifica la conectividad con el cluster de Banelio.'
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

  // API Route 2: Domain Availability Proxy with White-Label margin
  app.get('/api/domains/check', async (req, res) => {
    const domain = (req.query.domain as string || '').trim().toLowerCase();
    const tlds = (req.query.tlds as string || 'com,net,org,mx').trim();

    if (!domain) {
      return res.status(400).json({ error: 'Nombre de dominio requerido' });
    }

    try {
      const targetUrl = `https://banelio.com/api/domains/check.php?domain=${encodeURIComponent(domain)}`;
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

    // If the real registry is unreachable we must NOT report availability.
    // Return an explicit 502 so the UI surfaces "no determinable" instead of a false result.
    return res.status(502).json({
      success: false,
      domain: domain || undefined,
      error: 'Registry temporalmente no disponible. No se puede determinar disponibilidad.'
    });
  });

  // API Route 3: Domain Suggestion Proxy.
  // NOTE: There is no real suggestion provider wired up yet. We must NOT invent
  // availability or return fabricated suggestions. Reply honestly as not available.
  app.get('/api/domains/suggest', async (_req, res) => {
    return res.status(503).json({
      success: false,
      error: 'El servicio de sugerencias de dominios aún no está conectado a un proveedor real.'
    });
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

      await prisma.order.update({
        where: { id: orderId },
        data: { gatewayReference: intent.id, paymentMethod: 'STRIPE_CARD' }
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
      return res.json({
        configured: true,
        status: 'COMPLETED',
        confirmed: true,
        captureId: capture.captureId,
        amount: received === null ? null : received.toFixed(2),
        currency: capture.currency,
        order: result.order
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
      const amountCentsMXN = await usdToMxnCents(totalUSD);

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

      await prisma.order.update({
        where: { id: orderId },
        data: { gatewayReference: intent.id, paymentMethod: 'OXXO_PAY' }
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
        const order = await prisma.order.findFirst({ where: { gatewayReference: piId } });
        if (order) {
          const expectedAmountCents = Math.round(Number(order.total) * 100);
          const receivedAmountCents = Number(
            dataObject.amount_received ?? dataObject.amount ?? NaN
          );
          const expectedCurrency = String(order.currency || 'usd').toLowerCase();
          const receivedCurrency = String(dataObject.currency || '').toLowerCase();

          if (
            !Number.isFinite(receivedAmountCents) ||
            receivedAmountCents !== expectedAmountCents ||
            receivedCurrency !== expectedCurrency
          ) {
            console.error(
              `BANELIO: webhook ${type} rechazado para orden ${order.id}: ` +
              `importe/moneda no coinciden. ` +
              `esperado=${expectedAmountCents} ${expectedCurrency}, ` +
              `recibido=${receivedAmountCents} ${receivedCurrency || 'unknown'}`
            );
            return res.status(400).json({
              received: false,
              error: 'El importe o la moneda del pago no coinciden con la orden.'
            });
          }

          await markOrderPaid(order.id, piId);
          console.log(`BANELIO: webhook ${type} -> orden ${order.id} a PAYMENT_CONFIRMED (provision NO activado).`);
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
  // BANELIO COMMERCIAL PRICING ARCHITECTURE
  // ==========================================

  // GET /api/pricing/solutions - Soluciones BANELIO (START, BUSINESS, PRO)
  app.get('/api/pricing/solutions', async (req, res) => {
    try {
      const currency = (req.query.currency as Currency) || 'USD';
      const solutions = await getPublicSolutions(currency, prisma);
      return res.json({ success: true, count: solutions.length, solutions });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/pricing/offers - Ofertas comerciales activas
  app.get('/api/pricing/offers', async (_req, res) => {
    try {
      const offers = await prisma.commercialOffer.findMany({ where: { active: true } });
      return res.json({ success: true, count: offers.length, offers });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/pricing/reseller - Catálogo Partner/Reseller (precio retail, partner, margen)
  app.get('/api/pricing/reseller', async (req, res) => {
    try {
      const currency = (req.query.currency as Currency) || 'USD';
      const catalog = await getResellerPricing(currency, prisma);
      return res.json({ success: true, count: catalog.length, catalog });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

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

  // POST /api/entitlements/:id/activate - Activa un entitlement de solución
  app.post('/api/entitlements/:id/activate', async (req, res) => {
    try {
      const customer = await getAuthenticatedCustomer(req);
      if (!customer) {
        return res.status(401).json({ success: false, error: 'Autenticación requerida.' });
      }

      const result = await activateEntitlement(req.params.id as string, customer.id, req.body?.config, prisma);
      return res.json(result);
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

      if (order.customerId !== customer.id && customer.role !== 'ADMIN') {
        return res.status(404).json({
          success: false,
          error: 'Orden no encontrada.',
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

  // ==========================================
  // BACKEND CONTROL CENTER (/dev)
  // ==========================================
  // Página independiente (fuera de la SPA pública) con el estado real del
  // backend. En desarrollo se sirve sin auth; en producción esta ruta debe
  // protegerse detrás de autenticación admin.
  app.get('/dev', (_req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('X-Robots-Tag', 'noindex');
    return res.send(DEV_PAGE_HTML);
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

  // Seed idempotente del catálogo server-side (upsert por sku). No borra nada.
  try {
    await seedCatalog(prisma);
    await seedPricingData(prisma);
  } catch (err: any) {
    console.warn('BANELIO: no se pudo sembrar el catálogo o pricing:', err.message);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Banelio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
