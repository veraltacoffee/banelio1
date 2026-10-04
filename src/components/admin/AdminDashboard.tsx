import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import { TldConfig, PayoutRequest, AuditLogEntry, SupportTicket } from '../../types';
import TicketModal from '../dashboard/TicketModal';
import {
  INITIAL_PROVIDER_COSTS,
  calculateGrossMarginPrice,
  calculateRealizedGrossMargin,
  applyCommercialRounding,
  ProviderCost,
  InternalPricingMetrics
} from '../../services/pricingEngine';
import {
  ShieldCheck,
  DollarSign,
  Server,
  Users,
  Settings,
  RefreshCw,
  Edit2,
  Check,
  X,
  UserCheck,
  Eye,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Activity,
  Search
} from 'lucide-react';

export default function AdminDashboard() {
  const {
    tlds,
    updateTldConfig,
    payouts,
    updatePayoutStatus,
    auditLogs,
    tickets,
    orders,
    services,
    currency,
    startImpersonation,
    addAuditLog,
    addToast,
    t
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<'PRICING' | 'CUSTOMERS' | 'PAYOUTS' | 'AUDIT' | 'TICKETS' | 'API_CONFIG'>('PRICING');
  const [editingTld, setEditingTld] = useState<TldConfig | null>(null);

  // Central Commercial Pricing State
  const [pricingSearch, setPricingSearch] = useState('');
  const [pricingCategoryFilter, setPricingCategoryFilter] = useState<string>('ALL');
  const [adminPricingList, setAdminPricingList] = useState<Array<{
    sku: string;
    productName: string;
    category: string;
    operation: string;
    providerCostUSD: number;
    providerRenewalCostUSD: number | null;
    providerTransferCostUSD: number | null;
    costKnown: boolean;
    internalSource: string;
    partnerMarginPercent: number;
    partnerPriceUSD: number;
    retailMarginPercent: number;
    retailPriceUSD: number;
    protectedFxRate: number;
    currency: string;
    version: string;
    active: boolean;
    updatedAt: string;
  }>>(() => {
    return Object.values(INITIAL_PROVIDER_COSTS).map((c) => {
      const partnerUSD = applyCommercialRounding(calculateGrossMarginPrice(c.providerCostUSD, 0.35, 0.20), 'USD');
      const retailUSD = applyCommercialRounding(calculateGrossMarginPrice(c.providerCostUSD, 0.55, 0.20), 'USD', partnerUSD);
      return {
        sku: c.sku,
        productName: c.productName,
        category: c.category,
        operation: c.operation,
        providerCostUSD: c.providerCostUSD,
        providerRenewalCostUSD: c.providerRenewalCostUSD || null,
        providerTransferCostUSD: c.providerTransferCostUSD || null,
        costKnown: c.providerCostKnown,
        internalSource: c.internalSource,
        partnerMarginPercent: 35,
        partnerPriceUSD: partnerUSD,
        retailMarginPercent: 55,
        retailPriceUSD: retailUSD,
        protectedFxRate: 0,
        currency: 'USD',
        version: 'v1.0',
        active: c.active,
        updatedAt: c.updatedAt
      };
    });
  });

  const [internalMetrics, setInternalMetrics] = useState<InternalPricingMetrics>({
    totalSolutionsSold: 0,
    totalEntitlementsGranted: 0,
    totalEntitlementsActivated: 0,
    activationRate: 0,
    totalExpectedProviderCostUSD: 0,
    totalActualProviderCostUSD: 0,
    costSavingsFromUnactivatedUSD: 0,
    averageBundleGrossMargin: 0.51
  });

  const [editingPricingItem, setEditingPricingItem] = useState<any>(null);
  const [editItemCost, setEditItemCost] = useState(0);
  const [editItemRenewalCost, setEditItemRenewalCost] = useState<number | ''>('');
  const [editItemTransferCost, setEditItemTransferCost] = useState<number | ''>('');
  const [editItemPartnerMargin, setEditItemPartnerMargin] = useState(35);
  const [editItemRetailMargin, setEditItemRetailMargin] = useState(55);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');

  // API Tester State
  const [apiStatus, setApiStatus] = useState<any>(null);
  const [isTestingApi, setIsTestingApi] = useState(false);

  const checkApiStatus = async () => {
    setIsTestingApi(true);
    try {
      const res = await fetch('/api/registry/status');
      const data = await res.json();
      setApiStatus(data);
    } catch (err: any) {
      setApiStatus({ error: err.message });
    } finally {
      setIsTestingApi(false);
    }
  };

  // TLD Edit Form State
  const [editCost, setEditCost] = useState(0);
  const [editMargin, setEditMargin] = useState(0.35);
  const [editMarkup, setEditMarkup] = useState(2.0);
  const [editPromo, setEditPromo] = useState(false);

  const startEditTld = (tld: TldConfig) => {
    setEditingTld(tld);
    setEditCost(tld.providerCost);
    setEditMargin(tld.marginPercent);
    setEditMarkup(tld.fixedMarkup);
    setEditPromo(!!tld.isPromo);
  };

  const saveTldEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTld) return;

    updateTldConfig(editingTld.tld, {
      providerCost: Number(editCost),
      marginPercent: Number(editMargin),
      fixedMarkup: Number(editMarkup),
      isPromo: editPromo
    });

    setEditingTld(null);
  };

  React.useEffect(() => {
    fetch('/api/admin/pricing')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && Array.isArray(data.items) && data.items.length > 0) {
          setAdminPricingList(data.items);
        }
      })
      .catch(() => {});

    fetch('/api/admin/metrics')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success && data.metrics) {
          setInternalMetrics(data.metrics);
        }
      })
      .catch(() => {});
  }, []);

  const startEditPricingItem = (item: any) => {
    setEditingPricingItem(item);
    setEditItemCost(item.providerCostUSD);
    setEditItemRenewalCost(item.providerRenewalCostUSD ?? '');
    setEditItemTransferCost(item.providerTransferCostUSD ?? '');
    setEditItemPartnerMargin(item.partnerMarginPercent ?? 35);
    setEditItemRetailMargin(item.retailMarginPercent ?? 55);
  };

  const savePricingEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPricingItem) return;

    const partnerMarginDec = Number(editItemPartnerMargin) / 100;
    const retailMarginDec = Number(editItemRetailMargin) / 100;
    const costUSD = Number(editItemCost);
    const renewalUSD = editItemRenewalCost === '' ? undefined : Number(editItemRenewalCost);
  const transferUSD = editItemTransferCost === '' ? undefined : Number(editItemTransferCost);

    try {
      await fetch('/api/admin/pricing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: editingPricingItem.sku,
          providerCostUSD: costUSD,
          providerRenewalCostUSD: renewalUSD,
              providerTransferCostUSD: transferUSD,
          partnerMargin: partnerMarginDec,
          retailMargin: retailMarginDec
        })
      });
    } catch {}

    const partnerUSD = applyCommercialRounding(calculateGrossMarginPrice(costUSD, partnerMarginDec, 0.20), 'USD');
    const retailUSD = applyCommercialRounding(calculateGrossMarginPrice(costUSD, retailMarginDec, 0.20), 'USD', partnerUSD);

    setAdminPricingList((prev) =>
      prev.map((item) =>
        item.sku === editingPricingItem.sku
          ? {
              ...item,
              providerCostUSD: costUSD,
              providerRenewalCostUSD: renewalUSD !== undefined ? renewalUSD : item.providerRenewalCostUSD,
          providerTransferCostUSD: transferUSD !== undefined ? transferUSD : item.providerTransferCostUSD,
              partnerMarginPercent: Number(editItemPartnerMargin),
              partnerPriceUSD: partnerUSD,
              retailMarginPercent: Number(editItemRetailMargin),
              retailPriceUSD: retailUSD,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );

    addAuditLog('UPDATE_PRICING', 'PRICING_ENGINE', `Ajustó precios y márgenes de ${editingPricingItem.sku}`, editingPricingItem.sku);
    addToast({
      type: 'success',
      title: 'Motor de Precios Actualizado',
      message: `${editingPricingItem.sku}: Partner $${partnerUSD} USD | Retail $${retailUSD} USD`
    });
    setEditingPricingItem(null);
  };

  // Real customers derived exclusively from actual orders (never fabricated)
  const customersFromOrders = orders.reduce<Record<string, {
    id: string;
    name: string;
    email: string;
    company: string;
    countryCode: string;
    totalSpentUSD: number;
    servicesCount: number;
  }>>((map, o) => {
    const key = String(o.customerEmail || o.customerId || '').toLowerCase() || 'sin-email';
    if (!map[key]) {
      map[key] = {
        id: o.customerId || key,
        name: o.customerName || o.customerEmail || '—',
        email: o.customerEmail || '',
        company: '',
        countryCode: o.countryCode || '—',
        totalSpentUSD: 0,
        servicesCount: 0
      };
    }
    map[key].totalSpentUSD += o.totalUSD || 0;
    map[key].servicesCount += o.items ? o.items.length : 0;
    return map;
  }, {});

  const realCustomers = Object.values(customersFromOrders) as Array<{
    id: string;
    name: string;
    email: string;
    company: string;
    countryCode: string;
    totalSpentUSD: number;
    servicesCount: number;
  }>;

  const filteredCustomers = realCustomers.filter((c) => {
    const q = customerSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q)
    );
  });

  const thirtyDayRevenue = orders
    .filter((o) => new Date(o.date).getTime() >= Date.now() - 30 * 24 * 3600 * 1000)
    .reduce((acc, o) => acc + (o.totalUSD || 0), 0);

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] text-[#070707] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Admin Header */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#B8F23A] text-[#070707] flex items-center justify-center shadow-xs font-black">
              <ShieldCheck size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#070707]">{t('adm_title')}</h1>
                <span className="bg-[#B8F23A] text-[#070707] text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#B8F23A]">
                  Root Master
                </span>
              </div>
              <p className="text-xs text-[#555A52] mt-1">
                {t('adm_subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* FINANCIAL & OPERATIONS KPI CARDS */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#8A8F98] shadow-xs">
            <div className="flex items-center justify-between text-[#555A52] text-xs font-semibold mb-2">
              <span>Ingresos Brutos (30d)</span>
              <DollarSign size={16} className="text-[#B8F23A]" />
            </div>
            <span className="text-2xl font-black text-[#070707] block">
              {formatMoney(thirtyDayRevenue, currency)}
            </span>
            <span className="text-[11px] text-[#555A52] font-medium mt-1 block">Facturado en los últimos 30 días</span>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#8A8F98] shadow-xs">
            <div className="flex items-center justify-between text-[#555A52] text-xs font-semibold mb-2">
              <span>Órdenes Registradas</span>
              <FileText size={16} className="text-[#555A52]" />
            </div>
            <span className="text-2xl font-black text-[#070707] block">
              {orders.length}
            </span>
            <span className="text-[11px] text-[#555A52] font-medium mt-1 block">Total de órdenes en el sistema</span>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#8A8F98] shadow-xs">
            <div className="flex items-center justify-between text-[#555A52] text-xs font-semibold mb-2">
              <span>Clientes Registrados</span>
              <Users size={16} className="text-[#B8F23A]" />
            </div>
            <span className="text-2xl font-black text-[#B8F23A] block">
              {realCustomers.length}
            </span>
            <span className="text-[11px] text-[#555A52] font-medium mt-1 block">Cuentas únicas con órdenes</span>
          </div>

          <div className="bg-[#FFFFFF] rounded-2xl p-5 border border-[#8A8F98] shadow-xs">
            <div className="flex items-center justify-between text-[#555A52] text-xs font-semibold mb-2">
              <span>Servicios Activos Totales</span>
              <Server size={16} className="text-[#B8F23A]" />
            </div>
            <span className="text-2xl font-black text-[#070707] block">{services.length}</span>
            <span className="text-[11px] text-[#555A52] font-medium mt-1 block">Dominios + NVMe Hostings</span>
          </div>
        </div>

        {/* ADMIN NAV TABS */}
        <div className="flex flex-wrap gap-2 border-b border-[#8A8F98] pb-2">
          <button
            onClick={() => setActiveAdminTab('PRICING')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'PRICING'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <DollarSign size={15} />
            <span>{t('adm_tab_pricing')} ({tlds.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('CUSTOMERS')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'CUSTOMERS'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <Users size={15} />
            <span>{t('adm_tab_customers')} ({filteredCustomers.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('PAYOUTS')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'PAYOUTS'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <DollarSign size={15} />
            <span>{t('adm_tab_payouts')} ({payouts.filter((p) => p.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('TICKETS')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'TICKETS'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <Activity size={15} />
            <span>{t('adm_tab_tickets')} ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('AUDIT')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'AUDIT'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <ShieldCheck size={15} />
            <span>{t('adm_tab_audit')} ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveAdminTab('API_CONFIG');
              if (!apiStatus) checkApiStatus();
            }}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminTab === 'API_CONFIG'
                ? 'bg-[#B8F23A] text-[#070707] font-black shadow-xs'
                : 'bg-[#FFFFFF] text-[#555A52] hover:text-[#070707] border border-[#8A8F98]'
            }`}
          >
            <Server size={15} />
            <span>{t('adm_tab_api')}</span>
          </button>
        </div>

        {/* TAB 1: CENTRAL COMMERCIAL PRICING & MARGIN ENGINE */}
        {activeAdminTab === 'PRICING' && (
          <div className="space-y-6">
            {/* Top Banner: Formula & Rules */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-black text-lg text-[#070707]">Motor Comercial de Precios BANELIO</h3>
                  <p className="text-xs text-[#555A52] mt-1">
                    Fórmula de Margen Bruto: <code className="text-[#B8F23A] font-mono font-bold bg-[#F7F8F0] px-2 py-0.5 rounded">Precio = Costo / (1 - Margen)</code>
                    <span className="ml-2 text-[#777D73]">| Margen mínimo protegido: 20% | Sin markups lineales</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-[#B8F23A] text-[#070707] font-bold px-3 py-1.5 rounded-xl border border-[#B8F23A]">
                    Autoridad Centralizada de Precios
                  </span>
                </div>
              </div>

              {/* Internal Architecture Metrics Strip */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-[#8A8F98]">
                <div className="p-3.5 bg-[#F9FAF5] rounded-2xl border border-[#8A8F98]">
                  <span className="text-[10px] font-bold uppercase text-[#555A52] block">Soluciones & Bundles</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-[#070707]">{internalMetrics.totalSolutionsSold}</span>
                    <span className="text-[10px] text-[#B8F23A] font-bold">{(internalMetrics.averageBundleGrossMargin * 100).toFixed(0)}% Margen Objetivo</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F9FAF5] rounded-2xl border border-[#8A8F98]">
                  <span className="text-[10px] font-bold uppercase text-[#555A52] block">Entitlements (Derechos)</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-[#070707]">{internalMetrics.totalEntitlementsActivated} / {internalMetrics.totalEntitlementsGranted}</span>
                    <span className="text-[10px] text-[#555A52]">Activados / Otorgados</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F9FAF5] rounded-2xl border border-[#8A8F98]">
                  <span className="text-[10px] font-bold uppercase text-[#555A52] block">Tasa de Activación</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-[#B8F23A]">{(internalMetrics.activationRate * 100).toFixed(0)}%</span>
                    <span className="text-[10px] text-[#555A52]">Consumo de Derechos</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#F9FAF5] rounded-2xl border border-[#8A8F98]">
                  <span className="text-[10px] font-bold uppercase text-[#555A52] block">Ahorro Costo Proveedor</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-xl font-black text-[#B8F23A]">${internalMetrics.costSavingsFromUnactivatedUSD.toFixed(2)} USD</span>
                    <span className="text-[10px] text-[#555A52]">Diferido</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-[#FFFFFF] rounded-2xl p-4 border border-[#8A8F98] flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs">
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {['ALL', 'DOMAIN', 'HOSTING', 'EMAIL', 'SSL', 'BACKUP', 'ADDON'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setPricingCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                      pricingCategoryFilter === cat
                        ? 'bg-[#B8F23A] text-[#070707]'
                        : 'bg-[#F7F8F0] text-[#555A52] hover:text-[#070707]'
                    }`}
                  >
                    {cat === 'ALL' ? 'Todos' : cat}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar por SKU o producto..."
                  value={pricingSearch}
                  onChange={(e) => setPricingSearch(e.target.value)}
                  className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-1.5 text-xs text-[#070707] outline-none"
                />
              </div>
            </div>

            {/* Main Pricing Table */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-3">SKU / Producto</th>
                      <th className="py-3 px-3">Operación</th>
                      <th className="py-3 px-3">
                        <span className="bg-[#EFEFEF] text-[#333] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          Costo Proveedor
                        </span>
                      </th>
                      <th className="py-3 px-3">FX Protegido</th>
                      <th className="py-3 px-3">
                        <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          Partner (35%)
                        </span>
                      </th>
                      <th className="py-3 px-3">
                        <span className="bg-[#B8F23A] text-[#070707] px-2 py-0.5 rounded text-[10px] font-black uppercase">
                          Retail (55%)
                        </span>
                      </th>
                      <th className="py-3 px-3">Versión</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF] font-mono">
                    {adminPricingList
                      .filter((item) => {
                        const matchesCat = pricingCategoryFilter === 'ALL' || item.category === pricingCategoryFilter;
                        const q = pricingSearch.toLowerCase();
                        const matchesSearch = !q || item.sku.toLowerCase().includes(q) || item.productName.toLowerCase().includes(q);
                        return matchesCat && matchesSearch;
                      })
                      .map((item) => {
                        return (
                          <tr key={item.sku} className="hover:bg-[#F7F8F0] transition-colors">
                            <td className="py-3 px-3 font-sans">
                              <span className="font-bold text-[#070707] block font-mono text-xs">{item.sku}</span>
                              <span className="text-[11px] text-[#555A52]">{item.productName}</span>
                            </td>
                            <td className="py-3 px-3 font-sans text-[11px] text-[#555A52]">
                              {item.operation}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-bold text-[#070707]">
                                ${item.providerCostUSD.toFixed(2)} USD
                              </div>
                              {item.providerRenewalCostUSD && (
                                <span className="text-[10px] text-[#777D73] font-sans block">
                                  Renovación: ${item.providerRenewalCostUSD.toFixed(2)}
                                </span>
                              )}
                              {!item.costKnown && (
                                <span className="text-[9px] bg-amber-100 text-amber-800 font-sans px-1 rounded">
                                  Pendiente
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-[#555A52] font-sans text-xs">
                              {item.protectedFxRate} MXN
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-bold text-blue-700 block">
                                ${item.partnerPriceUSD.toFixed(2)} USD
                              </span>
                              <span className="text-[10px] text-[#555A52] font-sans">
                                {item.partnerMarginPercent}% margen
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="font-black text-[#B8F23A] block">
                                ${item.retailPriceUSD.toFixed(2)} USD
                              </span>
                              <span className="text-[10px] text-[#555A52] font-sans">
                                {item.retailMarginPercent}% margen
                              </span>
                            </td>
                            <td className="py-3 px-3 font-sans text-xs">
                              <span className="text-[#555A52] block">{item.version}</span>
                              <span className="text-[10px] text-[#B8F23A] font-bold">Activo</span>
                            </td>
                            <td className="py-3 px-3 text-right font-sans">
                              <button
                                onClick={() => startEditPricingItem(item)}
                                className="px-3 py-1 bg-[#F7F8F0] hover:bg-[#B8F23A] text-[#070707] border border-[#8A8F98] rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Ajustar
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* EDIT PRICING MODAL */}
            {editingPricingItem && (
              <div className="fixed inset-0 z-50 bg-[#070707]/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-[#FFFFFF] rounded-3xl max-w-lg w-full p-6 border border-[#8A8F98] shadow-2xl text-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#8A8F98]">
                    <div>
                      <h3 className="font-black text-sm text-[#070707]">
                        Ajuste de Precios: {editingPricingItem.sku}
                      </h3>
                      <p className="text-[11px] text-[#555A52] mt-0.5">{editingPricingItem.productName}</p>
                    </div>
                    <button
                      onClick={() => setEditingPricingItem(null)}
                      className="text-[#555A52] hover:text-[#070707] cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <form onSubmit={savePricingEdit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#555A52] block mb-1">Costo Proveedor Base ($ USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={editItemCost}
                          onChange={(e) => setEditItemCost(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono font-bold outline-none focus:border-[#B8F23A]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#555A52] block mb-1">Costo Renovación ($ USD)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editItemRenewalCost}
                          onChange={(e) =>
                            setEditItemRenewalCost(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)
                          }
                          placeholder="Opcional"
                          className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono outline-none focus:border-[#B8F23A]"
                        />
                      </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Costo de transferencia (USD)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={editItemTransferCost}
              onChange={(e) => setEditItemTransferCost(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full rounded-md border px-3 py-2"
              placeholder="Ej. 8.00"
            />
          </div>

                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-[#555A52] block mb-1">Margen Partner % (Target 35%)</label>
                        <input
                          type="number"
                          min="20"
                          max="90"
                          value={editItemPartnerMargin}
                          onChange={(e) => setEditItemPartnerMargin(parseInt(e.target.value) || 35)}
                          className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono font-bold outline-none focus:border-[#B8F23A]"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-[#555A52] block mb-1">Margen Retail % (Target 55%)</label>
                        <input
                          type="number"
                          min="20"
                          max="90"
                          value={editItemRetailMargin}
                          onChange={(e) => setEditItemRetailMargin(parseInt(e.target.value) || 55)}
                          className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono font-bold outline-none focus:border-[#B8F23A]"
                        />
                      </div>
                    </div>

                    {/* Live Preview Box using Gross Margin Formula */}
                    <div className="bg-[#F7F8F0] p-3.5 rounded-2xl border border-[#8A8F98] space-y-2">
                      <div className="text-[11px] font-bold text-[#B8F23A] uppercase tracking-wider">
                        Cálculo Automático por Margen Bruto:
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-white p-2.5 rounded-xl border border-[#8A8F98]">
                          <span className="text-[10px] text-[#555A52] block">Precio Partner:</span>
                          <span className="font-black text-blue-700 text-sm">
                            ${applyCommercialRounding(calculateGrossMarginPrice(Number(editItemCost), Number(editItemPartnerMargin) / 100, 0.20), 'USD').toFixed(2)} USD
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-xl border border-[#8A8F98]">
                          <span className="text-[10px] text-[#555A52] block">Precio Retail:</span>
                          <span className="font-black text-[#B8F23A] text-sm">
                            ${applyCommercialRounding(calculateGrossMarginPrice(Number(editItemCost), Number(editItemRetailMargin) / 100, 0.20), 'USD').toFixed(2)} USD
                          </span>
                        </div>
                      </div>
                      <p className="text-[10px] text-[#777D73] leading-tight pt-1">
                        Piso mínimo protegido: ${(Number(editItemCost) / 0.80).toFixed(2)} USD (20% margen mínimo).
                      </p>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingPricingItem(null)}
                        className="px-4 py-2 bg-[#F7F8F0] text-[#555A52] hover:text-[#070707] border border-[#8A8F98] rounded-xl font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black cursor-pointer transition-all shadow-xs"
                      >
                        Guardar Precios y Crear Versión
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PROVISIONING QUEUE */}
        {/* TAB 3: CUSTOMERS & IMPERSONATION */}
        {activeAdminTab === 'CUSTOMERS' && (
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-lg text-[#070707]">Directorio de Clientes & Impersonación</h3>
                  <p className="text-xs text-[#555A52]">
                    Inspecciona cuentas de usuario y asume su identidad para soporte técnico inmediato.
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-2.5 text-[#555A52]" size={15} />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Buscar por nombre o email..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl text-xs text-[#070707] outline-none focus:border-[#B8F23A]"
                  />
                </div>
              </div>

              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Empresa / Razón</th>
                      <th className="py-3 px-4">País</th>
                      <th className="py-3 px-4">Total Gastado</th>
                      <th className="py-3 px-4">Servicios</th>
                      <th className="py-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF]">
                    {filteredCustomers.map((cust) => (
                      <tr key={cust.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-bold text-[#070707] block">{cust.name}</span>
                          <span className="text-[11px] text-[#555A52] font-mono">{cust.email}</span>
                        </td>
                        <td className="py-3 px-4 text-[#555A52]">{cust.company || 'Particular'}</td>
                        <td className="py-3 px-4 text-[#555A52] font-semibold">{cust.countryCode}</td>
                        <td className="py-3 px-4 font-bold text-[#B8F23A]">
                          {formatMoney(cust.totalSpentUSD, currency)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-[#B8F23A] text-[#070707] border border-[#B8F23A] font-bold px-2 py-0.5 rounded text-[11px]">
                            {cust.servicesCount} activos
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => startImpersonation(cust.name)}
                            className="px-3.5 py-1.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                          >
                            <UserCheck size={13} />
                            <span>Impersonar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                  <div className="bg-[#FFFFFF] p-10 text-center border-t border-[#8A8F98]">
                    <Users size={32} className="text-[#858A82]/40 mx-auto mb-3" />
                    <p className="text-sm font-bold text-[#070707]">{t('adm_no_customers')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYOUTS */}
        {activeAdminTab === 'PAYOUTS' && (
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <h3 className="font-black text-lg text-[#070707]">Aprobación de Retiros de Afiliados</h3>

              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">ID / Fecha</th>
                      <th className="py-3 px-4">Partner Reseller</th>
                      <th className="py-3 px-4">Monto Solicitado</th>
                      <th className="py-3 px-4">Método & Destino</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Decisión</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF]">
                    {payouts.map((req) => (
                      <tr key={req.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[#B8F23A] font-bold block">#{req.id}</span>
                          <span className="text-[10px] text-[#555A52]">{new Date(req.requestedAt).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#070707]">{req.resellerName}</td>
                        <td className="py-3 px-4 font-bold text-[#B8F23A]">
                          {formatMoney(req.amountUSD, currency)}
                        </td>
                        <td className="py-3 px-4 text-[#555A52]">
                          <span className="font-bold text-[#070707] block">{req.method}</span>
                          <span className="text-[11px] font-mono text-[#555A52]">{req.destinationDetail}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              req.status === 'APPROVED'
                                ? 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                                : req.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {req.status === 'PENDING' ? (
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => updatePayoutStatus(req.id, 'APPROVED')}
                                className="px-3 py-1 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-lg font-black text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                              >
                                <Check size={12} />
                                <span>Aprobar</span>
                              </button>
                              <button
                                onClick={() => updatePayoutStatus(req.id, 'REJECTED')}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <X size={12} />
                                <span>Rechazar</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#555A52] text-[11px]">Procesado</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payouts.length === 0 && (
                  <div className="bg-[#FFFFFF] p-8 text-center">
                    <DollarSign size={28} className="text-[#858A82]/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#070707]">{t('adm_no_transfers')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: TICKETS */}
        {activeAdminTab === 'TICKETS' && (
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <h3 className="font-black text-lg text-[#070707]">Tickets de Soporte de Todos los Usuarios</h3>

              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">ID</th>
                      <th className="py-3 px-4">Cliente</th>
                      <th className="py-3 px-4">Asunto</th>
                      <th className="py-3 px-4">Prioridad</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4 text-right">Atender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF]">
                    {tickets.map((tk) => (
                      <tr key={tk.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#555A52]">#{tk.id}</td>
                        <td className="py-3 px-4 font-semibold text-[#070707]">{tk.customerName}</td>
                        <td className="py-3 px-4 text-[#555A52]">{tk.subject}</td>
                        <td className="py-3 px-4">
                          <span className={`font-bold ${tk.priority === 'High' ? 'text-rose-600' : 'text-[#555A52]'}`}>
                            {tk.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              tk.status === 'OPEN'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : tk.status === 'WAITING_CUSTOMER'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                            }`}
                          >
                            {tk.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setSelectedTicket(tk)}
                            className="px-3 py-1 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-lg font-black text-[11px] cursor-pointer transition-all shadow-xs"
                          >
                            Responder ({tk.messages.length})
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {tickets.length === 0 && (
                  <div className="bg-[#FFFFFF] p-8 text-center">
                    <Activity size={28} className="text-[#858A82]/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#070707]">{t('client_no_tickets')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUDIT */}
        {activeAdminTab === 'AUDIT' && (
          <div className="space-y-4">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <h3 className="font-black text-lg text-[#070707]">Registro de Auditoría y Seguridad del Sistema</h3>

              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">Actor / Usuario</th>
                      <th className="py-3 px-4">Acción Ejecutada</th>
                      <th className="py-3 px-4">Dirección IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] font-mono bg-[#FFFFFF]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4 text-[#555A52]">{new Date(log.timestamp).toLocaleString()}</td>
                        <td className="py-3 px-4 font-sans font-semibold text-[#070707]">{log.actor}</td>
                        <td className="py-3 px-4 text-[#B8F23A] font-bold">{log.action}</td>
                        <td className="py-3 px-4 text-[#555A52]">{log.ipAddress}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {auditLogs.length === 0 && (
                  <div className="bg-[#FFFFFF] p-8 text-center">
                    <ShieldCheck size={28} className="text-[#858A82]/40 mx-auto mb-2" />
                    <p className="text-sm font-bold text-[#070707]">{t('adm_no_orders')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: BANELIO REGISTRY BACKEND PROXY & LIVE TESTER */}
        {activeAdminTab === 'API_CONFIG' && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-black text-xl text-[#070707]">Estado del Registry Backend (Banelio Registry)</h3>
                  <p className="text-xs text-[#555A52] mt-1">
                    Capa de Abstracción Server-Side: Tus claves de API y credenciales nunca viajan al navegador del cliente.
                  </p>
                </div>
                <button
                  onClick={checkApiStatus}
                  disabled={isTestingApi}
                  className="flex items-center gap-2 px-4 py-2 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs"
                >
                  <RefreshCw size={14} className={isTestingApi ? 'animate-spin' : ''} />
                  <span>Probar Conexión Backend</span>
                </button>
              </div>

              {/* Status Indicator */}
              {apiStatus && (
                <div className="mt-4 p-4 rounded-2xl border border-[#8A8F98] bg-[#FCFCF8] text-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        apiStatus.configured ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    ></span>
                    <span className="font-bold text-[#070707]">
                      {apiStatus.configured
                        ? 'Servicio de Registry Conectado y Operativo'
                        : 'Variables de Entorno Pendientes en el Servidor (.env)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#8A8F98]">
                      <span className="text-[#555A52] text-[11px] block">Ambiente Activo</span>
                      <span className="font-mono font-bold text-[#070707]">{apiStatus.environment || 'production'}</span>
                    </div>
                    <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#8A8F98]">
                      <span className="text-[#555A52] text-[11px] block">Estado de Conexión</span>
                      <span className="font-mono font-bold text-[#070707]">{apiStatus.status || 'OPERATIONAL'}</span>
                    </div>
                    <div className="bg-[#FFFFFF] p-3 rounded-xl border border-[#8A8F98]">
                      <span className="text-[#555A52] text-[11px] block">Seguridad Frontend</span>
                      <span className="font-bold text-emerald-700 font-mono">100% Protegido (Server-Only)</span>
                    </div>
                  </div>

                  {apiStatus.message && (
                    <p className="text-emerald-900 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      ℹ️ {apiStatus.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Step-by-Step Production Checklist */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-3 shadow-xs">
              <h4 className="font-black text-lg text-[#070707]">Guía Rápida para Producción</h4>
              <ol className="list-decimal list-inside text-xs text-[#555A52] space-y-2 leading-relaxed">
                <li>
                  <strong className="text-[#070707]">Backend de Disponibilidad:</strong> Las búsquedas consultan directamente el endpoint <code className="bg-[#F7F8F0] px-1.5 py-0.5 rounded text-[#070707]">/api/domains/check.php</code> de Banelio.
                </li>
                <li>
                  <strong className="text-[#070707]">Backend de Transferencia:</strong> Las solicitudes de transferencia se procesan mediante <code className="bg-[#F7F8F0] px-1.5 py-0.5 rounded text-[#070707]">/api/domains/transfer.php</code> mediante HTTPS seguro.
                </li>
                <li>
                  <strong className="text-[#070707]">Seguridad de Claves:</strong> Todas las credenciales y llaves permanecen en el servidor backend sin ser expuestas al navegador.
                </li>
                <li>
                  <strong className="text-[#070707]">Probar desde esta consola:</strong> Haz clic en el botón superior <span className="text-[#B8F23A] font-bold">Probar Conexión Backend</span> para verificar el ping en vivo.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Response Modal */}
      <TicketModal
        ticket={selectedTicket}
        isOpen={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        isAdmin={true}
      />
    </div>
  );
}
