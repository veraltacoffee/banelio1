export type UserRole = 'PUBLIC' | 'CUSTOMER' | 'RESELLER' | 'ADMIN';

export type Currency = 'USD' | 'EUR' | 'MXN' | 'GBP' | 'CAD' | 'COP' | 'ARS' | 'CLP' | 'PEN' | 'BRL';

export type Language = 'es' | 'en';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rate: number;
  name: string;
  flag: string;
}

export type ThemeMode = 'light' | 'dark';
