import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroDomainSearch from './components/public/HeroDomainSearch';
import HomeServicesGrid from './components/public/HomeServicesGrid';
import { FaqSection } from './components/public/FaqSection';
import DomainsLanding from './components/public/DomainsLanding';
import HostingLanding from './components/public/HostingLanding';
import EmailLanding from './components/public/EmailLanding';
import SslLanding from './components/public/SslLanding';
import WebDesignLanding from './components/public/WebDesignLanding';
import SeoLanding from './components/public/SeoLanding';
import AffiliatesLanding from './components/public/AffiliatesLanding';
import ResellersLanding from './components/public/ResellersLanding';
import BlogLanding from './components/public/BlogLanding';
import { LegalModal, LegalDocType } from './components/public/LegalModal';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';
import { WhatsAppFloatingButton } from './components/public/WhatsAppFloatingButton';

function resolveRoute(pathname: string): string {
  const path = pathname.toLowerCase().trim();
  if (path === '/' || path === '') return '/';
  if (path.startsWith('/dominios') || path.startsWith('/domains')) return '/dominios';
  if (path.startsWith('/hosting')) return '/hosting';
  if (path.startsWith('/email') || path.startsWith('/correo')) return '/email';
  if (path.startsWith('/ssl') || path.startsWith('/seguridad')) return '/ssl';
  if (path.startsWith('/diseno-web') || path.startsWith('/diseno') || path.startsWith('/web')) return '/diseno-web';
  if (path.startsWith('/seo')) return '/seo';
  if (path.startsWith('/afiliados') || path.startsWith('/affiliates')) return '/afiliados';
  if (path.startsWith('/resellers') || path.startsWith('/revendedores')) return '/resellers';
  if (path.startsWith('/blog')) return '/blog';
  return '/';
}

function MainAppContent() {
  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return resolveRoute(window.location.pathname);
    }
    return '/';
  });

  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(resolveRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: string) => {
    const canonicalRoute = resolveRoute(route);
    if (typeof window !== 'undefined' && window.location.pathname !== canonicalRoute) {
      window.history.pushState({}, '', canonicalRoute);
    }
    setCurrentRoute(canonicalRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#070707] selection:bg-[#B8F23A] selection:text-[#070707] font-sans antialiased">
      {/* Main Navigation Bar with full commercial portfolio */}
      <Navbar currentRoute={currentRoute} onNavigate={navigateTo} />

      {/* Main Content Area */}
      <main className="flex-1 bg-white">
        {currentRoute === '/' && (
          <div>
            <HeroDomainSearch />
            <HomeServicesGrid onNavigate={navigateTo} />
            <FaqSection />
          </div>
        )}

        {currentRoute === '/dominios' && (
          <div>
            <DomainsLanding />
            <FaqSection />
          </div>
        )}

        {currentRoute === '/hosting' && (
          <div>
            <HostingLanding />
          </div>
        )}

        {currentRoute === '/email' && (
          <div>
            <EmailLanding />
          </div>
        )}

        {currentRoute === '/ssl' && (
          <div>
            <SslLanding />
          </div>
        )}

        {currentRoute === '/diseno-web' && (
          <div>
            <WebDesignLanding />
          </div>
        )}

        {currentRoute === '/seo' && (
          <div>
            <SeoLanding />
          </div>
        )}

        {currentRoute === '/afiliados' && (
          <div>
            <AffiliatesLanding />
          </div>
        )}

        {currentRoute === '/resellers' && (
          <div>
            <ResellersLanding />
          </div>
        )}

        {currentRoute === '/blog' && (
          <div>
            <BlogLanding />
          </div>
        )}
      </main>

      {/* Legal Compliance Modal */}
      <LegalModal
        isOpen={legalModalDoc !== null}
        initialDoc={legalModalDoc || 'PRIVACY'}
        onClose={() => setLegalModalDoc(null)}
      />

      {/* Cookie Consent Banner */}
      <CookieConsentBanner
        onOpenLegalModal={(doc) => setLegalModalDoc(doc)}
      />

      {/* Floating WhatsApp Support Button */}
      <WhatsAppFloatingButton />

      {/* Global Footer */}
      <Footer
        onNavigate={navigateTo}
        onOpenLegalModal={(doc) => setLegalModalDoc(doc)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
