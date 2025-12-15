const BlogCard = () => {
  return (
    <div className="bg-white shadow-lg rounded-lg p-4">
      <div className="mb-4 overflow-hidden rounded-lg aspect-video">
        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-2xl font-bold mb-2">📰</div>
            <div className="text-sm">Blog Image</div>
          </div>
        </div>
      </div>
      <h2 className="text-xl font-bold text-black mb-1">Letter From the Editor</h2>
      <p className="text-gray-800 text-sm line-clamp-4">
        In this week&apos;s letter, we reflect on the shifting narratives surrounding the NFL&apos;s preseason and how team dynamics are evolving. Stay tuned for deeper insights and exclusive commentary.
      </p>
    </div>
  );
};

export default BlogCard;
