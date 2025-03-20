import { useEffect, useState } from 'react';
import { FaHeart } from 'react-icons/fa';

export default function LikeAnimation({ x, y }) {
  return (
    <div 
      className="fixed pointer-events-none z-50"
      style={{ 
        left: x ? `${x}px` : '50%',
        top: y ? `${y}px` : '50%',
        transform: x && y ? 'translate(-50%, -50%)' : 'translate(-50%, -50%)'
      }}
    >
      <FaHeart 
        className="text-red-500 transform animate-heartbeat" 
        style={{ fontSize: '7rem', opacity: 0.9 }}
      />
    </div>
  );
} 