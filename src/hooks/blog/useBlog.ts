import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import type { 
  BlogPost, 
  BlogCategory, 
  BlogTag,
  BlogComment, 
  BlogPostFilters, 
  CreateBlogPostInput, 
  CreateBlogCategoryInput,
  CreateBlogTagInput,
  BlogLayoutSettings,
  BlogCarouselSettings,
  BlogCarouselSlide,
  SubmitCommentInput 
} from '@/types/blog'

/**
 * Normaliza slug a partir de string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Fetch public or admin blog categories
 */
export function useBlogCategories() {
  return useQuery({
    queryKey: ['blog-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as BlogCategory[]
    },
    staleTime: 60_000,
  })
}

/**
 * Fetch blog posts with pagination and filtering
 */
export function useBlogPosts(filters?: BlogPostFilters) {
  return useQuery({
    queryKey: [
      'blog-posts',
      filters?.categorySlug ?? 'all',
      filters?.search ?? '',
      filters?.status ?? 'published',
      filters?.page ?? 1,
      filters?.pageSize ?? 6
    ],
    queryFn: async () => {
      const page = filters?.page || 1
      const pageSize = filters?.pageSize || 6
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories!blog_posts_category_id_fkey(*)
        `, { count: 'exact' })

      const status = filters?.status ?? 'published'
      if (status !== 'all') {
        query = query.eq('status', status)
      }

      if (filters?.search) {
        query = query.ilike('title', `%${filters.search}%`)
      }

      if (filters?.categorySlug && filters.categorySlug !== 'all') {
        // Resolve category ID if available
        const { data: categoryData } = await supabase
          .from('blog_categories')
          .select('id')
          .eq('slug', filters.categorySlug)
          .maybeSingle()

        if (categoryData?.id) {
          query = query.eq('category_id', categoryData.id)
        }
      }

      query = query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return {
        posts: (data ?? []) as BlogPost[],
        count: count || 0,
        totalPages: Math.max(1, Math.ceil((count || 0) / pageSize))
      }
    },
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })
}

/**
 * Fetch single blog post by ID or slug
 */
export function useBlogPost(idOrSlug: string | undefined) {
  return useQuery({
    queryKey: ['blog-post', idOrSlug],
    queryFn: async () => {
      if (!idOrSlug) return null

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug)

      let query = supabase
        .from('blog_posts')
        .select(`
          *,
          category:blog_categories!blog_posts_category_id_fkey(*)
        `)

      if (isUuid) {
        query = query.eq('id', idOrSlug)
      } else {
        query = query.eq('slug', idOrSlug)
      }

      const { data: rawPost, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (!rawPost) return null

      // Fetch linked multi-categories
      const { data: catLinks } = await supabase
        .from('blog_post_categories')
        .select('category_id')
        .eq('post_id', rawPost.id)

      // Fetch linked tags
      const { data: tagLinks } = await supabase
        .from('blog_post_tags')
        .select('tag_id')
        .eq('post_id', rawPost.id)

      const category_ids = catLinks && catLinks.length > 0
        ? catLinks.map(c => c.category_id)
        : (rawPost.category_id ? [rawPost.category_id] : [])
      const tag_ids = tagLinks ? tagLinks.map(t => t.tag_id) : []

      return {
        ...rawPost,
        category_ids,
        tag_ids
      } as BlogPost
    },
    enabled: !!idOrSlug,
  })
}

/**
 * Fetch approved comments for a blog post
 */
export function useBlogComments(postSlug: string | undefined) {
  return useQuery({
    queryKey: ['blog-comments', postSlug],
    queryFn: async () => {
      if (!postSlug) return []

      const { data, error } = await supabase
        .from('blog_comments')
        .select('*')
        .eq('post_slug', postSlug)
        .eq('status', 'approved')
        .order('created_at', { ascending: true })

      if (error) throw error
      return (data ?? []) as BlogComment[]
    },
    enabled: !!postSlug,
  })
}

/**
 * Submit a comment on a blog post
 */
export function useSubmitBlogComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: SubmitCommentInput) => {
      const { data, error } = await supabase
        .from('blog_comments')
        .insert({
          post_slug: input.postSlug,
          post_id: input.postId || null,
          first_name: input.firstName,
          last_name: input.lastName,
          email: input.email,
          content: input.content,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error
      return data as BlogComment
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments', variables.postSlug] })
    }
  })
}

/**
 * Admin Mutations for Blog Posts & Comments
 */
export function useAdminBlogMutations() {
  const queryClient = useQueryClient()

  const savePost = useMutation({
    mutationFn: async ({ id, ...input }: CreateBlogPostInput & { id?: string }) => {
      const { category_ids, tag_ids, ...postInput } = input
      const slug = postInput.slug || slugify(postInput.title)
      const primaryCategoryId = category_ids && category_ids.length > 0 ? category_ids[0] : (postInput.category_id || null)

      const payload = {
        ...postInput,
        slug,
        category_id: primaryCategoryId,
        author_id: postInput.author_id || null,
        read_time_minutes: postInput.read_time_minutes || 5,
        status: postInput.status || 'published',
        updated_at: new Date().toISOString()
      }

      let savedPost: BlogPost
      if (id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        savedPost = data as BlogPost
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        savedPost = data as BlogPost
      }

      // Sync multi-categories in blog_post_categories
      if (category_ids) {
        await supabase.from('blog_post_categories').delete().eq('post_id', savedPost.id)
        if (category_ids.length > 0) {
          const catRows = category_ids.map(cid => ({ post_id: savedPost.id, category_id: cid }))
          await supabase.from('blog_post_categories').insert(catRows)
        }
      }

      // Sync tags in blog_post_tags
      if (tag_ids) {
        await supabase.from('blog_post_tags').delete().eq('post_id', savedPost.id)
        if (tag_ids.length > 0) {
          const tagRows = tag_ids.map(tid => ({ post_id: savedPost.id, tag_id: tid }))
          await supabase.from('blog_post_tags').insert(tagRows)
        }
      }

      return savedPost
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-post'] })
    }
  })

  const deletePost = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
    }
  })

  const updateCommentStatus = useMutation({
    mutationFn: async ({ id, status, admin_response }: { id: string; status: 'approved' | 'rejected' | 'pending'; admin_response?: string }) => {
      const payload: Record<string, any> = { status, updated_at: new Date().toISOString() }
      if (admin_response !== undefined) {
        payload.admin_response = admin_response
      }
      const { data, error } = await supabase
        .from('blog_comments')
        .update(payload)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as BlogComment
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-comments'] })
      queryClient.invalidateQueries({ queryKey: ['admin-blog-comments'] })
    }
  })

  const updatePostsOrder = useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const promises = orderedIds.map((id, index) =>
        supabase
          .from('blog_posts')
          .update({ display_order: index })
          .eq('id', id)
      )
      await Promise.all(promises)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
    }
  })

  const togglePostFeatured = useMutation({
    mutationFn: async ({ id, is_featured }: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('blog_posts')
        .update({ is_featured })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] })
      queryClient.invalidateQueries({ queryKey: ['blog-post'] })
    }
  })

  return { savePost, deletePost, updateCommentStatus, updatePostsOrder, togglePostFeatured }
}

/**
 * Hook for Admin to fetch all comments (including pending/rejected)
 */
export function useAdminBlogComments(status?: 'pending' | 'approved' | 'rejected' | 'all') {
  return useQuery({
    queryKey: ['admin-blog-comments', status || 'all'],
    queryFn: async () => {
      let query = supabase
        .from('blog_comments')
        .select('*')
        .order('created_at', { ascending: false })

      if (status && status !== 'all') {
        query = query.eq('status', status)
      }

      const { data, error } = await supabase.from('blog_comments').select('*')
      if (error) throw error
      return (data ?? []) as BlogComment[]
    }
  })
}

/**
 * Hook to fetch all blog tags
 */
export function useBlogTags() {
  return useQuery({
    queryKey: ['blog-tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_tags')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return (data ?? []) as BlogTag[]
    },
    staleTime: 60_000
  })
}

/**
 * Admin Mutations for Blog Categories CRUD
 */
export function useAdminBlogCategoriesMutations() {
  const queryClient = useQueryClient()

  const saveCategory = useMutation({
    mutationFn: async ({ id, ...input }: CreateBlogCategoryInput & { id?: string }) => {
      const slug = input.slug || slugify(input.name)
      const payload = {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        parent_id: input.parent_id || null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active ?? true,
        updated_at: new Date().toISOString()
      }

      if (id) {
        const { data, error } = await supabase
          .from('blog_categories')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data as BlogCategory
      } else {
        const { data, error } = await supabase
          .from('blog_categories')
          .insert({
            ...payload,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        if (error) throw error
        return data as BlogCategory
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] })
    }
  })

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-categories'] })
    }
  })

  return { saveCategory, deleteCategory }
}

/**
 * Admin Mutations for Blog Tags CRUD
 */
export function useAdminBlogTagsMutations() {
  const queryClient = useQueryClient()

  const saveTag = useMutation({
    mutationFn: async ({ id, ...input }: CreateBlogTagInput & { id?: string }) => {
      const slug = input.slug || slugify(input.name)
      const payload = {
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        updated_at: new Date().toISOString()
      }

      if (id) {
        const { data, error } = await supabase
          .from('blog_tags')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data as BlogTag
      } else {
        const { data, error } = await supabase
          .from('blog_tags')
          .insert({
            ...payload,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        if (error) throw error
        return data as BlogTag
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] })
    }
  })

  const deleteTag = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('blog_tags').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-tags'] })
    }
  })

  return { saveTag, deleteTag }
}

/**
 * Default blog layout fallback
 */
const DEFAULT_BLOG_LAYOUT: BlogLayoutSettings = {
  hero_title: 'Blog Cardappio',
  hero_subtitle: 'Dicas, planejamento e receitas para organizar sua rotina na cozinha com praticidade.',
  sidebar_blocks: [
    {
      id: 'block-1',
      mode: 'carousel',
      block_type: 'card_text',
      slides: [
        {
          id: 'slide-1',
          badge_text: 'CARDAPPIO PRO',
          title: 'Organize sua semana alimentar sem complicação',
          description: 'Crie seu cardápio semanal personalizado, gere listas de compras automáticas e economize tempo na cozinha.',
          bullet_points: ['Planejador semanal inteligente', 'Centenas de receitas fáceis'],
          cta_button_text: 'Começar Grátis',
          cta_link_url: '/auth/cadastro',
          theme: 'dark'
        }
      ]
    }
  ]
}

/**
 * Hook to fetch blog layout settings (Hero & Sidebar Blocks)
 */
export function useBlogLayoutSettings() {
  return useQuery({
    queryKey: ['blog-layout-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'blog_layout')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (!data?.value_json) return DEFAULT_BLOG_LAYOUT

      return {
        hero_title: data.value_json.hero_title || DEFAULT_BLOG_LAYOUT.hero_title,
        hero_subtitle: data.value_json.hero_subtitle || DEFAULT_BLOG_LAYOUT.hero_subtitle,
        sidebar_blocks: Array.isArray(data.value_json.sidebar_blocks)
          ? data.value_json.sidebar_blocks
          : DEFAULT_BLOG_LAYOUT.sidebar_blocks
      } as BlogLayoutSettings
    },
    staleTime: 60_000
  })
}

/**
 * Hook for Admin to save blog layout settings
 */
export function useSaveBlogLayoutSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: BlogLayoutSettings) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          {
            setting_key: 'blog_layout',
            value_json: settings as any,
            description: 'Configurações de cabeçalho hero e blocos/sliders de lateral do blog',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        )

      if (error) throw error
      return settings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-layout-settings'] })
    }
  })
}

/**
 * Hook to fetch blog custom carousel settings
 */
export function useBlogCarouselSettings() {
  return useQuery({
    queryKey: ['blog-carousel-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value_json')
        .eq('setting_key', 'blog_carousel')
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      if (!data?.value_json) return { slides: [] } as BlogCarouselSettings

      return {
        slides: Array.isArray(data.value_json.slides) ? data.value_json.slides : []
      } as BlogCarouselSettings
    },
    staleTime: 60_000
  })
}

/**
 * Hook for Admin to save blog custom carousel settings
 */
export function useSaveBlogCarouselSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: BlogCarouselSettings) => {
      const { error } = await supabase
        .from('app_settings')
        .upsert(
          {
            setting_key: 'blog_carousel',
            value_json: settings as any,
            description: 'Configurações de carrossel em destaque da página do blog público',
            updated_at: new Date().toISOString()
          },
          { onConflict: 'setting_key' }
        )

      if (error) throw error
      return settings
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-carousel-settings'] })
    }
  })
}
