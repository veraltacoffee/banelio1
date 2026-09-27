export const DEV_PAGE_TITLE = 'BANELIO · Backend Control Center';

/**
 * BANELIO - Backend Control Center (http://localhost:3000/dev)
 *
 * Página independiente (fuera de la SPA pública) que muestra el estado REAL del
 * backend consultando exclusivamente los endpoints /api/... del servidor.
 * No modifica el diseño público; solo se sirve en /dev.
 *
 * Seguridad: NO incluye ningún secreto. En producción esta ruta debe protegerse
 * detrás de autenticación admin (ver server.ts).
 */
export const DEV_PAGE_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BANELIO · Backend Control Center</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background: #0b0f14; color: #e6edf3; }
  header { padding: 20px 24px; border-bottom: 1px solid #1f2937; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
  header h1 { font-size: 18px; margin: 0; letter-spacing: 0.05em; }
  header .env { font-size: 12px; color: #8b949e; padding: 3px 8px; border: 1px solid #30363d; border-radius: 6px; }
  .wrap { padding: 20px 24px; display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }
  .card { background: #11161d; border: 1px solid #1f2937; border-radius: 10px; padding: 16px; }
  .card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #8b949e; margin: 0 0 12px; }
  .row { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px dashed #1f2937; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .lbl { color: #9ca3af; }
  .ok { color: #4ade80; font-weight: 600; }
  .bad { color: #f87171; font-weight: 600; }
  .warn { color: #fbbf24; font-weight: 600; }
  .mono { color: #79c0ff; word-break: break-all; }
  button { background: #238636; color: #fff; border: none; border-radius: 6px; padding: 6px 12px; cursor: pointer; font-weight: 600; }
  button:hover { background: #2ea043; }
  input, select { background: #0b0f14; color: #e6edf3; border: 1px solid #30363d; border-radius: 6px; padding: 6px 8px; }
  .test { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; flex-wrap: wrap; }
  pre { background: #0b0f14; border: 1px solid #1f2937; border-radius: 8px; padding: 10px; overflow: auto; max-height: 260px; font-size: 12px; white-space: pre-wrap; word-break: break-word; }
  .pill { font-size: 11px; padding: 2px 8px; border-radius: 10px; border: 1px solid #30363d; }
</style>
</head>
<body>
<header>
  <h1>BANELIO · Backend Control Center</h1>
  <span class="env" id="env">—</span>
  <span class="env" id="healthPill">conectando…</span>
</header>

<div class="wrap">

  <div class="card">
    <h2>Salud general</h2>
    <div id="health"></div>
  </div>

  <div class="card">
    <h2>Integraciones</h2>
    <div id="integrations"></div>
  </div>

  <div class="card">
    <h2>Catálogo (Prisma)</h2>
    <div id="catalog"></div>
  </div>

  <div class="card">
    <h2>Impuestos por país</h2>
    <div id="tax"></div>
  </div>

  <div class="card">
    <h2>Pagos & FX (config)</h2>
    <div id="paymentsConfig"></div>
  </div>

  <div class="card">
    <h2>Pricing Transferencias/Renewal</h2>
    <div id="transferPricing"></div>
  </div>

  <div class="card" style="grid-column: 1 / -1;">
    <h2>Probador de endpoints</h2>
    <div class="test">
      <input id="domainInput" value="example.com" style="flex:1;min-width:200px;" />
      <button onclick="runWhois()">WHOIS/RDAP</button>
      <button onclick="runCheck()">Check .php</button>
      <button onclick="runTransfer()">Transfer .php</button>
    </div>
    <pre id="testerResult">Haz clic en un botón para probar con el endpoint real.</pre>
  </div>

</div>

<script>
async function j(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const text = await r.text();
  let data; try { data = JSON.parse(text); } catch { data = text; }
  return { httpStatus: r.status, data };
}
function esc(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'object') return JSON.stringify(v, null, 2);
  return String(v);
}
function pill(status) {
  if (status === 'ok' || status === 'up' || status === 'configured' || status === 'CONNECTED' || status === true) return '<span class="ok pill">OK</span>';
  if (status === 'down' || status === 'error') return '<span class="bad pill">ERROR</span>';
  if (status === 'not_configured' || status === 'NOT_CONFIGURED') return '<span class="warn pill">NO CONFIGURADO</span>';
  return '<span class="pill">' + esc(status) + '</span>';
}
function renderHealth() {
  return fetch('/api/health').then(r => r.json()).then(h => {
    document.getElementById('healthPill').textContent = 'status: ' + h.status + ' · db:' + h.database.status;
    const db = h.database;
    document.getElementById('health').innerHTML =
      row('Servicio', h.service, 'mono') +
      row('Estado', pill(h.status), '') +
      row('Versión', h.version, '') +
      row('Tiempo en línea', h.uptimeSeconds + ' s', '') +
      row('Entorno', h.environment, 'mono') +
      row('Modo pagos', h.paymentsEnv, 'mono') +
      row('Base de datos', pill(db.status), '') +
      row('· items catálogo', db.catalogItems, '') +
      row('· órdenes', db.orders, '') +
      row('· clientes', db.customers, '') +
      (db.error ? row('· error db', db.error, 'bad') : '');
    document.getElementById('integrations').innerHTML = (h.integrations || []).map(i =>
      row(i.label, pill(i.status), '') + row('· ' + i.details, '', 'lbl')
    ).join('') || '<div class="lbl">sin datos</div>';
  }).catch(e => {
    document.getElementById('health').innerHTML = row('Error', esc(e.message), 'bad');
  });
}
function row(l, v, cls) { return '<div class="row"><span class="lbl">' + l + '</span><span class="' + cls + '">' + v + '</span></div>'; }
function renderCatalog() {
  return fetch('/api/catalog').then(r => r.json()).then(c => {
    if (!c.success) { document.getElementById('catalog').innerHTML = '<div class="bad">' + esc(c.error) + '</div>'; return; }
    document.getElementById('catalog').innerHTML =
      row('Total items', c.count, '') +
      '<pre>' + esc(c.items.map(i => i.sku + ' · ' + i.name + ' · $' + i.price + ' ' + i.currency + ' · ' + i.category)).join('\\n') + '</pre>';
  }).catch(e => { document.getElementById('catalog').innerHTML = row('Error', esc(e.message), 'bad'); });
}
function renderTax() {
  return fetch('/api/tax').then(r => r.json()).then(t => {
    document.getElementById('tax').innerHTML = '<pre>' + esc(t.supportedCountries || []) + '</pre>';
  }).catch(e => { document.getElementById('tax').innerHTML = row('Error', esc(e.message), 'bad'); });
}
function renderPaymentsConfig() {
  return fetch('/api/payments/config').then(r => r.json()).then(c => {
    if (!c) { document.getElementById('paymentsConfig').innerHTML = '<div class="bad">sin datos</div>'; return; }
    const line = (l, v) => row(l, typeof v === 'boolean' ? pill(v) : esc(v), '');
    document.getElementById('paymentsConfig').innerHTML =
      line('Stripe', c.stripe && c.stripe.configured) +
      line('· pk key', c.stripe && c.stripe.publishableKey ? 'presente' : 'no', 'lbl') +
      line('PayPal', c.paypal && c.paypal.configured) +
      line('· mode', (c.paypal && c.paypal.mode) || 'sandbox', 'lbl') +
      line('Webhook Stripe', c.webhooks && c.webhooks.stripe && c.webhooks.stripe.configured) +
      line('FX USD→MXN', (c.fx && c.fx.usdMxnSource) || 'n/a', 'lbl') +
      line('· override', (c.fx && c.fx.overrideConfigured) || false);
  }).catch(e => { document.getElementById('paymentsConfig').innerHTML = row('Error', esc(e.message), 'bad'); });
}
function renderTransferPricing() {
  return fetch('/api/transfers/pricing').then(r => r.json()).then(r => {
    if (!Array.isArray(r) || r.length === 0) {
      document.getElementById('transferPricing').innerHTML =
        row('Estado', pill('not_configured'), '') +
        '<div class="lbl">No hay precios reales configurados en TRANSFER_TLDS / RENEWAL_TLDS.</div>';
      return;
    }
    document.getElementById('transferPricing').innerHTML =
      row('Total', r.length, '') +
      '<pre>' + esc(r.map(i => i.operation + ' · ' + i.tld + ' · ' + i.sku + ' · $' + i.price + ' ' + i.currency)).join('\\n') + '</pre>';
  }).catch(e => { document.getElementById('transferPricing').innerHTML = row('Error', esc(e.message), 'bad'); });
}
function runWhois() {
  const d = document.getElementById('domainInput').value.trim();
  return j('/api/domains/whois?domain=' + encodeURIComponent(d)).then(o => {
    document.getElementById('testerResult').textContent = 'HTTP ' + o.httpStatus + '\\n' + JSON.stringify(o.data, null, 2);
  });
}
function runCheck() {
  const d = document.getElementById('domainInput').value.trim();
  return j('/api/domains/check.php?domain=' + encodeURIComponent(d)).then(o => {
    document.getElementById('testerResult').textContent = 'HTTP ' + o.httpStatus + '\\n' + JSON.stringify(o.data, null, 2);
  });
}
function runTransfer() {
  const d = document.getElementById('domainInput').value.trim();
  return j('/api/domains/transfer.php?domain=' + encodeURIComponent(d)).then(o => {
    document.getElementById('testerResult').textContent = 'HTTP ' + o.httpStatus + '\\n' + JSON.stringify(o.data, null, 2);
  });
}
document.getElementById('env').textContent = 'env: ' + (window.__env || 'development');
renderHealth();
renderCatalog();
renderTax();
renderPaymentsConfig();
renderTransferPricing();
</script>
</body>
</html>`;
