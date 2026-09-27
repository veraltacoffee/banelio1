import React, { useState } from 'react';
import { Clock, Search, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BlogPost } from '../../types';
import { getLocalizedBlogPost } from '../../data/blogData';

interface BlogLandingProps {
  onSelectPost: (post: BlogPost) => void;
}

export const BlogLanding: React.FC<BlogLandingProps> = ({ onSelectPost }) => {
  const { blogPosts, language, t } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');

  const categories = language === 'en'
    ? ['ALL', 'Domains', 'Hosting', 'Email', 'Security & SSL', 'SEO & Business']
    : ['TODOS', 'Dominios', 'Hosting', 'Email', 'Seguridad & SSL', 'SEO & Negocios'];

  const localizedPosts = blogPosts.map((p) => getLocalizedBlogPost(p, language));

  const filteredPosts = localizedPosts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags.some((tg) => tg.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (post.trendingSearchQuery && post.trendingSearchQuery.toLowerCase().includes(searchTerm.toLowerCase()));

    const isAll = selectedCategory === 'TODOS' || selectedCategory === 'ALL';
    const matchesCategory =
      isAll ||
      post.category.toLowerCase() === selectedCategory.toLowerCase() ||
      (selectedCategory.includes('Domain') && post.category.includes('Domain')) ||
      (selectedCategory.includes('Domin') && post.category.includes('Domin'));

    return matchesSearch && matchesCategory;
  });

  const featuredPost = localizedPosts[0];

  return (
    <div className="min-h-screen bg-white text-[#070707] relative overflow-hidden">
      {/* Top Oversized Banelio Favicon Watermark (Top-Right overflowing) */}
      <div className="absolute -top-64 -right-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.045] -rotate-12 overflow-hidden">
        <img
          src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="py-16 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Header - No small eyebrow badge */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-[#070707] tracking-tight leading-tight">
            {t('blog_title')}{' '}
            <span className="inline-block px-3 py-1 rounded-2xl bg-[#B8F23A] text-[#070707] shadow-xs">
              {t('blog_title_highlight')}
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[#555A52]">
            {t('blog_subtitle')}
          </p>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#858A82]" />
            <input
              id="blog-search-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('blog_search_placeholder')}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-[#8A8F98] rounded-2xl text-[#070707] placeholder-[#858A82] focus:outline-none focus:ring-2 focus:ring-[#B8F23A] shadow-xs text-sm sm:text-base"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat || (cat === 'ALL' && selectedCategory === 'TODOS') || (cat === 'TODOS' && selectedCategory === 'ALL');
              return (
                <button
                  key={cat}
                  id={`blog-cat-${cat.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#B8F23A] text-[#070707] shadow-xs scale-105'
                      : 'bg-white border border-[#8A8F98] text-[#555A52] hover:bg-[#F7F8F0]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Featured Top Article (when not filtering search) */}
        {!searchTerm && (selectedCategory === 'TODOS' || selectedCategory === 'ALL') && featuredPost && (
          <div
            id="featured-blog-post"
            onClick={() => onSelectPost(featuredPost)}
            className="group cursor-pointer relative bg-white border border-[#8A8F98] rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-12 gap-0"
          >
            <div className="lg:col-span-7 h-64 lg:h-auto relative overflow-hidden">
              <img
                src={featuredPost.coverImage}
                alt={featuredPost.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-4 left-4 bg-[#070707]/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-[#B8F23A] flex items-center gap-1.5 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-[#B8F23A]" />
                <span>{t('blog_featured')}</span>
              </div>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-xs text-[#555A52]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#F7F8F0] text-[#B8F23A] font-bold uppercase tracking-wider text-[10px]">
                    {featuredPost.category}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-[#070707] group-hover:text-[#B8F23A] transition-colors leading-snug">
                  {featuredPost.title}
                </h2>

                <p className="text-sm text-[#555A52] line-clamp-3 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-[#8A8F98] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={featuredPost.author.avatar}
                    alt={featuredPost.author.name}
                    referrerPolicy="no-referrer"
                    className="w-9 h-9 rounded-full object-cover ring-2 ring-[#B8F23A]/40"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#070707]">{featuredPost.author.name}</div>
                    <div className="text-[11px] text-[#858A82]">{featuredPost.author.role}</div>
                  </div>
                </div>

                <span className="text-xs font-black text-[#B8F23A] flex items-center gap-1 group-hover:underline">
                  {t('blog_read_article')} &rarr;
                </span>
              </div>
            </div>
          </div>
        )}

        {/* All Articles Section */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#070707]">
            {t('blog_all_articles')}
          </h2>
          <span className="text-xs font-bold text-[#858A82] uppercase tracking-wider">
            {filteredPosts.length} {language === 'en' ? 'articles' : 'artículos'}
          </span>
        </div>

        {/* Blog Post Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPosts.map((post) => (
            <div
              key={post.id}
              id={`blog-card-${post.id}`}
              onClick={() => onSelectPost(post)}
              className="group cursor-pointer bg-white border border-[#8A8F98] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="h-48 relative overflow-hidden bg-[#F7F8F0]">
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#070707]/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-[#B8F23A] border border-white/10 uppercase tracking-wider">
                    {post.category}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div className="flex items-center gap-3 text-xs text-[#858A82]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {post.readTime}
                    </span>
                    <span>&middot;</span>
                    <span>{post.publishedAt}</span>
                  </div>

                  <h3 className="text-lg font-bold text-[#070707] group-hover:text-[#B8F23A] transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs text-[#555A52] line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              <div className="p-6 pt-0 border-t border-[#8A8F98]/50 flex items-center justify-between mt-4">
                <div className="flex items-center gap-2">
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-[#B8F23A]/40"
                  />
                  <span className="text-xs font-semibold text-[#555A52]">{post.author.name}</span>
                </div>
                <span className="text-xs font-bold text-[#B8F23A] group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      </div>

      {/* Differentiated Bottom Community Section (bg-[#F7F8F0]) */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F7F8F0] border-t border-[#8A8F98] relative overflow-hidden">
        {/* Oversized Banelio Favicon Watermark (Bottom-Left overflowing) */}
        <div className="absolute -bottom-64 -left-64 w-[850px] h-[850px] sm:w-[1150px] sm:h-[1150px] lg:w-[1350px] lg:h-[1350px] pointer-events-none select-none z-0 opacity-[0.05] rotate-15 overflow-hidden">
          <img
            src="https://res.cloudinary.com/hxbmhqiq/image/upload/v1787810546/Untitled_design_5_1.png"
            alt=""
            aria-hidden="true"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#070707]">
            {language === 'en' ? 'Stay ahead with cloud & infrastructure guides' : 'Aprende y optimiza tu infraestructura digital'}
          </h2>
          <p className="text-[#555A52] text-sm max-w-xl mx-auto">
            {language === 'en'
              ? 'Get weekly performance insights, cPanel mastery tips, and domain availability alerts directly to your mailbox.'
              : 'Recibe análisis semanales de rendimiento, trucos de cPanel y alertas de dominios sin spam.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder={language === 'en' ? 'Enter your email address...' : 'Ingresa tu correo electrónico...'}
              className="px-4 py-3 bg-white border border-[#8A8F98] rounded-xl text-sm text-[#070707] placeholder-[#858A82] focus:outline-none focus:ring-2 focus:ring-[#B8F23A] flex-1"
            />
            <button
              onClick={() => alert(language === 'en' ? 'Subscribed successfully!' : '¡Suscrito con éxito!')}
              className="px-6 py-3 bg-[#B8F23A] hover:bg-[#B8F23A] text-[#070707] font-black rounded-xl text-xs transition-all shadow-xs cursor-pointer"
            >
              {language === 'en' ? 'Subscribe' : 'Suscribirme'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
