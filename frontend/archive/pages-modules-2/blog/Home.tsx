import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Star, TrendingUp, Clock, Award, ArrowRight, Eye, Heart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import Hero from '../../components/blog/Hero';
import BlogCard from '../../components/blog/BlogCard';
import { useAllBlogs } from '../../hooks/blog/useAllBlogs';


const Home: React.FC = () => {
  const { blogs: samplePosts, loading, error } = useAllBlogs();

  const popularPosts = useMemo(
    () => [...samplePosts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4),
    [samplePosts],
  );

  const featuredPosts = useMemo(
    () => samplePosts.filter((p) => p.featured).slice(0, 4),
    [samplePosts],
  );

  const latestPosts = useMemo(
    () =>
      [...samplePosts]
        .sort(
          (a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime(),
        )
        .slice(0, 5),
    [samplePosts],
  );

  const stats = {
    totalPosts: samplePosts.length,
    totalViews: '125K',
    totalReads: '89K',
    averageRating: samplePosts.length > 0 ? (
      samplePosts.reduce((acc, post) => acc + (post.rating || 0), 0) / samplePosts.length
    ).toFixed(1) : '0.0',
  };

  return (
    <div className="min-h-screen bg-background dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero Section */}
      <Hero />

      {/* Stats Section */}
      {/* <section className="py-12 bg-gradient-to-r from-primary/10 to-primary/5 border-y border border-border rounded-xl">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-200/70 dark:bg-blue-900/50 rounded-xl shadow-md mb-3">
                <TrendingUp className="w-6 h-6 text-blue-700 dark:text-blue-400" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Articles</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-200/70 dark:bg-green-900/50 rounded-xl shadow-md mb-3">
                <Eye className="w-6 h-6 text-green-700 dark:text-green-400" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalViews}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Views</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-pink-200/70 dark:bg-pink-900/50 rounded-xl shadow-md mb-3">
                <Heart className="w-6 h-6 text-pink-700 dark:text-pink-400" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.totalReads}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Reads</div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-200/70 dark:bg-yellow-900/50 rounded-xl shadow-md mb-3">
                <Star className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
              </div>
              <div className="text-2xl font-extrabold text-gray-900 dark:text-white">
                {stats.averageRating}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
            </div>
          </div>
        </div>
      </section> */}

      <main className="container  bg-gradient-to-r from-primary/10 to-primary/5  mx-auto max-w-7xl px-4 my-16 rounded-xl border border-border py-16">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-16">
            {/* Popular Posts */}
            <section>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary rounded-lg shadow-md">
                    <TrendingUp className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      Most Popular
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      Reader favorites and trending content
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" asChild>
                    <Link
                      to="/blog/explorer?type=popular"
                      className="group flex items-center gap-2"
                    >
                      Explore Popular
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {loading ? (
                  // Skeleton loading for popular posts
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="relative group">
                      <div className="bg-card border rounded-lg overflow-hidden">
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
                    </div>
                  ))
                ) : (
                  popularPosts.map((post, index) => (
                    <div key={post.id} className="relative group">
                      <div className="absolute -top-2 -left-2 z-10 bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                        #{index + 1}
                      </div>
                      <Link to={`/blog/details/${post.id}`} className="block h-full">
                        <BlogCard post={post} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Featured Posts */}
            <section>
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary rounded-lg shadow-md">
                    <Award className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
                      Editor's Choice
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">Handpicked premium content</p>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link
                    to="/blog/explorer?type=featured"
                    className="group flex items-center gap-2"
                  >
                    Explore Featured
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {loading ? (
                  // Skeleton loading for featured posts
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="relative group">
                      <div className="bg-card border rounded-lg overflow-hidden">
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
                    </div>
                  ))
                ) : (
                  featuredPosts.map((post) => (
                    <div key={post.id} className="relative group">
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </div>
                      <Link to={`/blog/details/${post.id}`} className="block h-full">
                        <BlogCard post={post} />
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="sticky top-24 space-y-8">
              <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-2xl shadow-xl border border-border/50 dark:border-gray-700/50 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <Clock className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Latest Updates
                    </h2>
                  </div>
                </div>
                <div className="p-6">
                  <ul className="space-y-6">
                    {loading ? (
                      // Skeleton loading for latest posts
                      Array.from({ length: 5 }).map((_, index) => (
                        <li key={index}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-white to-gray-50/30 dark:from-slate-700 dark:to-slate-800/50 border border-border/30 dark:border-gray-600/30 shadow-sm">
                            <Skeleton className="w-full sm:w-24 h-40 sm:h-20 rounded-xl" />
                            <div className="flex-1 min-w-0 mt-3 sm:mt-0 space-y-2">
                              <Skeleton className="h-5 w-3/4" />
                              <div className="flex items-center justify-between">
                                <Skeleton className="h-3 w-20" />
                                <div className="flex items-center gap-1">
                                  <Skeleton className="h-3 w-3 rounded-full" />
                                  <Skeleton className="h-3 w-8" />
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Skeleton className="h-5 w-16 rounded-full" />
                                <Skeleton className="h-3 w-12" />
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    ) : (
                      latestPosts.map((post, index) => (
                        <li key={post.id}>
                          <Link
                            to={`/blog/details/${post.id}`}
                            className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-xl bg-gradient-to-br from-white to-gray-50/30 dark:from-slate-700 dark:to-slate-800/50 border border-border/30 dark:border-gray-600/30 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group backdrop-blur-sm"
                          >
                          {/* Blog Thumbnail */}
                          <div className="relative w-full sm:w-24 h-40 sm:h-20 flex-shrink-0">
                            <img
                              src={
                                (post.featured_image ||
                                  post.imageUrl ||
                                  '/placeholder-blog.svg') as string
                              }
                              alt={post.title}
                              className="w-full h-full rounded-xl object-cover group-hover:scale-105 transition-transform duration-300 shadow-md"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-blog.svg';
                              }}
                            />
                            <div className="absolute -top-1 -right-1 bg-gradient-to-r from-emerald-500 to-blue-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-white/20">
                              {index + 1}
                            </div>
                          </div>

                          {/* Blog Content */}
                          <div className="flex-1 min-w-0 mt-3 sm:mt-0">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-sm sm:text-base group-hover:text-primary dark:group-hover:text-primary-foreground transition-colors line-clamp-2 mb-2">
                              {post.title}
                            </h3>

                            <div className="flex flex-wrap items-center justify-between text-xs">
                              <p className="text-gray-500 dark:text-gray-400 italic">
                                By {post.author}
                              </p>
                              <div className="flex items-center gap-1 mt-1 sm:mt-0">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-current" />
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                  {post.rating}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center flex-wrap gap-2 mt-2">
                              <span className="text-xs bg-gradient-to-r from-primary/20 to-primary/10 dark:from-primary/30 dark:to-primary/20 text-primary dark:text-primary-foreground px-2 py-0.5 rounded-full font-medium shadow-sm border border-primary/20 dark:border-primary/30">
                                {post.category}
                              </span>
                              <span className="text-xs text-gray-400">
                                {post.createdAt &&
                                  new Date(post.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                              </span>
                            </div>
                            </div>
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>

                  <div className="mt-6 pt-4 border-t border-border space-y-3">
                    <Button asChild className="w-full">
                      <Link
                        to="/blog/explorer?type=latest"
                        className="flex items-center justify-center gap-2 group"
                      >
                        <Clock className="w-4 h-4" />
                        Latest Posts
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button variant="outline" asChild className="w-full">
                      <Link
                        to="/blog/explorer"
                        className="flex items-center justify-center gap-2 group"
                      >
                        Explore All Blogs
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default Home;
