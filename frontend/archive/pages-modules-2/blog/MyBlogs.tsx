import React, { useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Plus, PenTool } from 'lucide-react';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from '../../components/ui/pagination';
import { Skeleton } from '../../components/ui/skeleton';
import BlogCard from '../../components/blog/BlogCard';
import { useBlogPosts } from '../../hooks/useBlog';
import { useAllBlogs } from '../../hooks/blog/useAllBlogs';
import { useAuth } from '../../contexts/AuthContext';

const MyBlogs: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Fetch user's own blogs using author_id parameter with pagination
  const paginatedBlogs = useBlogPosts(
    user?.id
      ? {
          user_id: user.id, // Use user_id parameter to filter by author
          sortBy: 'updatedAt',
          sortOrder: 'desc',
        }
      : undefined,
    {
      enabled: !!user?.id, // Only fetch if user is logged in
      initialPage: currentPage,
      initialLimit: 10, // Show 10 blogs per page
    },
  );

  // Fetch all blogs for trending/popular recommendations (like Home page)
  const { blogs: allBlogs, loading: allBlogsLoading } = useAllBlogs();

  const myBlogsData = paginatedBlogs.data?.data || [];
  
  // Create popular/trending posts (include both own and others' posts)
  const trendingPosts = useMemo(
    () => [...allBlogs]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Sort by rating (popular)
      .slice(0, 5), // Show top 5 trending posts
    [allBlogs],
  );
  const loading = paginatedBlogs.loading;
  
  // Pagination info
  const pagination = {
    total: paginatedBlogs.data?.total || 0,
    totalPages: paginatedBlogs.totalPages,
    currentPage: paginatedBlogs.page,
    limit: paginatedBlogs.limit
  };

  // Update URL when pagination changes
  useEffect(() => {
    const params = new URLSearchParams();
    if (paginatedBlogs.page > 1) {
      params.set('page', paginatedBlogs.page.toString());
    }
    setSearchParams(params, { replace: true });
  }, [paginatedBlogs.page, setSearchParams]);

  // Debug logging
  console.log('🔍 MyBlogs Debug:', {
    userId: user?.id,
    userName: user?.name,
    myBlogsDisplayed: myBlogsData.length,
    myBlogsTotalFromAPI: pagination.total,
    myBlogsCurrentPage: pagination.currentPage,
    myBlogsLimit: pagination.limit,
    myBlogsTotalPages: pagination.totalPages,
    myBlogsLoading: loading,
    allBlogsLoading,
    allBlogsCount: allBlogs.length,
    trendingCount: trendingPosts.length,
    trendingPostTitles: trendingPosts.map(p => p.title).slice(0, 3), // Show first 3 titles
  });

  // If user is not logged in, show login prompt
  if (!user) {
    return (
      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="text-center py-16 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl border border-border">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Please log in to view your blogs
          </h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to see your personal blog posts.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }
  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    paginatedBlogs.goToPage(newPage);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPaginationItems = () => {
    const items = [];
    const totalPages = pagination.totalPages;
    const current = pagination.currentPage;
    
    // Show first page
    if (totalPages > 0) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink 
            onClick={() => handlePageChange(1)}
            isActive={current === 1}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Show ellipsis if needed
    if (current > 3) {
      items.push(<PaginationEllipsis key="ellipsis-start" />);
    }
    
    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(totalPages - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink 
              onClick={() => handlePageChange(i)}
              isActive={current === i}
              className="cursor-pointer"
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
    }
    
    // Show ellipsis if needed
    if (current < totalPages - 2) {
      items.push(<PaginationEllipsis key="ellipsis-end" />);
    }
    
    // Show last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink 
            onClick={() => handlePageChange(totalPages)}
            isActive={current === totalPages}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return items;
  };

  const totalViews = myBlogsData.reduce(
    (acc, post) => acc + Math.floor(Math.random() * 1000) + 500,
    0,
  );
  const totalLikes = myBlogsData.reduce(
    (acc, post) => acc + Math.floor(Math.random() * 100) + 20,
    0,
  );

  return (
    <div className="space-y-6">
      <main className="container mx-auto max-w-7xl px-4 py-8">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 p-6 rounded-xl border border-border mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">My Blog Dashboard</h1>
              <p className="text-lg text-muted-foreground">
                Manage your published articles and track your writing journey
              </p>
            </div>
            <Link
              to="/blog/createBlog"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg border border-primary/30"
            >
              <Plus className="w-5 h-5" />
              Create New Blog
            </Link>
          </div>

          {/* Stats Section */}
          {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-6 shadow-lg border border-border/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-600/20 dark:from-blue-400/30 dark:to-blue-500/30 rounded-lg shadow-sm">
                  <PenTool className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-12 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">{myBlogsData.length}</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Posts</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-6 shadow-lg border border-border/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 dark:from-emerald-400/30 dark:to-emerald-500/30 rounded-lg shadow-sm">
                  <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {totalViews.toLocaleString()}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Views</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-6 shadow-lg border border-border/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-red-500/20 to-red-600/20 dark:from-red-400/30 dark:to-red-500/30 rounded-lg shadow-sm">
                  <Users className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-8 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">3</p>
                  )}
                  <p className="text-sm text-muted-foreground">Total Popular</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-6 shadow-lg border border-border/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 dark:from-purple-400/30 dark:to-purple-500/30 rounded-lg shadow-sm">
                  <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  {loading ? (
                    <Skeleton className="h-8 w-8 mb-1" />
                  ) : (
                    <p className="text-2xl font-bold text-foreground">
                      {myBlogsData.filter((post) => post.featured).length}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">Featured</p>
                </div>
              </div>
            </div>
          </div> */}
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            {/* My Blogs */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-foreground">My Published Articles</h2>
                <span className="text-sm text-muted-foreground bg-gradient-to-r from-secondary/20 to-secondary/10 px-3 py-1 rounded-full border border-border/50">
                  {pagination.total} posts
                </span>
              </div>

              {loading ? (
                // Skeleton loading for my blogs
                <div className="grid md:grid-cols-2 gap-8">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bg-card border rounded-xl overflow-hidden">
                      <Skeleton className="h-48 w-full" />
                      <div className="p-6 space-y-3">
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-4 w-16" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : myBlogsData.length > 0 ? (
                <>
                  <div className="grid md:grid-cols-2 gap-8">
                    {myBlogsData.map((post) => (
                      <Link
                        to={`/blog/details/${post.id}`}
                        key={post.id}
                        className="group h-full block"
                      >
                        <BlogCard post={post} />
                      </Link>
                    ))}
                  </div>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <>
                      <div className="flex justify-center items-center mt-8">
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious 
                                onClick={() => paginatedBlogs.prevPage()}
                                className={!paginatedBlogs.canGoPrev ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                            
                            {renderPaginationItems()}
                            
                            <PaginationItem>
                              <PaginationNext 
                                onClick={() => paginatedBlogs.nextPage()}
                                className={!paginatedBlogs.canGoNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                      
                      {/* Results Summary */}
                      <div className="text-center mt-6 text-sm text-muted-foreground">
                        Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of {pagination.total} articles
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-center py-16 bg-gradient-to-r from-secondary/10 to-secondary/5 rounded-xl border border-border">
                  <PenTool className="w-16 h-16 text-muted-foreground/60 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">No blog posts yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start sharing your thoughts and ideas with the world
                  </p>
                  <Link
                    to="/blog/createBlog"
                    className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <Plus className="w-5 h-5" />
                    Write Your First Post
                  </Link>
                </div>
              )}
            </section>
          </div>

          {/* You May Like Posts */}
          <aside>
            <div className="sticky top-24">
              <h2 className="text-2xl font-bold mb-6 text-foreground">Trending in Community</h2>
              <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-xl p-6 shadow-lg border border-border/50 dark:border-gray-700/50">
                <ul className="space-y-6">
                  {allBlogsLoading
                    ? // Skeleton loading for trending posts
                      Array.from({ length: 5 }).map((_, index) => (
                        <li key={index}>
                          <div className="flex items-start space-x-4 p-3 rounded-lg">
                            <Skeleton className="w-16 h-16 rounded-lg" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <Skeleton className="h-3 w-20" />
                              <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                          </div>
                        </li>
                      ))
                    : trendingPosts.map((post) => (
                        <li key={post.id}>
                          <Link
                            to={`/blog/details/${post.id}`}
                            className="flex cursor-pointer items-start space-x-4 p-3 rounded-lg hover:bg-secondary/20 dark:hover:bg-slate-700/50 transition-all duration-300 group border border-transparent hover:border-border/50 hover:shadow-sm"
                          >
                            <img
                              src={
                                (post.featured_image ||
                                  post.imageUrl ||
                                  '/placeholder-blog.svg') as string
                              }
                              alt={post.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-blog.svg';
                              }}
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2">
                                {post.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">By {post.author}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 text-primary px-2 py-1 rounded-full border border-primary/20 shadow-sm">
                                  {post.category}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-border/50">
                  <Link
                    to="/blog/explorer"
                    className="text-primary hover:text-primary/80 font-medium text-sm transition-colors"
                  >
                    View all trending posts →
                  </Link>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default MyBlogs;
