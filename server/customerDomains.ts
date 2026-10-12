import { buildBridgeAuthHeaders } from './phpBridgeAuth';
import { getBridgeBaseUrl } from './provisioning';

export interface CustomerDomainsResult {
  success: boolean;
  count: number;
  domains: any[];
  source: 'IONOS_RESELLERCLUB_REMOTE' | 'LOCAL_ENTITLEMENTS';
  registryConnected: boolean;
  backendDependent: boolean;
  message: string;
}

/**
 * Resuelve los dominios del cliente consultando de forma prioritaria el puente remoto en IONOS
 * (my-domains.php). Si la consulta remota falla o no está disponible, utiliza los entitlements locales
 * como fallback sin marcar NUNCA registryConnected como exitoso.
 */
export async function resolveCustomerDomains(
  customer: { id: string; email: string },
  localEntitlements: any[],
  customFetch?: typeof fetch,
  targetUrlOverride?: string
): Promise<CustomerDomainsResult> {
  let remoteDomains: any[] = [];
  let remoteQueried = false;

  try {
    const fetchFn = customFetch || fetch;
    const baseUrl = getBridgeBaseUrl();
    const targetUrl = targetUrlOverride || `${baseUrl}domains/my-domains.php?email=${encodeURIComponent(customer.email)}&customer_id=${encodeURIComponent(customer.id)}`;
    const authHeaders = buildBridgeAuthHeaders('GET', targetUrl, '');

    const remoteRes = await fetchFn(targetUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'Banelio-App-Client/1.0', ...authHeaders },
      signal: AbortSignal.timeout(3000)
    });

    if (remoteRes.ok) {
      const remoteData: any = await remoteRes.json();
      if (remoteData && remoteData.success === true && Array.isArray(remoteData.domains)) {
        remoteDomains = remoteData.domains;
        remoteQueried = true;
      }
    }
  } catch {
    remoteQueried = false;
  }

  const registryConnected = Boolean(remoteQueried);

  const normalizedLocalDomains = localEntitlements.map((e: any) => {
    if (!e || typeof e !== 'object') return e;
    const config = e.config && typeof e.config === 'object' ? e.config : {};
    return {
      ...e,
      domain: e.domain || config.domain || e.name || 'dominio.com',
      status: e.status === 'PROVISIONED' ? 'Active' : (e.status || 'Active'),
      creationDate: e.creationDate || (e.grantedAt ? new Date(e.grantedAt).toISOString() : null),
      expiryDate: e.expiryDate || (e.expiresAt ? new Date(e.expiresAt).toISOString() : null),
      privacyProtection: e.privacyProtection ?? (config.privacyProtection ?? true),
      locked: e.locked ?? (config.locked ?? true),
      autoRenew: e.autoRenew ?? (config.autoRenew ?? true),
      providerOrderId: e.providerOrderId || config.providerOrderId || undefined,
      eppCode: e.eppCode || config.eppCode || undefined,
      registrant: e.registrant || config.registrant || undefined
    };
  });

  return {
    success: true,
    count: remoteQueried ? remoteDomains.length : normalizedLocalDomains.length,
    domains: remoteQueried ? remoteDomains : normalizedLocalDomains,
    source: remoteQueried ? 'IONOS_RESELLERCLUB_REMOTE' : 'LOCAL_ENTITLEMENTS',
    registryConnected,
    backendDependent: !remoteQueried,
    message: remoteQueried
      ? 'Dominios sincronizados en vivo desde el Registry de ResellerClub.'
      : 'Mostrando dominios registrados en el sistema Banelio. La sincronización remota con ResellerClub no estuvo disponible o no pudo completarse.'
  };
}
