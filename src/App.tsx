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

export interface RouteResolution {
  canonicalPath: string;
  articleSlug: string | null;
}

export function resolveRoute(pathname: string): RouteResolution {
  const path = pathname.toLowerCase().trim();
  if (path === '/' || path === '') return { canonicalPath: '/', articleSlug: null };
  if (path.startsWith('/dominios') || path.startsWith('/domains')) return { canonicalPath: '/dominios', articleSlug: null };
  if (path.startsWith('/hosting')) return { canonicalPath: '/hosting', articleSlug: null };
  if (path.startsWith('/email') || path.startsWith('/correo')) return { canonicalPath: '/email', articleSlug: null };
  if (path.startsWith('/ssl') || path.startsWith('/seguridad')) return { canonicalPath: '/ssl', articleSlug: null };
  if (path.startsWith('/diseno-web') || path.startsWith('/diseno') || path.startsWith('/web')) return { canonicalPath: '/diseno-web', articleSlug: null };
  if (path.startsWith('/seo')) return { canonicalPath: '/seo', articleSlug: null };
  if (path.startsWith('/afiliados') || path.startsWith('/affiliates')) return { canonicalPath: '/afiliados', articleSlug: null };
  if (path.startsWith('/resellers') || path.startsWith('/revendedores')) return { canonicalPath: '/resellers', articleSlug: null };
  if (path.startsWith('/blog')) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[1]) {
      return { canonicalPath: `/blog/${segments[1]}`, articleSlug: segments[1] };
    }
    return { canonicalPath: '/blog', articleSlug: null };
  }
  return { canonicalPath: '/', articleSlug: null };
}

function MainAppContent({ initialPath }: { initialPath?: string }) {
  const [routeInfo, setRouteInfo] = useState<RouteResolution>(() => {
    if (initialPath) {
      return resolveRoute(initialPath);
    }
    if (typeof window !== 'undefined') {
      return resolveRoute(window.location.pathname);
    }
    return { canonicalPath: '/', articleSlug: null };
  });

  const [legalModalDoc, setLegalModalDoc] = useState<LegalDocType | null>(null);

  useEffect(() => {
    const handlePopState = () => {
      setRouteInfo(resolveRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (target: string) => {
    // Preserve query parameters if any (e.g. ?action=transfer)
    let path = target;
    let query = '';
    if (target.includes('?')) {
      const parts = target.split('?');
      path = parts[0];
      query = '?' + parts[1];
    }

    const resolved = resolveRoute(path);
    const destinationUrl = `${resolved.canonicalPath}${query}`;

    if (typeof window !== 'undefined' && window.location.pathname + window.location.search !== destinationUrl) {
      window.history.pushState({}, '', destinationUrl);
    }
    setRouteInfo(resolved);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { canonicalPath, articleSlug } = routeInfo;

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#070707] selection:bg-[#B9E86A] selection:text-[#070707] font-sans antialiased">
      {/* Main Navigation Bar */}
      <Navbar currentRoute={canonicalPath} onNavigate={navigateTo} />

      {/* Main Content Area */}
      <main className="flex-1 bg-white">
        {canonicalPath === '/' && (
          <div>
            <HeroDomainSearch />
            <HomeServicesGrid onNavigate={navigateTo} />
            <FaqSection onNavigateToBlog={() => navigateTo('/blog')} />
          </div>
        )}

        {canonicalPath === '/dominios' && (
          <div>
            <DomainsLanding />
            <FaqSection onNavigateToBlog={() => navigateTo('/blog')} />
          </div>
        )}

        {canonicalPath === '/hosting' && (
          <div>
            <HostingLanding />
          </div>
        )}

        {canonicalPath === '/email' && (
          <div>
            <EmailLanding />
          </div>
        )}

        {canonicalPath === '/ssl' && (
          <div>
            <SslLanding />
          </div>
        )}

        {canonicalPath === '/diseno-web' && (
          <div>
            <WebDesignLanding />
          </div>
        )}

        {canonicalPath === '/seo' && (
          <div>
            <SeoLanding />
          </div>
        )}

        {canonicalPath === '/afiliados' && (
          <div>
            <AffiliatesLanding />
          </div>
        )}

        {canonicalPath === '/resellers' && (
          <div>
            <ResellersLanding />
          </div>
        )}

        {canonicalPath.startsWith('/blog') && (
          <div>
            <BlogLanding currentArticleSlug={articleSlug} onNavigate={navigateTo} />
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

export default function App({ initialPath }: { initialPath?: string } = {}) {
  return (
    <AppProvider>
      <MainAppContent initialPath={initialPath} />
    </AppProvider>
  );
}
