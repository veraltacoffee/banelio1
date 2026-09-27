import React from 'react';
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react';
import { BlogPost } from '../../types';
import { useApp } from '../../context/AppContext';
import { getLocalizedBlogPost } from '../../data/blogData';

interface BlogPostDetailProps {
  post: BlogPost;
  onBack: () => void;
  onSelectRelated: (post: BlogPost) => void;
}

export const BlogPostDetail: React.FC<BlogPostDetailProps> = ({ post, onBack, onSelectRelated }) => {
  const { blogPosts, addToast, language, t } = useApp();

  const localizedPost = getLocalizedBlogPost(post, language);

  const relatedPosts = blogPosts
    .filter(p => p.id !== post.id && (p.category === post.category || p.tags.some(t => post.tags.includes(t))))
    .slice(0, 3)
    .map(p => getLocalizedBlogPost(p, language));

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      addToast({
        type: 'success',
        title: t('blog_link_copied'),
        message: t('blog_link_copied_desc')
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFCF8] dark:bg-[#070707] py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Top Bar */}
        <div className="flex items-center justify-between">
          <button
            id="blog-detail-back-btn"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#111111] border border-[#8A8F98] dark:border-[#242424] text-xs font-bold text-[#555A52] dark:text-[#A0A69D] hover:text-[#070707] dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('blog_back')}</span>
          </button>

          <button
            id="blog-detail-share-btn"
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-[#111111] border border-[#8A8F98] dark:border-[#242424] text-xs font-bold text-[#555A52] dark:text-[#A0A69D] hover:text-[#070707] dark:hover:text-white transition-colors shadow-2xs cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#B8F23A] dark:text-[#B8F23A]" />
            <span>{t('blog_share')}</span>
          </button>
        </div>

        {/* Article Header */}
        <div className="bg-white dark:bg-[#070707] border border-[#8A8F98] dark:border-[#242424] rounded-3xl p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-[#F7F8F0] dark:bg-[#111111] text-[#B8F23A] dark:text-[#B8F23A] font-bold uppercase tracking-wider text-xs">
              {localizedPost.category}
            </span>
            <span className="text-xs text-[#858A82] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {localizedPost.publishedAt}
            </span>
            <span className="text-xs text-[#858A82]">&middot;</span>
            <span className="text-xs text-[#858A82] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {localizedPost.readTime}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#070707] dark:text-white tracking-tight leading-tight">
            {localizedPost.title}
          </h1>

          <p className="text-base sm:text-lg text-[#555A52] dark:text-[#C5CBC1] leading-relaxed border-l-4 border-[#B8F23A] pl-4 italic">
            {localizedPost.excerpt}
          </p>

          {/* Author info card */}
          <div className="flex items-center gap-4 pt-4 border-t border-[#8A8F98] dark:border-[#242424]">
            <img
              src={localizedPost.author.avatar}
              alt={localizedPost.author.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover ring-2 ring-[#B8F23A]/40"
            />
            <div>
              <h4 className="text-sm font-bold text-[#070707] dark:text-white">{localizedPost.author.name}</h4>
              <p className="text-xs text-[#858A82]">{localizedPost.author.role} &middot; Banelio Cloud Technologies</p>
            </div>
          </div>
        </div>

        {/* Featured Cover Image */}
        <div className="rounded-3xl overflow-hidden shadow-xl border border-[#8A8F98] dark:border-[#242424] max-h-[450px]">
          <img
            src={localizedPost.coverImage}
            alt={localizedPost.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Body Content */}
        <div className="bg-white dark:bg-[#070707] border border-[#8A8F98] dark:border-[#242424] rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="space-y-6 text-[#333830] dark:text-[#C5CBC1] leading-relaxed text-base sm:text-lg">
            {localizedPost.content.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-xl sm:text-2xl font-bold text-[#070707] dark:text-white mt-8 mb-3">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('---')) {
                return <hr key={idx} className="my-6 border-[#8A8F98] dark:border-[#242424]" />;
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote key={idx} className="p-4 rounded-2xl bg-[#F7F8F0] dark:bg-[#111111] border-l-4 border-[#B8F23A] text-[#070707] dark:text-white my-4 text-sm sm:text-base font-medium">
                    {paragraph.replace('> ', '')}
                  </blockquote>
                );
              }
              if (paragraph.startsWith('```')) {
                const codeContent = paragraph.replace(/```[a-z]*\n?/g, '').trim();
                return (
                  <div key={idx} className="p-4 rounded-2xl bg-[#070707] text-[#8A8F98] font-mono text-xs sm:text-sm overflow-x-auto shadow-inner border border-[#242424]">
                    <pre>{codeContent}</pre>
                  </div>
                );
              }
              return (
                <p key={idx} className="leading-relaxed">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          <div className="mt-10 pt-6 border-t border-[#8A8F98] dark:border-[#242424] space-y-3">
            <p className="text-xs font-bold text-[#858A82] uppercase tracking-wider">{t('blog_tags')}</p>
            <div className="flex flex-wrap gap-2">
              {localizedPost.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-lg bg-[#F7F8F0] dark:bg-[#111111] text-[#B8F23A] dark:text-[#B8F23A] font-medium"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <div className="space-y-4 pt-6">
            <h3 className="text-xl font-bold text-[#070707] dark:text-white">
              {t('blog_related')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map(rel => (
                <div
                  key={rel.id}
                  onClick={() => onSelectRelated(rel)}
                  className="cursor-pointer bg-white dark:bg-[#070707] border border-[#8A8F98] dark:border-[#242424] rounded-2xl overflow-hidden hover:border-[#B8F23A] transition-all p-4 space-y-2 group shadow-2xs"
                >
                  <img
                    src={rel.coverImage}
                    alt={rel.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-28 object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className="text-[10px] font-bold text-[#B8F23A] dark:text-[#B8F23A] uppercase">{rel.category}</span>
                  <h4 className="text-xs sm:text-sm font-bold text-[#070707] dark:text-white group-hover:text-[#B8F23A] dark:group-hover:text-[#B8F23A] line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
