import { useState } from 'react';
import { FaHeart } from 'react-icons/fa';
import LikedPagesSidebar from './LikedPagesSidebar';

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <>
      {/* Logo */}
      <div className="fixed top-4 left-4 z-[1000] flex items-center">
        <span className="text-white font-bold text-xl">WikiTok</span>
      </div>
      
      {/* Sidebar trigger */}
      <button 
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 right-4 z-[1000] bg-gray-800 bg-opacity-50 p-2 rounded-full"
      >
        <FaHeart className="text-red-500 text-xl" />
      </button>
      
      {/* Main content */}
      <main className="relative min-h-screen w-full">
        {children}
      </main>
      
      {/* Sidebar */}
      <LikedPagesSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />
    </>
  );
}
