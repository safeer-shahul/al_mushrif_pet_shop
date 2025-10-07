// src/components/ui/LoadingSpinner.tsx

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-12 h-12 border-4 border-t-4 border-blue-500 border-gray-200 rounded-full animate-spin"></div>
      <p className="ml-4 text-lg text-gray-700">Loading...</p>
    </div>
  );
};

export default LoadingSpinner;