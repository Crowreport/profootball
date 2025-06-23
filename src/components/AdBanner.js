// AdBanner component for different ad placements
export function TopBannerAd() {
  return (
    <div className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-center h-20 bg-gray-200 rounded">
        <div className="text-center">
          <p className="text-gray-600 font-semibold">Advertisement</p>
          <p className="text-sm text-gray-500">728 x 90 Banner</p>
        </div>
      </div>
    </div>
  );
}

export function SidebarAd({ size = "medium" }) {
  const heights = {
    small: "h-32",
    medium: "h-64", 
    large: "h-80"
  };

  const adSizes = {
    small: "300 x 125",
    medium: "300 x 250",
    large: "300 x 320"
  };

  return (
    <div className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 mb-3">
      <div className={`flex items-center justify-center ${heights[size]} bg-gray-200 rounded`}>
        <div className="text-center">
          <p className="text-gray-600 font-semibold">Advertisement</p>
          <p className="text-sm text-gray-500">{adSizes[size]}</p>
        </div>
      </div>
    </div>
  );
}

export function InContentAd() {
  return (
    <div className="w-full bg-gray-100 border border-gray-300 rounded-lg p-3 my-4">
      <div className="flex items-center justify-center h-24 bg-gray-200 rounded">
        <div className="text-center">
          <p className="text-gray-600 font-semibold">Advertisement</p>
          <p className="text-sm text-gray-500">Responsive Banner</p>
        </div>
      </div>
    </div>
  );
} 