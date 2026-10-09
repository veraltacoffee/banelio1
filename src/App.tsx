import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroDomainSearch from './components/public/HeroDomainSearch';
import { FaqSection } from './components/public/FaqSection';
import DomainsLanding from './components/public/DomainsLanding';
import { LegalModal, LegalDocType } from './components/public/LegalModal';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';
import { WhatsAppFloatingButton } from './components/public/WhatsAppFloatingButton';
import CustomerDashboard from './components/dashboard/CustomerDashboard';
import CustomerAuthView from './components/auth/CustomerAuthView';
import CartModal from './components/public/CartModal';
import CheckoutModal from './components/public/CheckoutModal';

function MainAppContent() {
  const { role, setRole, customerUser } = useApp();
  
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/dominios') || path.startsWith('/domains')) return '/dominios';
      // Rutas retiradas redirigidas limpiamente al storefront de dominios
      if (
        path.startsWith('/hosting') ||
        path.startsWith('/email') ||
        path.startsWith('/correo') ||
        path.startsWith('/ssl') ||
        path.startsWith('/seguridad') ||
        path.startsWith('/afiliados') ||
        path.startsWith('/resellers') ||
        path.startsWith('/blog')
      ) {
        return '/dominios';
      }
      return '/';
    }
    return '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialPath());
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/dominios') || path.startsWith('/domains')) {
        setCurrentRoute('/dominios');
      } else if (
        path.startsWith('/hosting') ||
        path.startsWith('/email') ||
        path.startsWith('/correo') ||
        path.startsWith('/ssl') ||
        path.startsWith('/afiliados') ||
        path.startsWith('/resellers') ||
        path.startsWith('/blog')
      ) {
        setCurrentRoute('/dominios');
      } else {
        setCurrentRoute('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (route: string, newTab: boolean = false) => {
    if (newTab) {
      window.open(route, '_blank');
      return;
    }

    if (window.location.pathname !== route) {
      window.history.pushState({}, '', route);
    }
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#070707] selection:bg-[#B8F23A] selection:text-[#070707] font-sans antialiased">
      
      {/* Main Navigation Bar */}
      <Navbar currentRoute={currentRoute} onNavigate={(r) => { navigateTo(r); if (role !== 'PUBLIC') setRole('PUBLIC'); }} />

      {/* Screen Routing based on User Role & URL Path */}
      <main className="flex-1 bg-white">
        {role === 'PUBLIC' && (
          <div>
            {currentRoute === '/' && (
              <>
                <HeroDomainSearch />
                <FaqSection />
              </>
            )}
            {currentRoute === '/dominios' && (
              <>
                <DomainsLanding />
                <FaqSection />
              </>
            )}
          </div>
        )}

        {role === 'CUSTOMER' && (
          customerUser ? (
            <CustomerDashboard />
          ) : (
            <CustomerAuthView onCancel={() => setRole('PUBLIC')} />
          )
        )}

        {(role === 'RESELLER' || role === 'ADMIN') && (
          customerUser ? (
            <CustomerDashboard />
          ) : (
            <CustomerAuthView onCancel={() => setRole('PUBLIC')} />
          )
        )}
      </main>

      {/* 4. Global Modals and Drawers */}
      <CartModal />
      <CheckoutModal />

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

      {/* 5. Footer */}
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
