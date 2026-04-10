# Blog Module

A complete blogging system with posts, comments, likes, categories, and image uploads.

## Features

- ✅ CRUD operations for blog posts
- ✅ Draft/Published/Archived post status
- ✅ Categories and tags support
- ✅ Commenting system with threaded replies
- ✅ Like system for posts and comments
- ✅ Image upload for blog posts
- ✅ Pagination and filtering
- ✅ Popular tags and statistics
- ✅ SEO-friendly with meta descriptions
- ✅ Markdown support for content

## API Endpoints

All endpoints are prefixed with `/api/v1/blog` and require JWT authentication.

### Blog Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts` | List posts with pagination/filters |
| POST | `/posts` | Create new post |
| GET | `/posts/:id` | Get single post |
| PUT | `/posts/:id` | Update post (author only) |
| DELETE | `/posts/:id` | Delete post (author only) |

### Likes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/posts/:id/like` | Toggle like on post |
| POST | `/comments/:id/like` | Toggle like on comment |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/posts/:id/comments` | Get post comments |
| POST | `/posts/:id/comments` | Add comment to post |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| POST | `/categories` | Create category (admin) |

### Images

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/images/upload` | Upload blog image |

### Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | Get popular tags |
| GET | `/stats` | Get blog statistics |

## Query Parameters

### Post Filtering

- `page` - Page number (default: 1)
- `limit` - Posts per page (default: 10)
- `search` - Search in title/content
- `category` - Filter by category
- `status` - Filter by status (draft/published/archived)
- `tags` - Filter by tags (comma-separated)
- `author_id` - Filter by author
- `start_date` - Filter from date
- `end_date` - Filter to date
- `sort_by` - Sort field (created_at, title, likes_count, etc.)
- `sort_order` - Sort order (asc/desc)

## Data Models

### Blog Post
```typescript
{
  id: string
  title: string
  content: string
  excerpt?: string
  status: 'draft' | 'published' | 'archived'
  category?: string
  tags?: string[]
  featured_image?: string
  meta_description?: string
  likes_count: number
  comments_count: number
  is_liked: boolean
  created_at: string
  updated_at: string
}
```

### Comment
```typescript
{
  id: string
  content: string
  parent_comment_id?: string
  likes_count: number
  is_liked: boolean
  replies?: Comment[]
  created_at: string
}
```

## Database Tables

The module uses these Fluxez tables:

- `blog_posts` - Main blog posts
- `blog_comments` - Post comments
- `blog_likes` - Likes for posts/comments
- `blog_categories` - Post categories

## File Upload

Images are uploaded to the `blog-images` bucket in Fluxez storage. Supported formats: JPEG, PNG, GIF, WebP (max 10MB).

## Security

- All endpoints require JWT authentication
- Post authors can only edit/delete their own posts
- Categories creation may be restricted to admins
- File uploads are validated for type and size