import { useState, useEffect, useRef } from 'react';
import { getAllLikes, removeLike } from '../lib/storage';
import { FaTimes, FaSearch, FaTrash, FaImage } from 'react-icons/fa';
import axios from 'axios';

export default function LikedPagesSidebar({ isOpen, onClose, language = 'en' }) {
  const [likedPageIds, setLikedPageIds] = useState([]);
  const [likedPagesData, setLikedPagesData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPages, setFilteredPages] = useState([]);
  const overlayRef = useRef(null);
  const sidebarRef = useRef(null);
  
  useEffect(() => {
    if (isOpen) {
      // Get liked page IDs from localStorage
      const ids = getAllLikes();
      setLikedPageIds(ids);
      
      if (ids.length > 0) {
        fetchLikedPagesData(ids);
      }
    }
  }, [isOpen]);
  
  useEffect(() => {
    // Filter pages based on search term
    if (searchTerm.trim() === '') {
      setFilteredPages(likedPagesData);
    } else {
      const term = searchTerm.toLowerCase();
      setFilteredPages(likedPagesData.filter(page => 
        page.title.toLowerCase().includes(term) || 
        (page.extract && page.extract.toLowerCase().includes(term))
      ));
    }
  }, [searchTerm, likedPagesData]);
  
  const fetchLikedPagesData = async (ids) => {
    setLoading(true);
    
    try {
      // Fetch page details from Wikipedia API with language parameter
      const response = await axios.get(`https://${language}.wikipedia.org/w/api.php`, {
        params: {
          action: 'query',
          format: 'json',
          pageids: ids.join('|'),
          prop: 'extracts|info|pageimages',
          exintro: true,
          explaintext: true,
          inprop: 'url',
          piprop: 'thumbnail',
          pithumbsize: 100,
          origin: '*'
        }
      });
      
      if (response.data.query && response.data.query.pages) {
        setLikedPagesData(Object.values(response.data.query.pages));
        setFilteredPages(Object.values(response.data.query.pages));
      }
    } catch (error) {
      console.error('Error fetching liked pages data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRemoveLike = (pageId, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Remove the like from storage
    removeLike(pageId);
    
    // Dispatch a custom event to notify other components
    const event = new CustomEvent('likeStatusChanged', { detail: { pageId, liked: false } });
    window.dispatchEvent(event);
    
    // Update the UI
    setLikedPageIds(likedPageIds.filter(id => id !== pageId.toString()));
    setLikedPagesData(likedPagesData.filter(page => page.pageid !== pageId));
    setFilteredPages(filteredPages.filter(page => page.pageid !== pageId));
  };
  
  // Use useEffect to detect clicks outside the sidebar
  useEffect(() => {
    function handleClickOutside(event) {
      if (isOpen && event.target.classList.contains('sidebar-backdrop')) {
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Overlay with pointer events but NO background */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={onClose}
          style={{ background: 'transparent' }}
        />
      )}
      
      {/* Sidebar itself - only this has a background */}
      <div 
        className={`fixed right-0 top-0 bottom-0 z-50 w-full sm:max-w-md bg-wikitok-dark shadow-lg transform transition-transform duration-300 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full overflow-y-auto p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Liked Pages</h2>
            <button onClick={onClose} className="p-1 text-white">
              <FaTimes />
            </button>
          </div>
          
          {/* Search input */}
          <div className="mb-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search liked pages..."
              className="bg-gray-800 text-white w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin h-6 w-6 border-2 border-white rounded-full border-t-transparent"></div>
            </div>
          ) : likedPageIds.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No liked pages yet</p>
          ) : filteredPages.length === 0 ? (
            <p className="text-center py-8 text-gray-400">No pages match your search</p>
          ) : (
            <ul className="space-y-3">
              {filteredPages.map(page => (
                <li key={page.pageid} className="border-b border-gray-700 pb-2">
                  <div className="flex items-start">
                    <div className="mr-3 w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                      {page.thumbnail ? (
                        <img 
                          src={page.thumbnail.source} 
                          alt={page.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <FaImage className="text-gray-600" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <a 
                        href={`https://${language}.wikipedia.org/wiki/${encodeURIComponent(page.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block hover:bg-gray-700 p-2 rounded"
                      >
                        <h3 className="font-medium">{page.title}</h3>
                        {page.extract && (
                          <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                            {page.extract.substring(0, 100)}...
                          </p>
                        )}
                      </a>
                    </div>
                    
                    <button 
                      onClick={(e) => handleRemoveLike(page.pageid, e)}
                      className="p-2 text-red-400 hover:text-red-300 flex-shrink-0"
                      title="Remove from likes"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}