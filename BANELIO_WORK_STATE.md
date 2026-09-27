# BANELIO Work State - Commercial Platform Implementation

## Summary
Conversión de plataforma demo a producción comercial con: dominios, hosting, email transaccional/transmitido, SSL, pagos multimoneda (USD/MXN), webhooks integrados.

---

## Completed
- Estructura proyecto mapeada (server/, src/, prisma/, tools/)
- Auth.ts: email verification tokens funcional (pendiente configs MAIL_*)
- Payments.ts: Stripe/PayPal/OXXO helpers listos (pendiente STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)
- PricingEngine.ts: motor de precios con margins y FX configured
- DomainService.ts: API check/transfer domains lista

---

## Active
1. Documentación de estado en BANELIO_WORK_STATE.md [PENDING] ← **HACE UN MOMENTO**

2. Selección de prioridad implementación requerida a desarrollador por:
   - Herramienta question() falló con SchemaError (formato parámetro 'questions' debe ser array JSON)
   - No pude recuperar respuesta del usuario tras bloque técnico

---

## Blocked
- Implementaciones sin credenciales ambientales (EMAIL_* | STRIPE_* | PAYPAL_*) requieren:
  - Configuración OR simulación temporal documentada
  - O clarificación de proveedor real para cada funcionalidad

---

## Pending Implementation Queue

### High Priority (Core Business)
1. **Domain Registration/Transfer/Redirection** (src/services/domainService.ts)
   - [ ] Integrar WHOIS API, EPP codes, DNS management
   - [ ] Implementar ICANN transfer lock/release flow
   - [ ] Add propagation cache de 48h

2. **Webhook Handlers** (server/webhooks/handler.ts)
   - [ ] Stripe: payment_intent.completed + chargebeat_success/recurring_update
   - [ ] PayPal: BILLING.SUBSCRIBED + TRANSACTION.COMPLETED
   - [ ] OXXO: pago confirmado + conciliación automática

3. **SSL Auto-Provisioning** (server/ssl-auto.ts)
   - [ ] Let's Encrypt ACME integration
   - [ ] Certificate rotation automático 30d
   - [ ] DNS validation bot para dominios transferidos

### Medium Priority (Revenue Enablers)
4. **Email Services** (server/email.ts, server/sendGridWrapper.ts)
   - PENDIENTE: MAIL_HOST/MAIL_PORT/MAIL_SECURE configs nodemailer OR SendGrid API
   - [ ] Transactional emails verificados + spam protection
   - [ ] Campaign sending con BCC rotation

5. **Hosting Operations** (src/controllers/hostingController.ts)
   - [ ] Linode provisioning real
   - [ ] cPanel/WHMCS integration O autoinstalar NGINX+PHP+FPM
   - [ ] Backups automáticos 30d retention

### Low Priority (UX + Growth)
6. **DNS Management** (server/dns-manager.ts)
   - [ ] API RRsets CRUD, failover DNS
   - [ ] Cloudflare/Route53 integration

7. **Billing Portal** (src/routes/customerPortal.ts)
   - [ ] Usage display (storage/bandwidth/emails sent)
   - [ ] Invoicing PDF generación

---

## Decision Required: Environmental Configuration

### Option A: Production Credentesiales
Proporcionar variables de entorno para cada proveedor real

### Option B: Simulación Temporal Dev
Activar modo sandbox con mocks documentados, desactivando funcionalidades no críticas

**Selecciona una opción y especifica qué funcionalitas implementar primero**
