import axios from 'axios';

const WIKI_API_URL = 'https://en.wikipedia.org/w/api.php';

export default async function handler(req, res) {
  const { ids } = req.query;
  
  if (!ids) {
    return res.status(400).json({ error: 'Page IDs are required' });
  }
  
  try {
    const response = await axios.get(WIKI_API_URL, {
      params: {
        action: 'query',
        format: 'json',
        pageids: ids,
        prop: 'extracts|info',
        exintro: true,
        explaintext: true,
        inprop: 'url',
        origin: '*'
      }
    });
    
    if (!response.data.query || !response.data.query.pages) {
      return res.status(404).json({ error: 'No pages found' });
    }
    
    const pages = Object.values(response.data.query.pages);
    
    return res.status(200).json({ pages });
  } catch (error) {
    console.error('Error fetching liked pages:', error);
    return res.status(500).json({ error: 'Failed to fetch page data' });
  }
}