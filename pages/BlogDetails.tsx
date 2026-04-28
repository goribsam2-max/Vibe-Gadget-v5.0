import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Blog } from '../types';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import { useNotify } from '../components/Notifications';
import Markdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { motion } from 'framer-motion';

const BlogDetails: React.FC = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [pillProducts, setPillProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBlog = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const q = query(collection(db, 'blogs'), where('slug', '==', slug), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
           const bData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Blog;
           setBlog(bData);
           
           // Fetch product pills content
           const pIds = Array.from(bData.content.matchAll(/\[\[product:([A-Za-z0-9_-]+)\]\]/g)).map(m => m[1]);
           if (pIds.length > 0) {
              const fetchedProds: Record<string, any> = {};
              await Promise.all(pIds.map(async (pid) => {
                 const pdoc = await getDoc(doc(db, 'products', pid));
                 if (pdoc.exists()) fetchedProds[pid] = { id: pdoc.id, ...pdoc.data() };
              }));
              setPillProducts(fetchedProds);
           }
        }

        const qRecent = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(4));
        const snapRecent = await getDocs(qRecent);
        setRecentBlogs(snapRecent.docs.map(d => ({ id: d.id, ...d.data() } as Blog)).filter(b => b.slug !== slug).slice(0, 3));

      } catch (e) {}
      setLoading(false);
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border-t-transparent rounded-full"><div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!blog) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 dark:bg-zinc-800">
         <Icon name="newspaper" className="text-6xl text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 mb-6" />
         <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 dark:text-zinc-50 mb-2">Article Not Found</h2>
         <p className="text-sm text-zinc-500 mb-8 max-w-sm">The article you are looking for does not exist or has been removed.</p>
         <button onClick={() => navigate('/blog')} className="px-6 py-3 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg hover:bg-zinc-800 transition-colors">Back to Blog</button>
      </div>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Article",
    "headline": blog.title,
    "image": [blog.image],
    "datePublished": new Date(blog.createdAt).toISOString(),
    "description": blog.excerpt,
    "author": [{ "@type": "Organization", "name": "VibeGadget" }]
  };

  const processedContent = blog.content.replace(/\[\[product:([A-Za-z0-9_-]+)\]\]/g, '[PILL](prod://$1)');

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-800 pb-32">
       <SEO title={`${blog.seoTitle || blog.title} | VibeGadget`} description={blog.seoDescription || blog.excerpt} image={blog.metaImage || blog.image} jsonLd={jsonLd} />
       
       <div className="w-full h-[40vh] md:h-[60vh] relative overflow-hidden bg-zinc-900 dark:bg-zinc-50 dark:text-black flex items-end">
          <img src={blog.image} className="absolute inset-0 w-full h-full object-cover opacity-60" alt={blog.title} />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          
          <button onClick={() => navigate('/blog')} className="absolute top-8 left-6 md:left-12 z-20 w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/40 backdrop-blur-md rounded-full text-zinc-900 dark:text-white border border-zinc-200 dark:border-white/20 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors shadow-lg active:scale-95"><Icon name="arrow-left" /></button>
          
          <div className="relative z-10 p-6 md:p-12 md:pb-16 max-w-4xl w-full mx-auto">
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
               <p className="text-[10px] text-white font-bold uppercase tracking-widest mb-4 inline-block px-3 py-1 bg-black/40 backdrop-blur-sm rounded-full border border-white/20">{new Date(blog.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
               <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter leading-[1.1] drop-shadow-lg">{blog.title}</h1>
             </motion.div>
          </div>
       </div>

       <div className="max-w-4xl w-full mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">
          <article className="prose prose-zinc dark:prose-invert prose-lg md:prose-xl max-w-none">
             <div className="markdown-body text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
               <Markdown 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                     a: ({node, ...props}) => {
                        if (props.href?.startsWith('prod://')) {
                           const pid = props.href.replace('prod://', '');
                           const p = pillProducts[pid];
                           if (!p) return null;
                           return (
                             <Link to={`/product/${pid}`} className="not-prose flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-3xl hover:border-emerald-500 transition-colors shadow-sm my-6 cursor-pointer group no-underline">
                                <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-2 shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:scale-105 transition-transform"><img src={p.image} className="w-full h-full object-contain" /></div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 dark:text-zinc-50 truncate">{p.name}</h4>
                                  <p className="text-[10px] uppercase font-bold text-emerald-600 tracking-widest mb-1">{p.category}</p>
                                  <p className="text-lg font-black text-zinc-800 dark:text-zinc-200">৳{p.isOffer ? p.offerPrice : p.price}</p>
                                </div>
                                <div className="hidden md:flex w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 items-center justify-center -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shrink-0">
                                   <Icon name="arrow-right" />
                                </div>
                             </Link>
                           );
                        }
                        return <a {...props} className="text-emerald-600 dark:text-emerald-400 no-underline border-b-2 border-emerald-600/30 hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-colors" target="_blank" rel="noopener noreferrer" />;
                     },
                     img: ({node, ...props}) => (
                        <span className="not-prose block my-8">
                           <img {...props} className="w-full rounded-3xl shadow-lg border border-zinc-100 dark:border-zinc-800" />
                        </span>
                     ),
                     p: ({node, ...props}) => <p {...props} className="mb-6 whitespace-pre-wrap" />
                  }}
               >{processedContent}</Markdown>
             </div>
             
             <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 flex items-center justify-between">
                <div>
                   <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Share this article</h4>
                   <div className="flex space-x-2">
                       <button onClick={() => { navigator.clipboard.writeText(window.location.href); notify("Link copied to clipboard!", "success"); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"><Icon name="link" /></button>
                       <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noreferrer" className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"><Icon name="twitter" /></a>
                   </div>
                </div>
             </div>
          </article>
          
          <aside>
             <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-6 border-b border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 pb-2">Recent Posts</h3>
             <div className="space-y-6">
                {recentBlogs.map(rb => (
                   <Link to={`/blog/${rb.slug}`} key={rb.id} className="group block">
                      <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-2xl overflow-hidden mb-3">
                         <img src={rb.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={rb.title} />
                      </div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-emerald-600 transition-colors">{rb.title}</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-2">{new Date(rb.createdAt).toLocaleDateString()}</p>
                   </Link>
                ))}
             </div>
          </aside>
       </div>
    </div>
  );
};
export default BlogDetails;
