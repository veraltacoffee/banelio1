import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import HeroDomainSearch from './components/public/HeroDomainSearch';
import HostingPlans from './components/public/HostingPlans';
import EmailAndSsl from './components/public/EmailAndSsl';
import SolutionsSection from './components/public/SolutionsSection';
import { FaqSection } from './components/public/FaqSection';
import DomainsLanding from './components/public/DomainsLanding';
import HostingLanding from './components/public/HostingLanding';
import EmailLanding from './components/public/EmailLanding';
import SslLanding from './components/public/SslLanding';
import AffiliatesLanding from './components/public/AffiliatesLanding';
import { BlogLanding } from './components/public/BlogLanding';
import { BlogPostDetail } from './components/public/BlogPostDetail';
import { LegalModal, LegalDocType } from './components/public/LegalModal';
import { CookieConsentBanner } from './components/public/CookieConsentBanner';
import { WhatsAppFloatingButton } from './components/public/WhatsAppFloatingButton';
import CustomerDashboard from './components/dashboard/CustomerDashboard';
import ResellerPortal from './components/reseller/ResellerPortal';
import CustomerAuthView from './components/auth/CustomerAuthView';
import AffiliateAuthView from './components/auth/AffiliateAuthView';
import CartModal from './components/public/CartModal';
import CheckoutModal from './components/public/CheckoutModal';
import { BlogPost } from './types';

function MainAppContent() {
  const { role, setRole, customerUser, affiliateUser } = useApp();
  
  const getInitialPath = () => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/afiliados') || path.startsWith('/resellers')) return '/afiliados';
      if (path.startsWith('/dominios') || path.startsWith('/domains')) return '/dominios';
      if (path.startsWith('/hosting')) return '/hosting';
      if (path.startsWith('/email') || path.startsWith('/correo')) return '/email';
      if (path.startsWith('/ssl') || path.startsWith('/seguridad')) return '/ssl';
      if (path.startsWith('/blog')) return '/blog';
      return '/';
    }
    return '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialPath());
  const [selectedBlogPost, setSelectedBlogPost] = useState<BlogPost | null>(null);
  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith('/afiliados') || path.startsWith('/resellers')) {
        setCurrentRoute('/afiliados');
      } else if (path.startsWith('/dominios') || path.startsWith('/domains')) {
        setCurrentRoute('/dominios');
      } else if (path.startsWith('/hosting')) {
        setCurrentRoute('/hosting');
      } else if (path.startsWith('/email') || path.startsWith('/correo')) {
        setCurrentRoute('/email');
      } else if (path.startsWith('/ssl')) {
        setCurrentRoute('/ssl');
      } else if (path.startsWith('/blog')) {
        setCurrentRoute('/blog');
      } else {
        setCurrentRoute('/');
      }
      setSelectedBlogPost(null);
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
    setSelectedBlogPost(null);
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
                <HostingPlans />
                <EmailAndSsl />
                <SolutionsSection />
                <FaqSection />
              </>
            )}
            {currentRoute === '/dominios' && (
              <>
                <DomainsLanding />
                <FaqSection />
              </>
            )}
            {currentRoute === '/hosting' && (
              <>
                <HostingLanding />
                <FaqSection />
              </>
            )}
            {currentRoute === '/email' && (
              <>
                <EmailLanding />
                <FaqSection />
              </>
            )}
            {currentRoute === '/ssl' && (
              <>
                <SslLanding />
                <FaqSection />
              </>
            )}
            {currentRoute === '/afiliados' && <AffiliatesLanding />}
            
            {/* Technical Blog & Knowledge Base */}
            {currentRoute === '/blog' && (
              selectedBlogPost ? (
                <BlogPostDetail
                  post={selectedBlogPost}
                  onBack={() => setSelectedBlogPost(null)}
                  onSelectRelated={(post) => {
                    setSelectedBlogPost(post);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ) : (
                <BlogLanding onSelectPost={(post) => {
                  setSelectedBlogPost(post);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} />
              )
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

        {role === 'RESELLER' && (
          (affiliateUser || customerUser?.role === 'RESELLER') ? (
            <ResellerPortal />
          ) : (
            <AffiliateAuthView onCancel={() => setRole('PUBLIC')} />
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
