import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Search, X, type LucideIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import Header from '../components/landing/Header';
import Footer from '../components/landing/Footer';
import { Input } from '../components/ui/input';
import { useBlogPosts } from '../hooks/useBlog';
import { BlogPost } from '../types/blog';

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const navItems: NavItem[] = [
  { icon: Home, label: ' Home', path: '/blog' },
  { icon: User, label: 'My Blogs', path: '/blog/my-blogs' },
];

const FitnessLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search API call - only when searchQuery is set
  const { data: searchResults, loading: searchLoading, refetch: refetchSearch } = useBlogPosts(
    searchQuery ? {
      search: searchQuery,
      published: true,
    } : undefined,
    { 
      initialLimit: 10,
      enabled: !!searchQuery
    }
  );

  // Force refetch when searchQuery changes
  useEffect(() => {
    if (searchQuery && refetchSearch) {
      refetchSearch();
    }
  }, [searchQuery, refetchSearch]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
  };

  const handleSearch = async () => {
    if (searchTerm.trim()) {
      const trimmedQuery = searchTerm.trim();
      setSearchQuery(trimmedQuery);
      setIsSearchOpen(true);
      
      // Force a refetch if we have the refetch function and this is a repeated search
      if (refetchSearch && searchQuery === trimmedQuery) {
        await refetchSearch();
      }
    } else {
      setSearchQuery('');
      setIsSearchOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSearchResultClick = (blog: BlogPost) => {
    navigate(`/blog/details/${blog.id}`);
    setSearchTerm('');
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Navigation */}
      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-8 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 py-4 px-1 border-b-2 text-sm font-medium whitespace-nowrap transition-colors',
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted',
                    )}
                  >
                    <IconComponent className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Search Component */}
            <div className="relative ml-4" ref={searchRef}>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search blogs..."
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    onKeyPress={handleKeyPress}
                    className="pl-10 pr-10 w-64"
                  />
                  {searchTerm && (
                    <button
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  onClick={handleSearch}
                  disabled={!searchTerm.trim()}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                >
                  <Search className="h-4 w-4" />
                  Search
                </button>
              </div>

              {/* Search Results Dropdown */}
              {isSearchOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto min-w-96">
                  {searchLoading ? (
                    <div className="p-4 text-center text-muted-foreground flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="ml-2 text-sm">Searching for "{searchQuery}"...</span>
                    </div>
                  ) : searchResults?.data && searchResults.data.length > 0 ? (
                    <>
                      <div className="p-3 border-b bg-muted/30">
                        <span className="text-sm font-medium text-muted-foreground">
                          Found {searchResults.total} results for "{searchQuery}"
                        </span>
                      </div>
                      {searchResults.data.map((blog) => (
                        <div
                          key={blog.id}
                          onClick={() => handleSearchResultClick(blog)}
                          className="p-4 hover:bg-muted cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <h3 className="font-medium text-sm line-clamp-1 mb-1">
                            {blog.title}
                          </h3>
                          {blog.excerpt && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {blog.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            {blog.category && (
                              <span className="px-2 py-1 bg-muted rounded text-xs">
                                {blog.category}
                              </span>
                            )}
                            <span>by {blog.author}</span>
                          </div>
                        </div>
                      ))}
                      {searchResults.total > 10 && (
                        <div className="p-3 text-center border-t bg-muted/50">
                          <span className="text-xs text-muted-foreground">
                            Showing top 10 results of {searchResults.total}
                          </span>
                        </div>
                      )}
                    </>
                  ) : searchQuery && !searchLoading ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No blogs found for "{searchQuery}"
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default FitnessLayout;
