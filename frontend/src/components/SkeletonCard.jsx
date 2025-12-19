import React from 'react';

const SkeletonCard = () => {
  return (
    <div className="bg-gray-900 border border-gray-800 p-5 rounded-xl flex flex-col gap-4 animate-pulse">
      {/* Top Row: Icon + Text Lines */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 w-full">
          {/* Icon Box */}
          <div className="w-10 h-10 bg-gray-800 rounded-lg"></div>
          
          <div className="flex-1 space-y-2">
            {/* Title Line */}
            <div className="h-4 bg-gray-800 rounded w-3/4"></div>
            {/* Subtitle Line */}
            <div className="h-3 bg-gray-800 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Date + Badge */}
      <div className="flex items-center justify-between mt-2 pt-3 border-t border-gray-800">
        <div className="h-3 bg-gray-800 rounded w-1/4"></div>
        <div className="h-5 bg-gray-800 rounded-full w-16"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;