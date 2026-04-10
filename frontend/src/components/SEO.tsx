import { useEffect } from 'react';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  noindex?: boolean;
  ogImage?: string;
  ogType?: string;
}

/**
 * SEO Component for managing meta tags, canonical URLs, and Open Graph data
 * Fixes Google Search Console issues: Soft 404 and Duplicate Content
 *
 * Usage:
 * <SEO
 *   title="Browse Talent - Team@Once"
 *   description="Find expert developers"
 *   canonical="https://teamatonce.com/browse-talent"
 *   noindex={hasNoResults}
 * />
 */
export const SEO: React.FC<SEOProps> = ({
  title,
  description,
  canonical,
  noindex = false,
  ogImage,
  ogType = 'website',
}) => {
  useEffect(() => {
    // Set page title
    if (title) {
      document.title = title;
    }

    // Set or update meta description
    if (description) {
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.head.appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', description);
    }

    // Set or update canonical link - CRITICAL for fixing duplicate content
    if (canonical) {
      let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!linkCanonical) {
        linkCanonical = document.createElement('link');
        linkCanonical.setAttribute('rel', 'canonical');
        document.head.appendChild(linkCanonical);
      }
      linkCanonical.setAttribute('href', canonical);
    }

    // Set noindex robots tag - CRITICAL for fixing soft 404 on empty pages
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (noindex) {
      if (!metaRobots) {
        metaRobots = document.createElement('meta');
        metaRobots.setAttribute('name', 'robots');
        document.head.appendChild(metaRobots);
      }
      metaRobots.setAttribute('content', 'noindex, follow');
    } else if (metaRobots) {
      // Remove noindex if it was previously set
      metaRobots.remove();
    }

    // Update Open Graph image
    if (ogImage) {
      let ogImageMeta = document.querySelector('meta[property="og:image"]');
      if (!ogImageMeta) {
        ogImageMeta = document.createElement('meta');
        ogImageMeta.setAttribute('property', 'og:image');
        document.head.appendChild(ogImageMeta);
      }
      ogImageMeta.setAttribute('content', ogImage);
    }

    // Update Open Graph type
    if (ogType) {
      let ogTypeMeta = document.querySelector('meta[property="og:type"]');
      if (!ogTypeMeta) {
        ogTypeMeta = document.createElement('meta');
        ogTypeMeta.setAttribute('property', 'og:type');
        document.head.appendChild(ogTypeMeta);
      }
      ogTypeMeta.setAttribute('content', ogType);
    }

    // Update Open Graph title
    if (title) {
      let ogTitleMeta = document.querySelector('meta[property="og:title"]');
      if (!ogTitleMeta) {
        ogTitleMeta = document.createElement('meta');
        ogTitleMeta.setAttribute('property', 'og:title');
        document.head.appendChild(ogTitleMeta);
      }
      ogTitleMeta.setAttribute('content', title);
    }

    // Update Open Graph description
    if (description) {
      let ogDescMeta = document.querySelector('meta[property="og:description"]');
      if (!ogDescMeta) {
        ogDescMeta = document.createElement('meta');
        ogDescMeta.setAttribute('property', 'og:description');
        document.head.appendChild(ogDescMeta);
      }
      ogDescMeta.setAttribute('content', description);
    }

    // Cleanup function
    return () => {
      // We don't remove the tags on unmount because the next page will set them
      // This prevents flickering and maintains SEO meta tags
    };
  }, [title, description, canonical, noindex, ogImage, ogType]);

  // This component doesn't render anything
  return null;
};
