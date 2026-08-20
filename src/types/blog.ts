// ============================================
// Cardappio — Blog Types (Enhanced Edition)
// ============================================

export type BlogPostStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type BlogCommentStatus = 'pending' | 'approved' | 'rejected'

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  parent_id?: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  description?: string | null
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
  category_ids?: string[]
  categories?: BlogCategory[]
  tag_ids?: string[]
  tags?: BlogTag[]
  seo_description?: string | null
  cover_image_url?: string | null
  card_image_url?: string | null
  read_time_minutes: number
  author_name: string
  author_id?: string | null
  published_at: string | null
  scheduled_publish_at?: string | null
  content_text?: string[] | null
  content_html?: string | null
  is_featured: boolean
  status: BlogPostStatus
  focus_keyword?: string | null
  seo_title?: string | null
  seo_canonical_url?: string | null
  seo_robots?: string | null
  seo_og_title?: string | null
  seo_og_description?: string | null
  seo_og_image_url?: string | null
  display_order?: number | null
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

export interface BlogRevision {
  id: string
  post_id: string
  revision_number: number
  snapshot: Partial<BlogPost>
  changed_by?: string | null
  changed_by_name?: string | null
  change_type?: string | null
  created_at: string
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
  category_ids?: string[]
  tag_ids?: string[]
  category_name?: string | null
  seo_description?: string | null
  cover_image_url?: string | null
  card_image_url?: string | null
  read_time_minutes?: number
  author_name?: string
  author_id?: string | null
  published_at?: string | null
  scheduled_publish_at?: string | null
  content_html?: string | null
  content_text?: string[] | null
  is_featured?: boolean
  status?: BlogPostStatus
  focus_keyword?: string | null
  seo_title?: string | null
  seo_canonical_url?: string | null
  seo_robots?: string | null
  seo_og_title?: string | null
  seo_og_description?: string | null
  seo_og_image_url?: string | null
  display_order?: number | null
}

export interface SubmitCommentInput {
  postSlug: string
  postId?: string
  firstName: string
  lastName: string
  email: string
  content: string
}

export interface CreateBlogCategoryInput {
  name: string
  slug?: string
  description?: string | null
  parent_id?: string | null
  sort_order?: number
  is_active?: boolean
}

export interface CreateBlogTagInput {
  name: string
  slug?: string
  description?: string | null
}

export type BlogSidebarBlockMode = 'single' | 'carousel'
export type BlogSidebarBlockType = 'card_text' | 'image'

export interface BlogSidebarTextSlide {
  id: string
  badge_text: string
  title: string
  description: string
  bullet_points: string[]
  cta_button_text: string
  cta_link_url: string
  theme?: 'dark' | 'emerald' | 'light'
}

export interface BlogSidebarImageSlide {
  id: string
  url: string
  linkUrl: string
  alt: string
}

export interface BlogSidebarBlock {
  id: string
  mode: BlogSidebarBlockMode
  block_type: BlogSidebarBlockType
  slides: any[]
}

export interface BlogLayoutSettings {
  hero_title: string
  hero_subtitle: string
  sidebar_blocks: BlogSidebarBlock[]
}
