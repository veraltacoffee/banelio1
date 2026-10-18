import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  BookOpen,
  Search,
  Clock,
  ArrowRight,
  Share2,
  Check,
  ChevronLeft,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react';
import { BLOG_ARTICLES, Article, getArticleBySlug } from '../../data/blogArticles';

interface BlogLandingProps {
  currentArticleSlug?: string | null;
  onNavigate?: (route: string) => void;
}

export default function BlogLanding({ currentArticleSlug, onNavigate }: BlogLandingProps) {
  const { language } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);

  // If a slug was passed or present in URL
  const selectedArticle = currentArticleSlug ? getArticleBySlug(currentArticleSlug) : null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentArticleSlug]);

  const categories = [
    { id: 'ALL', label: language === 'en' ? 'All Articles' : 'Todos los Artículos' },
    { id: 'Dominios', label: language === 'en' ? 'Domains' : 'Dominios' },
    { id: 'Hosting', label: language === 'en' ? 'Hosting' : 'Hosting' },
    { id: 'Email', label: language === 'en' ? 'Email' : 'Email' },
    { id: 'Seguridad', label: language === 'en' ? 'Security' : 'Seguridad' }
  ];

  const filteredArticles = BLOG_ARTICLES.filter((art) => {
    const matchesCategory =
      selectedCategory === 'ALL' ||
      art.category === selectedCategory ||
      (language === 'en' && art.categoryEn.toLowerCase() === selectedCategory.toLowerCase());

    const titleText = language === 'en' ? art.titleEn.toLowerCase() : art.title.toLowerCase();
    const summaryText = language === 'en' ? art.summaryEn.toLowerCase() : art.summary.toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch = !query || titleText.includes(query) || summaryText.includes(query);

    return matchesCategory && matchesSearch;
  });

  const handleCopyLink = (slug: string) => {
    if (typeof window !== 'undefined') {
      const url = `https://banelio.com/blog/${slug}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // If a specific article is selected, render the dedicated article page
  if (selectedArticle) {
    const title = language === 'en' ? selectedArticle.titleEn : selectedArticle.title;
    const category = language === 'en' ? selectedArticle.categoryEn : selectedArticle.category;
    const paragraphs = language === 'en' ? selectedArticle.contentEn : selectedArticle.content;

    return (
      <div className="bg-white text-[#070707] min-h-screen">
        {/* Article Breadcrumbs & Header */}
        <section className="pt-10 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-xs text-[#555A52]">
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('/')}
                  className="hover:text-[#070707] transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Home' : 'Inicio'}
                </button>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <button
                  onClick={() => onNavigate && onNavigate('/blog')}
                  className="hover:text-[#070707] transition-colors cursor-pointer"
                >
                  Blog
                </button>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-[#070707] font-semibold truncate max-w-xs sm:max-w-md">
                {title}
              </li>
            </ol>
          </nav>

          {/* Back button */}
          <button
            onClick={() => onNavigate && onNavigate('/blog')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#555A52] hover:text-[#070707] mb-6 p-2 rounded-xl hover:bg-[#F7F8F0] transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} />
            <span>{language === 'en' ? 'Back to All Articles' : 'Volver a todos los artículos'}</span>
          </button>

          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#555A52]">
              <span className="bg-[#DFF5B5] text-[#070707] font-black text-[11px] uppercase tracking-wider px-3 py-1 rounded-full">
                {category}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Calendar size={13} className="text-[#858A82]" />
                {selectedArticle.date}
              </span>
              <span className="flex items-center gap-1 font-mono">
                <Clock size={13} className="text-[#858A82]" />
                {selectedArticle.readTime}
              </span>
              <span className="flex items-center gap-1">
                <User size={13} className="text-[#858A82]" />
                {selectedArticle.author}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#070707] tracking-tight leading-tight">
              {title}
            </h1>

            <p className="text-base sm:text-lg text-[#555A52] leading-relaxed font-normal pt-2">
              {language === 'en' ? selectedArticle.summaryEn : selectedArticle.summary}
            </p>
          </header>

          {/* Article Body */}
          <article className="mt-10 pt-8 border-t border-[#E2E5DA] space-y-6 text-sm sm:text-base text-[#070707] leading-relaxed">
            {paragraphs.map((p, idx) => (
              <p key={idx} className="text-justify sm:text-left">
                {p}
              </p>
            ))}
          </article>

          {/* Article Footer & Sharing */}
          <footer className="mt-12 pt-8 border-t border-[#E2E5DA] flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => handleCopyLink(selectedArticle.slug)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F7F8F0] hover:bg-[#F1F3E8] border border-[#E2E5DA] text-xs font-bold text-[#070707] transition-colors cursor-pointer"
            >
              {copiedLink ? <Check size={15} className="text-green-600" /> : <Share2 size={15} />}
              <span>{copiedLink ? (language === 'en' ? 'Link Copied!' : '¡Enlace Copiado!') : (language === 'en' ? 'Share Article' : 'Compartir Artículo')}</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('/blog')}
                className="px-5 py-2.5 rounded-xl bg-[#070707] hover:bg-[#202020] text-[#FCFCF8] text-xs font-bold transition-transform hover:scale-[1.02] cursor-pointer"
              >
                {language === 'en' ? 'View More Articles' : 'Ver más artículos'}
              </button>
            </div>
          </footer>
        </section>
      </div>
    );
  }

  // Articles listing view
  return (
    <div className="bg-white text-[#070707] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E2E5DA]">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#DFF5B5]/25 rounded-full blur-[120px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#DFF5B5] border border-[#B9E86A] text-xs font-black tracking-wide text-[#070707] uppercase mb-5">
            <BookOpen size={14} className="text-[#070707]" />
            <span>{language === 'en' ? 'Banelio Knowledge Base & Tech Guides' : 'Blog Oficial & Recursos Técnicos'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-[#070707] tracking-tight leading-tight max-w-4xl mx-auto">
            {language === 'en'
              ? 'Technical knowledge for modern web infrastructure.'
              : 'Conocimiento técnico para escalar tu presencia digital.'}
          </h1>

          <p className="mt-5 text-base sm:text-lg text-[#555A52] max-w-2xl mx-auto font-normal leading-relaxed">
            {language === 'en'
              ? 'Detailed guides on cloud hosting performance, email authentication protocols (SPF/DKIM/DMARC), domain management, and web security.'
              : 'Guías detalladas sobre infraestructura cloud, protocolos de autenticación de correo (SPF/DKIM/DMARC), selección de dominios y seguridad web.'}
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#858A82]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'en'
                    ? 'Search articles by topic (e.g. NVMe, SPF, SSL, Domains)...'
                    : 'Buscar por tema (ej. NVMe, SPF, SSL, Dominios, TTFB)...'
                }
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-[#E2E5DA] bg-white text-xs sm:text-sm text-[#070707] placeholder-[#858A82] focus:outline-none focus:border-[#070707] focus:ring-2 focus:ring-[#B9E86A] shadow-2xs"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#070707] ${
                  selectedCategory === cat.id
                    ? 'bg-[#070707] text-[#FCFCF8] shadow-xs'
                    : 'bg-[#F7F8F0] text-[#555A52] hover:text-[#070707] border border-[#E2E5DA]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-base font-bold text-[#555A52]">
              {language === 'en' ? 'No articles found matching your query.' : 'No se encontraron artículos para tu búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredArticles.map((art) => (
              <article
                key={art.id}
                className="bg-white rounded-2xl p-7 border border-[#E2E5DA] shadow-xs hover:border-[#070707] hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-[#858A82] mb-3">
                    <span className="inline-block bg-[#DFF5B5] text-[#070707] font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                      {language === 'en' ? art.categoryEn : art.category}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock size={12} />
                      {art.readTime}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-[#070707] leading-snug">
                    <button
                      onClick={() => onNavigate && onNavigate(`/blog/${art.slug}`)}
                      className="text-left hover:underline cursor-pointer"
                    >
                      {language === 'en' ? art.titleEn : art.title}
                    </button>
                  </h2>

                  <p className="text-xs sm:text-sm text-[#555A52] mt-3 leading-relaxed">
                    {language === 'en' ? art.summaryEn : art.summary}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-[#E2E5DA] flex items-center justify-between">
                  <span className="text-[11px] text-[#858A82] font-mono">{art.date}</span>
                  <button
                    onClick={() => onNavigate && onNavigate(`/blog/${art.slug}`)}
                    className="flex items-center gap-1.5 text-xs font-black text-[#070707] hover:text-[#49652A] group cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#070707]"
                  >
                    <span>{language === 'en' ? 'Read Complete Article' : 'Leer Artículo'}</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
