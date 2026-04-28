import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Blog } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import SEO from '../components/SEO';

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if current user is admin
    const checkAdmin = async () => {
      import('../firebase').then(({ auth, db }) => {
        import('firebase/auth').then(({ onAuthStateChanged }) => {
          onAuthStateChanged(auth, async (user) => {
             if (user) {
                import('firebase/firestore').then(async ({ doc, getDoc }) => {
                   const udoc = await getDoc(doc(db, 'users', user.uid));
                   if (udoc.exists() && (udoc.data().role === 'admin' || udoc.data().role === 'staff' || udoc.data().email === 'admin@vibe.shop')) {
                      setIsAdmin(true);
                   }
                });
             }
          });
        });
      });
    };
    checkAdmin();

    const q = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
       setBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Blog)));
       setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-800 pb-32">
      <SEO title="Tech Blog & Gadget Reviews | VibeGadget" description="Read our latest top 5 gadget lists, tech tips, and product reviews." />
      
      <div className="bg-[#06331e] text-white p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20 z-0"></div>
        <div className="relative z-10 max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/10 rounded-full mb-6 hover:bg-zinc-50 dark:bg-zinc-900/20 transition-colors"><Icon name="arrow-left" /></button>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">Tech Insights & Hacks</h1>
          <p className="text-emerald-50 max-w-2xl text-sm md:text-base leading-relaxed opacity-90">Stay updated with our latest gadgets review, tips to extend your battery life, smart home tutorials, and more.</p>
          
          {isAdmin && (
             <button onClick={() => navigate('/blog/create')} className="mt-8 bg-zinc-50 dark:bg-zinc-800 text-[#06331e] px-6 py-3 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-zinc-100 dark:bg-zinc-800 transition-colors shadow-lg flex items-center space-x-2 relative z-20">
               <Icon name="plus" /><span>Create New Blog Post</span>
             </button>
          )}
        </div>
        <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 pointer-events-none"><Icon name="newspaper" /></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 grid gap-8">
        {loading ? (
           <div className="flex justify-center p-20"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
           blogs.map((blog) => (
             <div key={blog.id} className="group grid md:grid-cols-3 gap-6 bg-white dark:bg-zinc-900 p-4 md:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-all shadow-sm relative">
                {isAdmin && (
                   <div className="absolute top-4 right-4 z-20 flex gap-2">
                     <button onClick={(e) => { e.preventDefault(); navigate(`/blog/edit/${blog.slug}`); }} className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-emerald-600 transition-colors">
                       <Icon name="edit" />
                     </button>
                     <button onClick={async (e) => { 
                         e.preventDefault(); 
                         if (window.confirm('Delete this blog post?')) {
                             const { deleteDoc, doc } = await import('firebase/firestore');
                             await deleteDoc(doc(db, 'blogs', blog.id));
                         }
                     }} className="bg-white dark:bg-zinc-800 p-2 rounded-lg shadow-md border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-red-500 transition-colors">
                       <Icon name="trash" />
                     </button>
                   </div>
                )}
                <Link to={`/blog/${blog.slug}`} className="col-span-1 aspect-[4/3] md:aspect-auto md:h-full bg-zinc-200 rounded-2xl overflow-hidden relative shadow-inner block">
                   <img src={blog.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={blog.title} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                </Link>
                <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                   <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-3">{new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                   <Link to={`/blog/${blog.slug}`}>
                     <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-3 group-hover:text-emerald-600 transition-colors">{blog.title}</h2>
                     <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium line-clamp-2 md:line-clamp-3">{blog.excerpt}</p>
                   </Link>
                   <Link to={`/blog/${blog.slug}`} className="mt-6 flex items-center text-[10px] uppercase font-black tracking-widest text-zinc-900 dark:text-emerald-500 group-hover:text-emerald-600 group-hover:translate-x-2 transition-all w-fit">
                      Read Article <Icon name="arrow-right" className="ml-2" />
                   </Link>
                </div>
             </div>
           ))
        )}
      </div>
    </div>
  );
};
export default BlogList;
