// src/components/ui/LoadingSpinner.tsx
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[200px]">
      <div className="relative">
        {/* Outer spinning ring */}
        <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-opacity-30 rounded-full animate-spin"></div>
        
        {/* Inner gradient pulse */}
        <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-blue-600 to-blue-500 opacity-80 animate-pulse"></div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
      
      <p className="mt-4 text-sm font-medium text-slate-700">
        Loading<span className="animate-ellipsis">...</span>
      </p>
    </div>
  );
};

// Add this to your global CSS file or a <style> tag in your layout
const styles = `
@keyframes ellipsis {
  0% { content: '.'; }
  33% { content: '..'; }
  66% { content: '...'; }
  100% { content: ''; }
}

.animate-ellipsis::after {
  content: '';
  animation: ellipsis 1.5s infinite;
}
`;

export default LoadingSpinner;