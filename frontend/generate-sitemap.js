/**
 * Dynamic Sitemap Generator for Team@Once
 *
 * Generates a single sitemap.xml with all URLs:
 * - Static pages
 * - Developer profiles
 * - Job postings
 * - Gig listings
 *
 * Run: node generate-sitemap.js
 *
 * Fixes Google Search Console issues by:
 * - Including all dynamic content
 * - Setting proper lastmod dates
 * - Proper priorities and changefreq
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://teamatonce.com';
const API_URL = process.env.VITE_API_URL || 'https://api.teamatonce.com/api/v1';
const OUTPUT_DIR = path.join(__dirname, 'public');

// Helper to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Helper to generate XML sitemap
const generateSitemapXML = (urls) => {
  const urlEntries = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>${url.changefreq || 'weekly'}</changefreq>
    <priority>${url.priority || '0.5'}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries}
</urlset>`;
};

// Fetch data from API with error handling
const fetchAPI = async (endpoint) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);

    if (!response.ok) {
      console.warn(`Warning: Failed to fetch ${endpoint} (${response.status})`);
      return [];
    }

    const json = await response.json();

    // Handle different response structures
    if (json.data) {
      return Array.isArray(json.data) ? json.data : [json.data];
    }

    return Array.isArray(json) ? json : [];
  } catch (error) {
    console.warn(`Warning: Error fetching ${endpoint}:`, error.message);
    return [];
  }
};

// Get all static pages
const getStaticPages = () => {
  const today = formatDate(new Date());

  return [
    { loc: `${BASE_URL}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${BASE_URL}/browse-talent`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/browse-jobs`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/gigs`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/pricing`, lastmod: today, changefreq: 'weekly', priority: '0.8' },

    // Category pages
    { loc: `${BASE_URL}/browse-talent/graphics-design`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/digital-marketing`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/writing-translation`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/video-animation`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/music-audio`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/programming-tech`, lastmod: today, changefreq: 'daily', priority: '0.9' },
    { loc: `${BASE_URL}/browse-talent/business`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/data-analytics`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/photography`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/lifestyle`, lastmod: today, changefreq: 'daily', priority: '0.85' },
    { loc: `${BASE_URL}/browse-talent/ai-services`, lastmod: today, changefreq: 'daily', priority: '0.9' },

    // Auth pages
    { loc: `${BASE_URL}/login`, lastmod: today, changefreq: 'monthly', priority: '0.4' },
    { loc: `${BASE_URL}/signup`, lastmod: today, changefreq: 'monthly', priority: '0.4' },

    // Legal pages
    { loc: `${BASE_URL}/privacy`, lastmod: today, changefreq: 'monthly', priority: '0.3' },
    { loc: `${BASE_URL}/terms`, lastmod: today, changefreq: 'monthly', priority: '0.3' },
  ];
};

// Get developer URLs
const getDeveloperUrls = async () => {
  console.log('Fetching developers...');
  const developers = await fetchAPI('/public/developers');

  if (developers.length === 0) {
    console.warn('No developers found');
    return [];
  }

  const developerUrls = developers.map(dev => ({
    loc: `${BASE_URL}/developer/${dev.id}`,
    lastmod: formatDate(dev.updatedAt || dev.createdAt || new Date()),
    changefreq: 'weekly',
    priority: '0.7'
  }));

  console.log(`Found ${developerUrls.length} developers`);
  return developerUrls;
};

// Get job URLs
const getJobUrls = async () => {
  console.log('Fetching jobs...');
  const jobs = await fetchAPI('/public/jobs');

  if (jobs.length === 0) {
    console.warn('No jobs found');
    return [];
  }

  const jobUrls = jobs.map(job => ({
    loc: `${BASE_URL}/job/${job.id}`,
    lastmod: formatDate(job.updatedAt || job.createdAt || new Date()),
    changefreq: 'daily',
    priority: '0.8'
  }));

  console.log(`Found ${jobUrls.length} jobs`);
  return jobUrls;
};

// Get gig URLs
const getGigUrls = async () => {
  console.log('Fetching gigs...');
  const gigs = await fetchAPI('/public/gigs');

  if (gigs.length === 0) {
    console.warn('No gigs found');
    return [];
  }

  const gigUrls = gigs.map(gig => ({
    loc: `${BASE_URL}/gigs/${gig.id}`,
    lastmod: formatDate(gig.updatedAt || gig.createdAt || new Date()),
    changefreq: 'weekly',
    priority: '0.7'
  }));

  console.log(`Found ${gigUrls.length} gigs`);
  return gigUrls;
};

// Main function
const generateSitemap = async () => {
  console.log('🚀 Starting sitemap generation...\n');

  try {
    // Collect all URLs
    const allUrls = [];

    // Add static pages
    console.log('Adding static pages...');
    const staticPages = getStaticPages();
    allUrls.push(...staticPages);
    console.log(`✓ Added ${staticPages.length} static pages\n`);

    // Add developers
    const developerUrls = await getDeveloperUrls();
    allUrls.push(...developerUrls);
    if (developerUrls.length > 0) {
      console.log('✓ Added developer URLs\n');
    }

    // Add jobs
    const jobUrls = await getJobUrls();
    allUrls.push(...jobUrls);
    if (jobUrls.length > 0) {
      console.log('✓ Added job URLs\n');
    }

    // Add gigs
    const gigUrls = await getGigUrls();
    allUrls.push(...gigUrls);
    if (gigUrls.length > 0) {
      console.log('✓ Added gig URLs\n');
    }

    // Generate single sitemap
    console.log('Generating sitemap.xml...');
    const sitemap = generateSitemapXML(allUrls);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'sitemap.xml'), sitemap);
    console.log('✓ Sitemap generated\n');

    console.log('✅ Sitemap generated successfully!');
    console.log(`\n📊 Total URLs: ${allUrls.length}`);
    console.log(`   - Static pages: ${staticPages.length}`);
    console.log(`   - Developers: ${developerUrls.length}`);
    console.log(`   - Jobs: ${jobUrls.length}`);
    console.log(`   - Gigs: ${gigUrls.length}`);

    console.log('\n📝 Next steps:');
    console.log('1. Upload sitemap.xml to your server');
    console.log('2. Submit https://teamatonce.com/sitemap.xml to Google Search Console');
    console.log('3. Click "Validate Fix" for your Search Console issues');

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
};

// Run the generator
generateSitemap();
