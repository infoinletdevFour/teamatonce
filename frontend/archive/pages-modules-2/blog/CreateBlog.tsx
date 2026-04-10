import React, { useState, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import JoditEditor from 'jodit-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, TrendingUp } from 'lucide-react';
import { useAllBlogs } from '../../hooks/blog/useAllBlogs';
import { useCreateBlog, CreateBlogData } from '../../hooks/useBlog';
import { api } from '../../lib/api';
import { toast } from '../../components/ui/sonner';

const CreateBlog: React.FC = () => {
  const { user } = useAuth();
  const { blogs: samplePosts } = useAllBlogs();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editor = useRef(null);

  const config = useMemo(() => ({
    readonly: false,
    placeholder: 'Start typing your amazing blog content...',
    height: 400,
    minHeight: 400,
    maxHeight: 800,
    width: '100%',
    toolbarSticky: false,
    showCharsCounter: true,
    showWordsCounter: true,
    showXPathInStatusbar: false,
    toolbarAdaptive: true,
    sizeLG: 900,
    sizeMD: 700,
    sizeSM: 400,
    buttons: [
      'bold', 'italic', 'underline', 'strikethrough', '|',
      'fontsize', 'brush', '|',
      'ul', 'ol', '|',
      'outdent', 'indent', '|',
      'align', '|',
      'link', 'image', '|',
      'table', 'hr', '|',
      'undo', 'redo', '|',
      'source', 'preview', 'fullsize'
    ],
    uploader: {
      insertImageAsBase64URI: true
    },
    removeButtons: ['about'],
    theme: 'default',
    style: {
      font: '14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif'
    }
  }), []);

  const createBlogMutation = useCreateBlog();

  const popularPosts = useMemo(
    () => {
      if (!samplePosts || samplePosts.length === 0) {
        console.log('No sample posts available for popular posts');
        return [];
      }
      // Sort by rating (highest first) and take top 7
      const sorted = [...samplePosts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      console.log('Popular posts loaded:', sorted.slice(0, 7).length);
      return sorted.slice(0, 7);
    },
    [samplePosts], // Add samplePosts as dependency
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    console.log('📁 Image selection event:', {
      filesCount: files.length,
      files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    if (files.length > 0) {
      setImages(prevImages => {
        const newImages = [...prevImages, ...files];
        console.log('📸 Updated images state:', {
          previousCount: prevImages.length,
          newCount: newImages.length,
          newFiles: newImages.map(f => f.name)
        });
        return newImages;
      });
      
      // Create previews for new images
      files.forEach((file, index) => {
        console.log(`🖼️ Creating preview for image ${index + 1}: ${file.name}`);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => {
            const newPreviews = [...prev, reader.result as string];
            console.log(`✅ Preview created. Total previews: ${newPreviews.length}`);
            return newPreviews;
          });
        };
        reader.readAsDataURL(file);
      });
    } else {
      console.log('⚠️ No files selected in image input');
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('🚀 Form submission started');
    console.log('📊 Current form state:', {
      title,
      category,
      contentLength: content.length,
      imagesSelected: images.length,
      imagePreviewsCount: imagePreviews.length
    });

    let imageUrls: string[] = [];
    if (images.length > 0) {
      setUploadingImages(true);
      try {
        console.log(`🖼️ Starting upload of ${images.length} images...`);
        console.log('Image files to upload:', images.map(img => ({ name: img.name, size: img.size, type: img.type })));
        setUploadProgress(`Uploading ${images.length} images...`);
        
        // Debug: Check if api.uploadBlogImages method exists
        console.log('API method exists:', typeof api.uploadBlogImages);
        
        // Upload all images at once using the new multi-file API
        const response = await api.uploadBlogImages(images);
        
        console.log('🔍 Raw upload response:', response);
        
        if (response && response.urls && Array.isArray(response.urls)) {
          imageUrls = response.urls;
          console.log('✅ All images uploaded successfully:', imageUrls);
          setUploadProgress('All images uploaded successfully!');
        } else if (response && response.url) {
          // Handle single image response (backward compatibility)
          imageUrls = [response.url];
          console.log('✅ Single image uploaded (legacy response):', imageUrls);
          setUploadProgress('Image uploaded successfully!');
        } else {
          console.error('❌ Invalid response from multi-file upload:', response);
          throw new Error('Invalid response from image upload service');
        }
      } catch (error) {
        console.error('❌ Failed to upload images:', error);
        toast.error(`Failed to upload images: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      } finally {
        setUploadingImages(false);
        setUploadProgress('');
      }
    } else {
      console.log('ℹ️ No images selected, proceeding without image upload');
    }

    const blogData: CreateBlogData = {
      title,
      content,
      category,
      author: user?.name || 'Anonymous',
      status: 'published',
      image_urls: imageUrls.length > 0 ? imageUrls : [],
      featured: false, // Can be updated later if needed
    };

    console.log('📝 Creating blog with data:', {
      ...blogData,
      content: blogData.content.substring(0, 100) + '...' // Truncate content for readability
    });
    console.log('📸 Image URLs being sent:', imageUrls);

    try {
      console.log('🚀 Calling createBlogMutation.mutate...');
      const result = await createBlogMutation.mutate(blogData);
      console.log('✅ Blog created successfully! Result:', result);
      toast.success('Blog post created successfully!');
      navigate('/blog');
    } catch (error) {
      console.error('❌ Failed to create blog post', error);
      toast.error('Failed to create blog post. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-background dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <main className="container bg-gradient-to-r from-primary/10 to-primary/5 mx-auto max-w-7xl px-4 my-16 rounded-xl border border-border py-16">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-2xl shadow-xl border border-border/50 dark:border-gray-700/50 overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-center relative mb-2">
                  <button
                    onClick={() => navigate(-1)}
                    className="absolute left-0 p-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                  <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    Create a New Blog Post
                  </h1>
                </div>
                <p className="text-center text-gray-600 dark:text-gray-400 mb-8">
                  Share your thoughts and ideas with the world.
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label
                        htmlFor="title"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Blog Title
                      </label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter a catchy title"
                        className="w-full"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="category"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Category
                      </label>
                      <Select onValueChange={setCategory} value={category}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="wellness">Wellness</SelectItem>
                          <SelectItem value="travel">Travel</SelectItem>
                          <SelectItem value="food">Food</SelectItem>
                          <SelectItem value="lifestyle">Lifestyle</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="content"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Blog Content
                    </label>
                    <div className="w-full min-h-[450px]">
                      <JoditEditor
                        ref={editor}
                        value={content}
                        config={config}
                        onBlur={newContent => setContent(newContent)}
                        onChange={newContent => {}}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Images ({imagePreviews.length} selected)
                        </label>
                      
                      {/* Upload Area */}
                      <div
                        className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors mb-4"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <div className="text-center">
                          <span className="block">Click to upload images</span>
                          <span className="text-xs">Multiple files allowed</span>
                        </div>
                      </div>
                      
                      {/* Image Previews Grid */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                              />
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Remove image"
                              >
                                ×
                              </button>
                              {index === 0 && (
                                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                                  Featured
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      
                        <Input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          className="hidden"
                          accept="image/*"
                          multiple
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-6 flex flex-col justify-end">
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-right">
                        <p>
                          <strong>Date:</strong>{' '}
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p>
                          <strong>Author:</strong> {user?.name ?? '...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 mt-8">
                    <Button type="button" variant="outline" onClick={() => navigate('/blog')}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createBlogMutation.loading || uploadingImages}>
                      {uploadingImages ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {uploadProgress || 'Uploading images...'}
                        </div>
                      ) : createBlogMutation.loading ? (
                        'Publishing...'
                      ) : (
                        'Publish Post'
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <aside>
            <div className="sticky top-24 space-y-8">
              <div className="bg-gradient-to-br from-white to-gray-50/50 dark:from-slate-800 dark:to-slate-900/80 rounded-2xl shadow-xl border border-border/50 dark:border-gray-700/50 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary rounded-lg">
                      <TrendingUp className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">
                      Popular Posts
                    </h2>
                  </div>
                </div>
                <div className="p-6">
              {popularPosts.length > 0 ? (
                <ul className="space-y-6">
                  {popularPosts.map((post) => (
                    <li key={post.id}>
                      <Link
                        to={`/blog/details/${post.id}`}
                        className="flex cursor-pointer items-start space-x-4"
                      >
                        <img
                          src={
                            (post.featured_image ||
                              post.imageUrl ||
                              '/placeholder-blog.svg') as string
                          }
                          alt={post.title}
                          className="w-20 h-20 rounded-lg object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-blog.svg';
                          }}
                        />
                        <div>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200 hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            By {post.author}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  <p>No popular posts available yet.</p>
                  <p className="mt-2">Posts will appear here once they have ratings.</p>
                </div>
              )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default CreateBlog;
