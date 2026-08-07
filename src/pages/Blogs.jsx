import { useEffect, useState } from 'react';
import api from '../api/client';
import NotConfigured from '../components/NotConfigured';
import LoadingBlock from '../components/LoadingBlock';

function BlogCard({ blog }) {
  const images = blog.images || [];
  return (
    <article className="bg-white dark:bg-neutral-900 dark:border dark:border-neutral-800 rounded-2xl shadow-sm dark:shadow-none overflow-hidden">
      {images.length > 0 && (
        <div className={`grid gap-0.5 ${images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {images.slice(0, 4).map((img, i) => (
            <img key={i} src={img} alt={`${blog.subject} ${i + 1}`} className="w-full h-40 object-cover" />
          ))}
        </div>
      )}
      <div className="p-5">
        <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-2">{blog.subject}</h3>
        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{blog.message}</p>
      </div>
    </article>
  );
}

export default function Blogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/blogs')
      .then((res) => setBlogs(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <LoadingBlock className="py-16" />
      </div>
    );
  }

  if (blogs.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <NotConfigured height="h-64" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
      <h2 className="text-xl font-bold text-wa-green-dark dark:text-wa-green">Blogs</h2>
      {blogs.map((blog) => (
        <BlogCard key={blog.id} blog={blog} />
      ))}
    </div>
  );
}
