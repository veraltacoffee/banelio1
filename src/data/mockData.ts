import {
  AuditLogEntry,
  Order,
  PayoutRequest,
  ProvisioningJob,
  ResellerCommission,
  SupportTicket,
  TldConfig,
  UserService
} from '../types';

export const INITIAL_TLDS: TldConfig[] = [
  { tld: 'com', providerCost: 9.80, marginPercent: 1.24, fixedMarkup: 0.0, isPopular: true, category: 'Popular' }, // -> $21.99 USD / $399 MXN
  { tld: 'net', providerCost: 11.20, marginPercent: 1.44, fixedMarkup: 0.0, isPopular: true, category: 'Popular' }, // -> $27.34 USD / $499 MXN
  { tld: 'org', providerCost: 10.50, marginPercent: 1.34, fixedMarkup: 0.0, isPopular: true, category: 'Popular' }, // -> $24.60 USD / $449 MXN
  { tld: 'mx', providerCost: 18.50, marginPercent: 1.37, fixedMarkup: 0.0, isPopular: true, category: 'Geo' }, // -> $43.78 USD / $799 MXN
  { tld: 'com.mx', providerCost: 14.00, marginPercent: 1.34, fixedMarkup: 0.0, isPopular: false, category: 'Geo' }, // -> $32.82 USD / $599 MXN
  { tld: 'ai', providerCost: 65.00, marginPercent: 1.10, fixedMarkup: 0.0, isPopular: true, category: 'Tech' }, // -> $136.93 USD / $2,499 MXN
  { tld: 'io', providerCost: 34.00, marginPercent: 1.25, fixedMarkup: 0.0, isPopular: true, category: 'Tech' }, // -> $76.65 USD / $1,399 MXN
  { tld: 'dev', providerCost: 12.00, marginPercent: 1.25, fixedMarkup: 0.0, isPopular: false, category: 'Tech' }, // -> $27.00 USD / $499 MXN
  { tld: 'app', providerCost: 14.50, marginPercent: 1.25, fixedMarkup: 0.0, isPopular: false, category: 'Tech' }, // -> $32.60 USD / $599 MXN
  { tld: 'online', providerCost: 1.80, marginPercent: 2.01, fixedMarkup: 0.0, isPromo: true, category: 'Global' }, // -> $5.42 USD / $99 MXN
  { tld: 'cloud', providerCost: 4.50, marginPercent: 1.42, fixedMarkup: 0.0, isPromo: true, category: 'Global' }, // -> $10.90 USD / $199 MXN
  { tld: 'shop', providerCost: 2.90, marginPercent: 1.81, fixedMarkup: 0.0, isPromo: true, category: 'Global' } // -> $8.16 USD / $149 MXN
];

export const INITIAL_SERVICES: UserService[] = [];

export const INITIAL_ORDERS: Order[] = [];

export const INITIAL_TICKETS: SupportTicket[] = [];

export const INITIAL_COMMISSIONS: ResellerCommission[] = [];

export const INITIAL_PAYOUTS: PayoutRequest[] = [];

export const INITIAL_PROVISIONING_JOBS: ProvisioningJob[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
