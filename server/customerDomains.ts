import { buildBridgeAuthHeaders } from './phpBridgeAuth';

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
    const targetUrl = targetUrlOverride || `https://banelio.com/api/domains/my-domains.php?email=${encodeURIComponent(customer.email)}&customer_id=${encodeURIComponent(customer.id)}`;
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

  return {
    success: true,
    count: remoteQueried ? remoteDomains.length : localEntitlements.length,
    domains: remoteQueried ? remoteDomains : localEntitlements,
    source: remoteQueried ? 'IONOS_RESELLERCLUB_REMOTE' : 'LOCAL_ENTITLEMENTS',
    registryConnected,
    backendDependent: !remoteQueried,
    message: remoteQueried
      ? 'Dominios sincronizados en vivo desde el Registry de ResellerClub.'
      : 'Mostrando dominios registrados en el sistema Banelio. La sincronización remota con ResellerClub no estuvo disponible o no pudo completarse.'
  };
}
