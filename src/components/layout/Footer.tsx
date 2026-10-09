import React from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowUpRight, Scale, Phone } from 'lucide-react';
import { LegalDocType } from '../public/LegalModal';

interface FooterProps {
  onNavigate: (route: string) => void;
  onOpenLegalModal?: (doc: LegalDocType) => void;
}

export default function Footer({ onNavigate, onOpenLegalModal }: FooterProps) {
  const { setRole, t } = useApp();

  const socialLinks = [
    {
      name: 'X (Twitter)',
      handle: '@trybanelio',
      url: 'https://x.com/trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      name: 'Instagram',
      handle: '@trybanelio',
      url: 'https://instagram.com/trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      )
    },
    {
      name: 'Facebook',
      handle: '@trybanelio',
      url: 'https://facebook.com/trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      name: 'LinkedIn',
      handle: '@trybanelio',
      url: 'https://linkedin.com/company/trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      )
    },
    {
      name: 'YouTube',
      handle: '@trybanelio',
      url: 'https://youtube.com/@trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    },
    {
      name: 'TikTok',
      handle: '@trybanelio',
      url: 'https://tiktok.com/@trybanelio',
      icon: (
        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-1.01v8.44c0 1.94-.52 3.9-1.64 5.48-1.2 1.67-3.04 2.82-5.06 3.12-1.89.27-3.86-.06-5.54-.99-1.68-.94-2.99-2.51-3.64-4.33-.65-1.83-.55-3.89.28-5.65.83-1.75 2.37-3.12 4.23-3.79 1.1-.39 2.27-.51 3.44-.4v4.04c-.65-.11-1.34-.05-1.96.17-.79.28-1.46.86-1.84 1.6-.39.75-.45 1.63-.19 2.44.27.81.86 1.48 1.64 1.84.77.36 1.67.38 2.46.07.78-.32 1.4-1 1.67-1.81.16-.5.22-1.03.22-1.56V.02z" />
        </svg>
      )
    }
  ];

  return (
    <footer className="bg-[#070707] text-[#959A92] text-xs border-t border-[#555A52]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12">
        
        {/* Adjusted Grid with balanced column distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
          
          {/* Brand Col */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/')}>
              <img
                src="https://res.cloudinary.com/hxbmhqiq/image/upload/f_auto,q_auto/LOGO_BANELIO_wide_2"
                alt="Banelio Cloud Technologies"
                referrerPolicy="no-referrer"
                className="h-10 sm:h-12 w-auto object-contain brightness-0 invert"
              />
            </div>
            <p className="text-[#858A82] text-xs leading-relaxed max-w-sm">
              {t('footer_desc')}
            </p>

            {/* Direct Contact & Social */}
            <div className="space-y-2 pt-1">
              <div className="text-[11px] text-[#FCFCF8] space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#858A82]">{t('footer_support_sales')} </span>
                  <a href="mailto:try@banelio.com" className="text-[#B8F23A] font-bold hover:underline">
                    try@banelio.com
                  </a>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <a
                    href="tel:+526601254107"
                    className="inline-flex items-center gap-1 text-[#FCFCF8] hover:text-[#B8F23A] transition-colors font-medium"
                    title="Llamar a Banelio"
                  >
                    <Phone size={12} className="text-[#B8F23A]" />
                    <span>+52 660 125 4107</span>
                  </a>
                </div>
              </div>

              <div className="pt-1">
                <div className="text-[10px] font-bold text-[#FCFCF8] mb-1.5 flex items-center gap-1.5">
                  <span>{t('footer_community')}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {socialLinks.map((soc) => (
                    <a
                      key={soc.name}
                      href={soc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${soc.name} · Banelio`}
                      className="w-7 h-7 rounded-lg bg-[#141414] hover:bg-[#B8F23A] text-[#FCFCF8] hover:text-[#070707] border border-[#555A52]/40 hover:border-[#B8F23A] flex items-center justify-center transition-all shadow-xs cursor-pointer group"
                    >
                      {soc.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Col 2: Dominios & DNS */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#FCFCF8] uppercase tracking-wider text-[11px]">{t('footer_col_domains')}</h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onNavigate('/dominios')} className="hover:text-[#FCFCF8] transition-colors cursor-pointer text-left">
                  {t('footer_search_tlds')}
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('/dominios')} className="hover:text-[#FCFCF8] transition-colors cursor-pointer text-left">
                  {t('footer_transfer')}
                </button>
              </li>
              <li>
                <button onClick={() => setRole('CUSTOMER')} className="hover:text-[#FCFCF8] transition-colors cursor-pointer text-left">
                  {t('footer_dns_zones')}
                </button>
              </li>
              <li>
                <button onClick={() => setRole('CUSTOMER')} className="hover:text-[#FCFCF8] transition-colors cursor-pointer text-left">
                  {t('footer_client_panel')}
                </button>
              </li>
              <li>
                <span className="text-[#686D65]">{t('footer_whois_free')}</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal México (Complete compliance menu) */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-[#FCFCF8] uppercase tracking-wider text-[11px] flex items-center gap-1">
              <Scale className="w-3 h-3 text-[#B8F23A]" />
              <span>{t('footer_col_legal')}</span>
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button
                  id="footer-legal-privacy"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('PRIVACY')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_privacy')}
                </button>
              </li>
              <li>
                <button
                  id="footer-legal-cookies"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('COOKIES')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_cookies')}
                </button>
              </li>
              <li>
                <button
                  id="footer-legal-arco"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('ARCO')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_arco')}
                </button>
              </li>
              <li>
                <button
                  id="footer-legal-terms"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('TERMS')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_terms')}
                </button>
              </li>
              <li>
                <button
                  id="footer-legal-aup"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('AUP')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_aup')}
                </button>
              </li>
              <li>
                <button
                  id="footer-legal-domains"
                  onClick={() => onOpenLegalModal && onOpenLegalModal('DOMAIN_AGREEMENT')}
                  className="hover:text-[#B8F23A] transition-colors cursor-pointer text-left"
                >
                  {t('footer_domain_contract')}
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-[#555A52]/20 flex flex-col md:flex-row items-center justify-between gap-3 text-[#757A72] text-[11px]">
          <div>
            &copy; {new Date().getFullYear()} BANELIO &middot; {t('footer_rights')}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('PRIVACY')}
              className="hover:text-[#FCFCF8] transition-colors cursor-pointer"
            >
              {t('footer_data_protection')}
            </button>
            <span>&middot;</span>
            <button
              onClick={() => onOpenLegalModal && onOpenLegalModal('COOKIES')}
              className="hover:text-[#FCFCF8] transition-colors cursor-pointer"
            >
              {t('footer_cookie_settings')}
            </button>
            <span>&middot;</span>
            <span className="text-[#656A62]">{t('footer_secure_payments')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
