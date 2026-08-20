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
          category:blog_categories(*)
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
          category:blog_categories(*)
        `)

      if (isUuid) {
        query = query.eq('id', idOrSlug)
      } else {
        query = query.eq('slug', idOrSlug)
      }

      const { data, error } = await query.maybeSingle()

      if (error && error.code !== 'PGRST116') throw error
      return (data ?? null) as BlogPost | null
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
      const slug = input.slug || slugify(input.title)
      const payload = {
        ...input,
        slug,
        category_id: input.category_id || null,
        author_id: input.author_id || null,
        read_time_minutes: input.read_time_minutes || 5,
        status: input.status || 'published',
        updated_at: new Date().toISOString()
      }

      if (id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        return data as BlogPost
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert(payload)
          .select()
          .single()
        if (error) throw error
        return data as BlogPost
      }
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

  return { savePost, deletePost, updateCommentStatus }
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
