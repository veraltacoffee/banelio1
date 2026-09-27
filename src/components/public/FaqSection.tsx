import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search, Globe, Server, Mail, ShieldCheck, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FAQ_DATA } from '../../utils/translations';

// Official WhatsApp Vector Icon
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      stroke="currentColor"
      strokeWidth="0"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const getCategoryIcon = (category: string) => {
  const c = category.toLowerCase();
  if (c.includes('domin') || c.includes('domain')) return Globe;
  if (c.includes('host') || c.includes('serv')) return Server;
  if (c.includes('mail') || c.includes('correo')) return Mail;
  return ShieldCheck;
};

export const FaqSection: React.FC<{ onNavigateToBlog?: () => void }> = ({ onNavigateToBlog }) => {
  const { language, t } = useApp();
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');

  const faqs = FAQ_DATA[language === 'en' ? 'en' : 'es'] || FAQ_DATA.es;

  const categories = language === 'en'
    ? ['ALL', 'Domains', 'Hosting', 'Email', 'Security']
    : ['TODOS', 'Dominios', 'Hosting', 'Email', 'Seguridad'];

  const filteredFaqs = faqs.filter((faq) => {
    const matchesSearch =
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.popularSearchQuery.toLowerCase().includes(searchTerm.toLowerCase());

    const isAll = activeCategory === 'TODOS' || activeCategory === 'ALL';
    const matchesCat =
      isAll ||
      faq.category.toLowerCase() === activeCategory.toLowerCase() ||
      (activeCategory === 'Security' && faq.category === 'Security') ||
      (activeCategory === 'Seguridad' && faq.category === 'Seguridad');

    return matchesSearch && matchesCat;
  });

  return (
    <section id="faq" className="relative py-20 bg-[#F4F6EC] border-t border-[#8A8F98] overflow-hidden">
      {/* Oversized Banelio Favicon Watermark (Bottom-Right overflowing) */}
      <div className="absolute -bottom-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] -rotate-15 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header - Clean headline without small eyebrow */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#070707] tracking-tight leading-tight">
            {t('faq_title')}{' '}
            <span className="text-[#B8F23A]">
              {t('faq_title_gradient')}
            </span>
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#555A52]">
            {t('faq_desc')}
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="mb-10 space-y-4">
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#858A82]" />
            <input
              id="faq-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('faq_search_placeholder')}
              className="w-full pl-12 pr-4 py-3 bg-white border border-[#8A8F98] rounded-2xl text-[#070707] placeholder-[#858A82] focus:outline-none focus:ring-2 focus:ring-[#B8F23A] focus:border-transparent transition-all shadow-xs text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-wrap justify-center items-center gap-2 pt-2">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat || (cat === 'ALL' && activeCategory === 'TODOS') || (cat === 'TODOS' && activeCategory === 'ALL');
              return (
                <button
                  key={cat}
                  id={`faq-cat-btn-${cat.toLowerCase()}`}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#B8F23A] text-[#070707] shadow-xs scale-105'
                      : 'bg-[#F7F8F0] text-[#555A52] hover:bg-[#8A8F98]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Accordion FAQ List */}
        <div className="space-y-3.5">
          {filteredFaqs.map((faq, index) => {
            const isOpen = openIndex === index;
            const Icon = getCategoryIcon(faq.category);

            return (
              <div
                key={faq.id}
                id={`faq-item-${faq.id}`}
                className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                  isOpen
                    ? 'bg-[#FDFDFD] border-[#B8F23A] shadow-md ring-1 ring-[#B8F23A]/30'
                    : 'bg-[#FDFDFD] border-[#8A8F98] hover:border-[#B8F23A]/50'
                }`}
              >
                <button
                  id={`faq-toggle-${faq.id}`}
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full flex items-start justify-between gap-4 p-5 sm:p-6 text-left cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 p-2 rounded-xl flex-shrink-0 transition-colors ${
                      isOpen ? 'bg-[#B8F23A] text-[#070707]' : 'bg-[#F7F8F0] text-[#B8F23A]'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F8F0] text-[#B8F23A]">
                          {faq.category}
                        </span>
                        <span className="text-[11px] text-[#858A82] italic">
                          {t('faq_google_trend')} "{faq.popularSearchQuery}"
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-[#070707] leading-snug">
                        {faq.question}
                      </h3>
                    </div>
                  </div>
                  <div className={`p-1.5 rounded-lg transition-transform duration-200 flex-shrink-0 ${
                    isOpen ? 'rotate-180 bg-[#B8F23A]/20 text-[#B8F23A]' : 'text-[#858A82]'
                  }`}>
                    <ChevronDown className="w-5 h-5" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-2 text-sm sm:text-base text-[#555A52] leading-relaxed border-t border-[#8A8F98]/60 mt-1">
                    <p className="mt-3">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 bg-[#F7F8F0] rounded-2xl border border-dashed border-[#8A8F98]">
              <HelpCircle className="w-10 h-10 text-[#858A82] mx-auto mb-3" />
              <p className="text-[#070707] font-medium">{t('faq_empty_title')} "{searchTerm}"</p>
              <p className="text-xs text-[#858A82] mt-1">{t('faq_empty_desc')}</p>
            </div>
          )}
        </div>

        {/* Technical Support Block */}
        <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-[#070707] text-white border border-[#242424] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <h4 className="text-lg sm:text-xl font-bold text-white">
              {t('faq_doubt_title')}
            </h4>
            <p className="text-xs sm:text-sm text-[#A0A69D] max-w-lg">
              {t('faq_doubt_desc')}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 flex-shrink-0">
            {onNavigateToBlog && (
              <button
                id="faq-goto-blog-btn"
                onClick={onNavigateToBlog}
                className="px-5 py-2.5 rounded-xl bg-[#111111] hover:bg-[#242424] text-white text-xs sm:text-sm font-semibold transition-all border border-[#242424] flex items-center gap-1.5 cursor-pointer"
              >
                <span>{t('faq_blog_btn')}</span>
                <ArrowRight className="w-4 h-4 text-[#B8F23A]" />
              </button>
            )}
            <a
              id="faq-whatsapp-link"
              href={`https://wa.me/526601254107?text=${encodeURIComponent(t('wa_default_msg'))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <WhatsAppIcon className="w-4 h-4 text-white fill-white" />
              <span>{t('faq_whatsapp_btn')}</span>
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};
