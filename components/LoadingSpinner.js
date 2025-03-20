import React from 'react';

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-full w-full bg-wikitok-dark">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
}