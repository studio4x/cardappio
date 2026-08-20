import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { useBlogPosts, useBlogCategories, useBlogLayoutSettings } from '@/hooks/blog/useBlog'
import { BlogPostCard } from '@/components/blog/BlogPostCard'
import { BlogSidebar } from '@/components/blog/BlogSidebar'
import { BlogFeaturedCarousel } from '@/components/blog/BlogFeaturedCarousel'
import { LoadingState } from '@/components/shared/LoadingState'

const POSTS_PER_PAGE = 6

export function BlogHomePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const { data: categories } = useBlogCategories()
  const { data: layoutSettings } = useBlogLayoutSettings()
  const { data: postsData, isLoading: isLoadingPosts } = useBlogPosts({
    categorySlug: selectedCategory,
    search: searchQuery,
    page: currentPage,
    pageSize: POSTS_PER_PAGE,
    status: 'published'
  })

  const posts = postsData?.posts || []
  const totalPages = postsData?.totalPages || 1

  const handleCategorySelect = (slug: string) => {
    setSelectedCategory(slug)
    setCurrentPage(1)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const heroTitle = layoutSettings?.hero_title || 'Blog Cardappio'
  const heroSubtitle = layoutSettings?.hero_subtitle || 'Dicas, planejamento alimentar e receitas para organizar sua rotina na cozinha com praticidade.'

  return (
    <div className="min-h-screen bg-white pb-20 pt-28 md:pt-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* GenFlix-Style Hero Title Section */}
        <section className="text-center space-y-3 max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            {heroTitle}
          </h1>
          <p className="text-base sm:text-lg font-medium text-slate-600 leading-relaxed">
            {heroSubtitle}
          </p>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Buscar artigos..."
              className="w-full h-11 rounded-full border border-slate-200 bg-slate-50/80 pl-11 pr-4 text-xs font-semibold text-slate-900 shadow-sm outline-none transition-all focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </section>

        {/* Featured Hero Banner Carousel */}
        {posts.length > 0 && selectedCategory === 'all' && !searchQuery && (
          <BlogFeaturedCarousel posts={posts} />
        )}

        {/* GenFlix-Style Category Filters Row */}
        <section className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleCategorySelect('all')}
              className={`rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                selectedCategory === 'all'
                  ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-600/20'
                  : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>

            {categories?.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.slug)}
                className={`rounded-full px-5 py-2 text-xs font-extrabold uppercase tracking-wider transition-all shadow-sm cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-emerald-600/20 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* GenFlix-Style 2-Column Layout (Grid + Sidebar) */}
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          
          {/* Main Posts Grid */}
          <main className="space-y-10">
            {isLoadingPosts ? (
              <LoadingState message="Carregando artigos do blog..." />
            ) : posts.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center space-y-3">
                <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">Nenhum artigo encontrado</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Não encontramos artigos para o filtro ou busca selecionados. Tente selecionar outra categoria ou buscar outro termo.
                </p>
                <button
                  type="button"
                  onClick={() => { setSelectedCategory('all'); setSearchQuery('') }}
                  className="mt-2 text-xs font-extrabold text-emerald-600 underline uppercase tracking-wider cursor-pointer"
                >
                  Limpar Filtros
                </button>
              </div>
            ) : (
              <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {posts.map((post) => (
                  <BlogPostCard key={post.id} post={post} />
                ))}
              </div>
            )}

            {/* GenFlix-Style Circular Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold transition-all shadow-sm cursor-pointer ${
                      currentPage === page
                        ? 'bg-slate-900 text-white shadow-slate-900/20'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </main>

          {/* Sidebar Column */}
          <BlogSidebar />
        </div>

      </div>
    </div>
  )
}
