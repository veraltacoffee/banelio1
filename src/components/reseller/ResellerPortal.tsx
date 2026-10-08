import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { formatMoney } from '../../utils/pricing';
import {
  DollarSign,
  TrendingUp,
  Link,
  Copy,
  Check,
  Send,
  Code2,
  Key,
  Tag,
  Percent
} from 'lucide-react';
import {
  INITIAL_PROVIDER_COSTS,
  calculateGrossMarginPrice,
  applyCommercialRounding,
  convertUsdToLocal,
  BANELIO_SOLUTIONS_CONFIG
} from '../../services/pricingEngine';

export default function ResellerPortal() {
  const {
    commissions,
    requestPayout,
    resellerPromoCode,
    currency,
    affiliateUser,
    language,
    t
  } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('50.00');
  const [payoutMethod, setPayoutMethod] = useState<'PayPal' | 'Bank_Transfer'>(affiliateUser?.payoutMethod || 'PayPal');
  const [payoutDest, setPayoutDest] = useState(affiliateUser?.payoutEmail || '');
  const [payoutSuccessMsg, setPayoutSuccessMsg] = useState('');
  const [payoutErrorMsg, setPayoutErrorMsg] = useState('');
  const [resellerCategory, setResellerCategory] = useState<string>('ALL');

  const referralCode = affiliateUser?.referralCode || resellerPromoCode || '';
  const referralUrl = `https://banelio.com/?ref=${referralCode}`;

  // Partner vs Retail pricing calculated from central engine
  const resellerCatalog = React.useMemo(() => {
    const items: Array<{
      sku: string;
      name: string;
      category: string;
      operation: string;
      retailPriceLocal: number;
      partnerPriceLocal: number;
      savingsLocal: number;
      marginPercent: number;
    }> = [];

    // 1. Products from provider costs
    Object.values(INITIAL_PROVIDER_COSTS).forEach((c) => {
      const partnerUSD = applyCommercialRounding(
        calculateGrossMarginPrice(c.providerCostUSD, 0.35, 0.20),
        'USD'
      );
      const retailUSD = applyCommercialRounding(
        calculateGrossMarginPrice(c.providerCostUSD, 0.55, 0.20),
        'USD',
        partnerUSD
      );

      const partnerLocal = convertUsdToLocal(partnerUSD, currency);
      const retailLocal = convertUsdToLocal(retailUSD, currency, partnerLocal);
      const savingsLocal = Math.max(0, retailLocal - partnerLocal);
      const marginPercent = retailLocal > 0 ? Math.round((savingsLocal / retailLocal) * 100) : 0;

      items.push({
        sku: c.sku,
        name: c.productName,
        category: c.category,
        operation: c.operation,
        retailPriceLocal: retailLocal,
        partnerPriceLocal: partnerLocal,
        savingsLocal,
        marginPercent
      });
    });

    // 2. Solutions
    Object.values(BANELIO_SOLUTIONS_CONFIG).forEach((sol) => {
      const totalExpectedCost = sol.components.reduce(
        (sum, c) => sum + c.expectedCostUSD * c.quantity,
        0
      );
      const partnerUSD = applyCommercialRounding(
        calculateGrossMarginPrice(totalExpectedCost, 0.35, 0.20),
        'USD'
      );
      const retailUSD = applyCommercialRounding(
        calculateGrossMarginPrice(totalExpectedCost, sol.targetMargin, 0.20),
        'USD',
        partnerUSD
      );

      const partnerLocal = convertUsdToLocal(partnerUSD, currency);
      const retailLocal = convertUsdToLocal(retailUSD, currency, partnerLocal);
      const savingsLocal = Math.max(0, retailLocal - partnerLocal);
      const marginPercent = retailLocal > 0 ? Math.round((savingsLocal / retailLocal) * 100) : 0;

      items.push({
        sku: `sol-${sol.code.toLowerCase()}`,
        name: sol.name,
        category: 'SOLUTION',
        operation: 'YEARLY',
        retailPriceLocal: retailLocal,
        partnerPriceLocal: partnerLocal,
        savingsLocal,
        marginPercent
      });
    });

    return items;
  }, [currency]);

  const filteredCatalog = React.useMemo(() => {
    if (resellerCategory === 'ALL') return resellerCatalog;
    return resellerCatalog.filter((item) => item.category === resellerCategory);
  }, [resellerCatalog, resellerCategory]);

  // Calculate totals
  const totalEarnedUSD = commissions.reduce((acc, c) => acc + c.amountUSD, 0);
  const availableBalanceUSD = commissions.filter((c) => c.status === 'AVAILABLE').reduce((acc, c) => acc + c.amountUSD, 0);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRequestPayout = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setPayoutErrorMsg('Monto inválido.');
      return;
    }

    const res = requestPayout(amount, payoutMethod, payoutDest);
    if (!res.success) {
      setPayoutErrorMsg(res.message);
      setPayoutSuccessMsg('');
    } else {
      setPayoutSuccessMsg(res.message);
      setPayoutErrorMsg('');
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#FCFCF8] text-[#070707] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Affiliate Header */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#070707]">{t('res_header_title')}</h1>
            <p className="text-xs text-[#555A52] mt-1">
              {t('res_header_desc')}
            </p>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4">
            <div className="bg-[#F7F8F0] border border-[#8A8F98] p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-[#555A52] block">{t('res_available_bal')}</span>
              <span className="text-2xl font-black text-[#B8F23A]">
                {formatMoney(availableBalanceUSD, currency)}
              </span>
            </div>
            <div className="bg-[#F7F8F0] border border-[#8A8F98] p-4 rounded-2xl text-center">
              <span className="text-[10px] font-bold uppercase text-[#555A52] block">{t('res_total_earned')}</span>
              <span className="text-2xl font-black text-[#070707]">
                {formatMoney(totalEarnedUSD, currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Affiliate Link & Payout Request Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Link Generator & Withdrawal */}
          <div className="lg:col-span-6 space-y-6">
            {/* Referral Link Box */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-[#B8F23A] font-bold text-sm">
                <Link size={18} />
                <h3>{t('res_referral_link')}</h3>
              </div>
              <p className="text-xs text-[#555A52]">
                {t('res_link_desc')}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#070707] outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2.5 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] rounded-xl text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedLink ? t('res_link_copied') : t('res_copy_link')}</span>
                </button>
              </div>
            </div>

            {/* Payout Withdrawal Box */}
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B8F23A] font-bold text-sm">
                  <DollarSign size={18} />
                  <h3>{t('res_request_payout')}</h3>
                </div>
                <span className="text-xs text-[#555A52]">Saldo listo: {formatMoney(availableBalanceUSD, currency)}</span>
              </div>

              {payoutSuccessMsg && (
                <div className="bg-[#B8F23A] border border-[#B8F23A] p-3.5 rounded-2xl text-xs text-[#070707] font-bold">
                  {payoutSuccessMsg}
                </div>
              )}
              {payoutErrorMsg && (
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-2xl text-xs text-rose-700 font-bold">
                  {payoutErrorMsg}
                </div>
              )}

              <form onSubmit={handleRequestPayout} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-[#555A52] block mb-1">{t('res_payout_amount')}</label>
                    <input
                      type="number"
                      step="0.01"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-mono font-bold outline-none focus:border-[#B8F23A]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-[#555A52] block mb-1">{t('res_payout_method')}</label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value as any)}
                      className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-semibold outline-none focus:border-[#B8F23A]"
                    >
                      <option value="PayPal">PayPal</option>
                      <option value="Bank_Transfer">Transferencia Bancaria (IBAN/CLABE/SPEI)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#555A52] block mb-1">
                    {t('res_payout_dest')}
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutDest}
                    onChange={(e) => setPayoutDest(e.target.value)}
                    className="w-full bg-[#FCFCF8] border border-[#8A8F98] rounded-xl px-3 py-2 text-[#070707] font-medium outline-none focus:border-[#B8F23A]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Send size={14} />
                  <span>{t('res_payout_btn')} ({formatMoney(parseFloat(payoutAmount) || 0, currency)})</span>
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Commission Ledger */}
          <div className="lg:col-span-6 space-y-6">
            <div className="bg-[#FFFFFF] rounded-3xl p-6 border border-[#8A8F98] space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#B8F23A] font-bold text-sm">
                  <TrendingUp size={18} />
                  <h3>{t('res_history_title')}</h3>
                </div>
                <span className="text-xs text-[#555A52]">{commissions.length} transacciones</span>
              </div>

              <div className="border border-[#8A8F98] rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                    <tr>
                      <th className="py-3 px-4">Orden / ID</th>
                      <th className="py-3 px-4">Venta Total</th>
                      <th className="py-3 px-4">Comisión</th>
                      <th className="py-3 px-4 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF]">
                    {commissions.map((com) => (
                      <tr key={com.id} className="hover:bg-[#F7F8F0] transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono text-[#070707] font-bold block">{com.orderId}</span>
                          <span className="text-[10px] text-[#555A52]">{new Date(com.date).toLocaleDateString()}</span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#555A52]">
                          {formatMoney(com.orderTotalUSD, currency)}
                        </td>
                        <td className="py-3 px-4 font-bold text-[#B8F23A]">
                          +{formatMoney(com.amountUSD, currency)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              com.status === 'AVAILABLE'
                                ? 'bg-[#B8F23A] text-[#B8F23A] border border-[#B8F23A]'
                                : com.status === 'PAID_OUT'
                                ? 'bg-blue-500/10 text-blue-700 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                            }`}
                          >
                            {com.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* PARTNER & RESELLER COMMERCIAL PRICING TABLE */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8A8F98]">
            <div>
              <div className="flex items-center gap-2 text-[#B8F23A] font-bold text-xs uppercase tracking-wider mb-1">
                <Tag size={16} />
                <span>{language === 'en' ? 'Wholesale Price Book' : 'Tarifario Mayorista'}</span>
              </div>
              <h2 className="text-xl font-black text-[#070707]">
                {language === 'en' ? 'Partner & Reseller Pricing' : 'Tarifas Oficiales para Partners'}
              </h2>
              <p className="text-xs text-[#555A52] mt-0.5">
                {language === 'en'
                  ? 'Guaranteed commercial margins on all core services, domains and BANELIO solutions. Unit prices shown in your selected currency.'
                  : 'Márgenes comerciales garantizados en todos los servicios base, dominios y soluciones BANELIO. Precios unitarios mostrados en tu moneda activa.'}
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F8F0] p-1.5 rounded-2xl border border-[#8A8F98]">
              {[
                { id: 'ALL', label: language === 'en' ? 'All' : 'Todos' },
                { id: 'DOMAIN', label: language === 'en' ? 'Domains' : 'Dominios' },
                { id: 'HOSTING', label: 'Hosting' },
                { id: 'EMAIL', label: language === 'en' ? 'Email' : 'Correo' },
                { id: 'SSL', label: 'SSL' },
                { id: 'SOLUTION', label: language === 'en' ? 'Solutions' : 'Soluciones' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setResellerCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    resellerCategory === cat.id
                      ? 'bg-[#B8F23A] text-[#070707] shadow-xs'
                      : 'text-[#555A52] hover:text-[#070707] hover:bg-[#FFFFFF]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing Table */}
          <div className="border border-[#8A8F98] rounded-2xl overflow-x-auto text-xs">
            <table className="w-full text-left">
              <thead className="bg-[#FCFCF8] text-[#555A52] font-bold border-b border-[#8A8F98]">
                <tr>
                  <th className="py-3 px-4">Producto & SKU</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Operación</th>
                  <th className="py-3 px-4 text-right">PVP Retail Sugerido</th>
                  <th className="py-3 px-4 text-right text-[#B8F23A]">Precio Partner</th>
                  <th className="py-3 px-4 text-right">Margen Comercial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8A8F98] bg-[#FFFFFF]">
                {filteredCatalog.map((item) => (
                  <tr key={item.sku} className="hover:bg-[#F7F8F0] transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-[#070707]">{item.name}</div>
                      <div className="font-mono text-[10px] text-[#555A52]">{item.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F7F8F0] border border-[#8A8F98] text-[#555A52]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-[#555A52]">
                      {item.operation}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-[#555A52]">
                      {formatMoney(item.retailPriceLocal, currency)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-black text-[#070707] bg-[#B8F23A]/60 px-2 py-0.5 rounded-md border border-[#B8F23A]">
                        {formatMoney(item.partnerPriceLocal, currency)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="font-black text-[#070707]">+{item.marginPercent}%</div>
                      <div className="text-[10px] text-[#B8F23A] font-semibold">
                        Ahorro {formatMoney(item.savingsLocal, currency)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-4 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl flex items-center justify-between text-xs text-[#555A52]">
            <div className="flex items-center gap-2">
              <Percent size={16} className="text-[#B8F23A]" />
              <span>
                {language === 'en'
                  ? 'All Partner orders are protected by the central pricing engine. Minimum gross margin floor is strictly enforced.'
                  : 'Todas las órdenes de Partner se rigen por la arquitectura comercial centralizada. El piso mínimo de margen bruto está protegido.'}
              </span>
            </div>
            <span className="font-mono font-bold text-[#B8F23A] text-[11px]">
              {language === 'en' ? 'Partner Tier: Active' : 'Nivel Partner: Activo'}
            </span>
          </div>
        </div>

        {/* INTERACTIVE REST API DOCUMENTATION & SANDBOX */}
        <div className="bg-[#FFFFFF] rounded-3xl p-6 sm:p-8 border border-[#8A8F98] space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#8A8F98]">
            <div>
              <h2 className="text-xl font-bold text-[#070707]">{t('res_api_title')}</h2>
              <p className="text-xs text-[#555A52]">
                {t('res_api_desc')}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-[#F7F8F0] px-4 py-2 rounded-2xl border border-[#8A8F98]">
              <Key size={14} className="text-[#B8F23A]" />
              <span className="text-xs text-[#555A52]">API:</span>
              <span className="text-xs font-bold text-[#070707]">API en desarrollo</span>
            </div>
          </div>

          <div className="p-5 bg-[#F7F8F0] border border-[#8A8F98] rounded-2xl flex items-start gap-3 text-xs text-[#555A52]">
            <Code2 size={18} className="text-[#B8F23A] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-[#070707]">
                {language === 'en' ? 'Public API under development' : 'API pública en desarrollo'}
              </p>
              <p>
                {language === 'en'
                  ? 'Access to the Reseller API (domain availability, provisioning and billing) will be enabled soon for verified partners. No API keys are issued at this time.'
                  : 'El acceso a la API de reseller (disponibilidad de dominios, aprovisionamiento y facturación) se habilitará próximamente para partners verificados. Por el momento no se emiten claves de API.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
