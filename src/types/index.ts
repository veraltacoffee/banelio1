export type UserRole = 'PUBLIC' | 'CUSTOMER' | 'RESELLER' | 'ADMIN';

export type Currency = 'USD' | 'EUR' | 'MXN' | 'GBP' | 'CAD' | 'COP' | 'ARS' | 'CLP' | 'PEN' | 'BRL';

export type Language = 'es' | 'en';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rate: number; // relative to USD
  name: string;
  flag: string;
}

export type ServiceType = 'DOMAIN' | 'HOSTING' | 'EMAIL' | 'SSL';
export type ServiceStatus = 'ACTIVE' | 'PENDING_PROVISION' | 'SUSPENDED' | 'EXPIRED';

export interface DnsRecord {
  id: string;
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS';
  host: string;
  value: string;
  ttl: number;
  priority?: number;
}

export interface UserService {
  id: string;
  type: ServiceType;
  name: string;
  planName: string;
  status: ServiceStatus;
  providerId: string // Registry Entity ID
  registeredDate: string;
  expiryDate: string;
  autoRenew: boolean;
  whoisPrivacy?: boolean;
  nameservers: string[];
  dnsRecords: DnsRecord[];
  transferLock: boolean;
  eppCode?: string;
  isTransfer?: boolean;
  registrantContact?: DomainRegistrantContact;
  ipAddress?: string;
  diskUsageMb?: number;
  diskLimitMb?: number;
  bandwidthUsageGb?: number;
  bandwidthLimitGb?: number;
  mailboxesCount?: number;
  sslType?: string;
}

export interface TldConfig {
  tld: string; // e.g. "com", "net", "org", "mx", "io", "ai", "online"
  providerCost: number; // in USD
  marginPercent: number; // e.g. 0.35 (35%)
  fixedMarkup: number; // in USD
  isPopular?: boolean;
  isPromo?: boolean;
  category: 'Popular' | 'Tech' | 'Global' | 'Geo';
}

export interface DomainRegistrantContact {
  name: string;
  company?: string;
  email: string;
  phone: string; // Phone number (with country code)
  taxId: string; // Registry Entity ID
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface CartItem {
  id: string;
  type: ServiceType;
  name: string;
  sku: string;
  quantity: number;
  periodYearsOrMonths: number;
  periodUnit: 'year' | 'month';
  basePriceUSD: number;
  addons?: {
  whoisPrivacy: boolean;
    backup: boolean;
    dedicatedIp: boolean;
    isTransfer: boolean;
    eppCode: string;
    registrantContact: DomainRegistrantContact;
  };
}


export interface OrderItem {
  id: string;
  description: string;
  serviceType: ServiceType;
  unitPriceUSD: number;
  quantity: number;
}

export type PaymentMethod = 'STRIPE_CARD' | 'PAYPAL' | 'OXXO_PAY' | 'BALANCE';

export type OrderPaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_FAILED'
  | 'PROVISIONING'
  | 'SUCCESS'
  | 'ERROR';

export type OrderStatus = 'PAID' | 'REFUNDED' | 'FAILED' | 'PENDING_PAYMENT';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  countryCode: string;
  date: string;
  items: OrderItem[];
  subtotalUSD: number;
  discountUSD: number;
  taxUSD: number;
  taxPercent: number;
  totalUSD: number;
  currencyPaid: Currency;
  totalPaidInCurrency: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  gatewayReference?: string;
  invoiceNumber: string;
  referralCodeUsed?: string;
  oxxoDetails?: {
    reference: string;
    barcodeUrl?: string;
    expiresAt: string;
    paidAt?: string;
  };
}

export interface SupportTicket {
  id: string;
  customerId: string;
  customerName: string;
  subject: string;
  category: 'Billing' | 'Technical' | 'Domains' | 'General';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
  messages: {
    id: string;
    sender: 'CUSTOMER' | 'ADMIN' | 'SUPPORT';
    senderName: string;
    message: string;
    timestamp: string;
  }[];
}

export interface ResellerCommission {
  id: string;
  orderId: string;
  customerEmail: string;
  productName: string;
  orderTotalUSD: number;
  commissionRate: number; // e.g. 0.20
  amountUSD: number;
  date: string;
  status: 'PENDING_HOLD' | 'AVAILABLE' | 'PAID_OUT';
  availableDate: string;
}

export interface PayoutRequest {
  id: string;
  resellerId: string;
  resellerName: string;
  amountUSD: number;
  method: 'PayPal' | 'Bank_Transfer' | 'Stripe_Connect';
  destinationDetail: string;
  requestedAt: string;
  processedAt?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  action: string;
  entity: string;
  entityId?: string;
  ipAddress: string;
  details: string;
}

export type ThemeMode = 'light' | 'dark';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Dominios' | 'Hosting' | 'Email' | 'Seguridad & SSL' | 'SEO & Negocios' | 'Domains' | 'Security & SSL' | 'SEO & Business' | string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  publishedAt: string;
  readTime: string;
  coverImage: string;
  tags: string[];
  seoKeywords: string[];
  trendingSearchQuery?: string;
}
