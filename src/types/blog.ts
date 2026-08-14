// ============================================
// Cardappio — Blog Types
// ============================================

export type BlogPostStatus = 'draft' | 'published' | 'archived'
export type BlogCommentStatus = 'pending' | 'approved' | 'rejected'

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  category_id?: string | null
  category_name?: string | null
  category?: BlogCategory | null
  seo_description?: string | null
  cover_image_url?: string | null
  read_time_minutes: number
  author_name: string
  author_id?: string | null
  published_at: string | null
  content_text?: string[] | null
  content_html?: string | null
  is_featured: boolean
  status: BlogPostStatus
  created_at: string
  updated_at: string
}

export interface BlogComment {
  id: string
  post_id?: string | null
  post_slug: string
  user_id?: string | null
  first_name: string
  last_name: string
  email: string
  content: string
  status: BlogCommentStatus
  admin_response?: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostFilters {
  categorySlug?: string
  search?: string
  status?: BlogPostStatus | 'all'
  page?: number
  pageSize?: number
}

export interface CreateBlogPostInput {
  title: string
  slug?: string
  category_id?: string | null
  category_name?: string | null
  seo_description?: string | null
  cover_image_url?: string | null
  read_time_minutes?: number
  author_name?: string
  author_id?: string | null
  published_at?: string | null
  content_html?: string | null
  content_text?: string[] | null
  is_featured?: boolean
  status?: BlogPostStatus
}

export interface SubmitCommentInput {
  postSlug: string
  postId?: string
  firstName: string
  lastName: string
  email: string
  content: string
}
