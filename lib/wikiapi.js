import axios from 'axios';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

/**
 * Fetch random wiki pages with images for a specific language
 * @param {number} count - Number of random pages to fetch
 * @param {string} language - Language code (en, es, fr, etc.)
 * @returns {Array} Array of wiki page objects with images
 */
export async function fetchRandomWikiPages(language = 'en', count = 5) {
  // Cache for successful API results to reduce redundant requests
  if (!window.__wikiCache) window.__wikiCache = {};
  
  try {
    // Add a throttling delay to prevent rate limiting (200ms)
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Make the API request with proper headers and timeout
    const response = await axios.get(`https://${language}.wikipedia.org/api/rest_v1/page/random/summary`, {
      params: { format: 'json' },
      headers: {
        'User-Agent': 'WikiTok/1.0 (https://github.com/yourusername/wikitok; your@email.com)',
        'Api-User-Agent': 'WikiTok/1.0'
      },
      timeout: 10000
    });
    
    // Process the page and ensure it has an image
    const page = response.data;
    
    // Store successful responses in cache
    if (!window.__wikiCache[page.pageid]) {
      window.__wikiCache[page.pageid] = page;
    }
    
    // If we need more pages, fetch recursively but with a small delay between requests
    if (count > 1) {
      const rest = await fetchRandomWikiPages(language, count - 1);
      return [page, ...rest];
    }
    
    return [page];
  } catch (error) {
    console.error('Error fetching random Wikipedia page:', error);
    
    // If there's a network error, try again with exponential backoff
    if (error.message === 'Network Error' && count > 0) {
      console.log('Network error, retrying with backoff...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchRandomWikiPages(language, count);
    }
    
    // If all else fails, return an empty array
    return [];
  }
}

/**
 * Get related wiki pages based on a category or topic, ensuring they have images
 * @param {string} title - Title of the current page
 * @param {number} count - Number of related pages to fetch
 * @param {string} language - Language code (en, es, fr, etc.)
 * @returns {Array} Array of related wiki page objects with images
 */
export async function getRelatedPages(title, count = 5, language = 'en') {
  try {
    // First get categories for the page
    const categoryResponse = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        titles: title,
        prop: 'categories',
        cllimit: 5,
        origin: '*'
      }
    });
    
    const pages = Object.values(categoryResponse.data.query.pages);
    if (!pages.length || !pages[0].categories || pages[0].categories.length === 0) {
      return fetchRandomWikiPages(count, language); // Fallback to random if no categories
    }
    
    // Get a random category
    const randomCategory = pages[0].categories[
      Math.floor(Math.random() * pages[0].categories.length)
    ].title.replace('Category:', '');
    
    // Find pages in this category
    const relatedResponse = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        list: 'categorymembers',
        cmtitle: `Category:${randomCategory}`,
        cmlimit: count * 3, // Fetch more to filter
        cmtype: 'page',
        cmnamespace: 0,
        origin: '*'
      }
    });
    
    if (!relatedResponse.data.query || !relatedResponse.data.query.categorymembers) {
      return fetchRandomWikiPages(count, language);
    }
    
    // Get details for these pages including images
    const categoryMembers = relatedResponse.data.query.categorymembers;
    const titles = categoryMembers.map(member => member.title).join('|');
    
    const detailsResponse = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        titles: titles,
        prop: 'extracts|info|pageimages|images',
        exintro: true,
        explaintext: true,
        inprop: 'url',
        piprop: 'thumbnail',
        pithumbsize: 1000,
        imlimit: 5,
        origin: '*'
      }
    });
    
    if (!detailsResponse.data.query || !detailsResponse.data.query.pages) {
      return fetchRandomWikiPages(count, language);
    }
    
    // Filter to pages with images
    const relatedPages = Object.values(detailsResponse.data.query.pages);
    const relatedPagesWithImages = relatedPages.filter(page => 
      (page.thumbnail || (page.images && page.images.length > 0))
    );
    
    // If we don't have enough related pages with images, fetch random ones
    if (relatedPagesWithImages.length < count) {
      const randomPages = await fetchRandomWikiPages(count - relatedPagesWithImages.length, language);
      return [...relatedPagesWithImages, ...randomPages].slice(0, count);
    }
    
    return relatedPagesWithImages.slice(0, count);
  } catch (error) {
    console.error('Error fetching related pages:', error);
    return fetchRandomWikiPages(count, language);
  }
}

/**
 * Extract images for a Wikipedia page
 * @param {number} pageId - Wikipedia page ID
 * @returns {Array} Array of image objects with urls
 */
export async function extractImages(pageId, language = 'en') {
  try {
    const response = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        pageids: pageId,
        prop: 'images',
        imlimit: 15, // Fetch more than we need to filter
        origin: '*'
      }
    });
    
    if (!response.data.query || !response.data.query.pages) {
      return [];
    }
    
    const page = response.data.query.pages[pageId];
    if (!page || !page.images || page.images.length === 0) {
      return [];
    }
    
    // Filter out non-image files and SVGs
    const imageFiles = page.images
      .filter(img => img.title.match(/\.(jpg|jpeg|png|gif)$/i))
      .filter(img => !img.title.includes('Icon') && !img.title.includes('Logo'))
      .slice(0, 10); // Take at most 10 image candidates
    
    if (imageFiles.length === 0) {
      return [];
    }
    
    // Get image info for the filtered images
    const imageTitles = imageFiles.map(img => img.title).join('|');
    const imageInfoResponse = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        titles: imageTitles,
        prop: 'imageinfo',
        iiprop: 'url|size',
        iiurlwidth: 1200, // Request a reasonably large size
        origin: '*'
      }
    });
    
    if (!imageInfoResponse.data.query || !imageInfoResponse.data.query.pages) {
      return [];
    }
    
    // Extract image URLs and filter out small images
    const images = Object.values(imageInfoResponse.data.query.pages)
      .filter(img => img.imageinfo && img.imageinfo[0].width > 300)
      .sort((a, b) => {
        // Sort by image size (larger first)
        const aSize = a.imageinfo[0].width * a.imageinfo[0].height;
        const bSize = b.imageinfo[0].width * b.imageinfo[0].height;
        return bSize - aSize;
      })
      .slice(0, 3) // Take only the top 3
      .map(img => ({
        url: img.imageinfo[0].url,
        alt: img.title.replace('File:', '')
      }));
    
    return images;
  } catch (error) {
    console.error('Error extracting images:', error);
    return [];
  }
}

/**
 * Get a page summary by title
 * @param {string} title - Wikipedia page title
 * @param {string} language - Language code (en, es, fr, etc.)
 * @returns {Object} Page summary object
 */
export async function getPageSummary(title, language = 'en') {
  try {
    // Uses the Wikipedia REST API for summaries
    const response = await axios.get(
      `https://${language}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
      { headers: { 'User-Agent': 'WikiTok/1.0' } }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error fetching page summary:', error);
    return null;
  }
}

/**
 * Search Wikipedia for a query
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @param {string} language - Language code (en, es, fr, etc.)
 * @returns {Array} Search results
 */
export async function searchWiki(query, limit = 5, language = 'en') {
  try {
    const response = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
      params: {
        action: 'query',
        format: 'json',
        list: 'search',
        srsearch: query,
        srlimit: limit,
        srinfo: 'totalhits',
        srprop: 'snippet|titlesnippet',
        origin: '*'
      }
    });
    
    if (!response.data.query || !response.data.query.search) {
      return [];
    }
    
    return response.data.query.search;
  } catch (error) {
    console.error('Error searching wiki:', error);
    return [];
  }
}

/**
 * Get trending or featured wiki articles with images
 * @param {number} limit - Maximum number of articles to fetch
 * @param {string} language - Language code (en, es, fr, etc.)
 * @returns {Array} Featured articles with images
 */
export async function getTrendingArticles(limit = 5, language = 'en') {
  try {
    // Get today's featured article
    const date = new Date();
    const formattedDate = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    
    const response = await axios.get(
      `https://${language}.wikipedia.org/api/rest_v1/feed/featured/${formattedDate}`,
      { headers: { 'User-Agent': 'WikiTok/1.0' } }
    );
    
    if (!response.data || !response.data.tfa) {
      return fetchRandomWikiPages(limit, language);
    }
    
    // Check if featured article has images
    const featuredArticle = response.data.tfa;
    const hasImages = featuredArticle.thumbnail || 
                      (await extractImages(featuredArticle.pageid, language)).length > 0;
    
    let articlesWithImages = [];
    
    if (hasImages) {
      articlesWithImages.push({
        title: featuredArticle.title,
        pageid: featuredArticle.pageid,
        extract: featuredArticle.extract,
        thumbnail: featuredArticle.thumbnail
      });
    }
    
    // Get random pages with images to make up the count
    const randomPages = await fetchRandomWikiPages(limit - articlesWithImages.length, language);
    
    return [...articlesWithImages, ...randomPages];
  } catch (error) {
    console.error('Error fetching trending articles:', error);
    return fetchRandomWikiPages(limit, language);
  }
}

/**
 * Extract images from a Wikipedia page
 * @param {Object} page - Wikipedia page object
 * @returns {Array} - Array of image URLs
 */
export function getThumbnailImages(page) {
  const images = [];
  
  // Get the thumbnail image if available
  if (page.thumbnail && page.thumbnail.source) {
    // Convert to a higher resolution version
    const thumbnailUrl = page.thumbnail.source;
    const highResUrl = thumbnailUrl.replace(/\/\d+px-/, '/800px-');
    images.push(highResUrl);
  }
  
  // Add placeholder image if we have no images
  if (images.length === 0) {
    // Use a high-quality placeholder based on the page title
    const placeholderUrl = `https://source.unsplash.com/800x600/?${encodeURIComponent(page.title || 'wikipedia')}`;
    images.push(placeholderUrl);
  }
  
  return images;
}