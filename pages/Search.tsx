import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import Icon from '../components/Icon';

const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [recent, setRecent] = useState<string[]>(JSON.parse(localStorage.getItem('vibe_recent_searches') || '[]'));
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  useEffect(() => {
    const q = collection(db, 'products');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAllProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setResults([]);
      return;
    }
    const filtered = allProducts.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filtered);
  }, [searchTerm, allProducts]);

  const saveSearch = (term: string) => {
    if (!term.trim()) return;
    const updated = [term, ...recent.filter(r => r !== term)].slice(0, 5);
    setRecent(updated);
    localStorage.setItem('vibe_recent_searches', JSON.stringify(updated));
  };

  const removeRecent = (term: string) => {
    const updated = recent.filter(r => r !== term);
    setRecent(updated);
    localStorage.setItem('vibe_recent_searches', JSON.stringify(updated));
  };

  const clearAll = () => {
    setRecent([]);
    localStorage.removeItem('vibe_recent_searches');
  };

  return (
    <div className="p-6 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
       <div className="flex items-center space-x-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-3 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-2xl">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <div className="relative flex-1">
             <input 
                autoFocus
                type="text" 
                placeholder="Find gadgets..." 
                className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 py-4 pl-12 pr-4 rounded-2xl text-sm border border-transparent focus:border-black transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && saveSearch(searchTerm)}
             />
             <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
       </div>

       {searchTerm.trim() === '' ? (
         <>
           <div className="mb-10">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Trending Tech</h3>
              <div className="flex flex-wrap gap-2">
                 {['iPhone', 'Magsafe', 'Pods', 'Smart Watch', 'Anker'].map(cat => (
                    <button key={cat} onClick={() => { setSearchTerm(cat); saveSearch(cat); }} className="px-5 py-2.5 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-2xl text-xs font-bold hover:bg-zinc-900 hover:text-white transition-all">{cat}</button>
                 ))}
              </div>
           </div>

           {recent.length > 0 && (
             <div className="mb-10 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recent Searches</h3>
                   <button onClick={clearAll} className="text-[10px] font-bold text-black dark:text-white underline uppercase tracking-widest opacity-40 hover:opacity-100">Clear All</button>
                </div>

                <div className="space-y-4">
                   {recent.map((item, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-pointer">
                         <div className="flex items-center space-x-3" onClick={() => setSearchTerm(item)}>
                            <Icon name="history" className="text-gray-300 text-xs" />
                            <span className="text-sm font-bold text-f-gray group-hover:text-black dark:text-white transition-colors">{item}</span>
                         </div>
                         <button onClick={() => removeRecent(item)} className="p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Icon name="times" className="text-gray-300" />
                         </button>
                      </div>
                   ))}
                </div>
             </div>
           )}
         </>
       ) : (
         <div className="space-y-4 animate-fade-in">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Search Results ({results.length})</h3>
            {results.map(product => (
              <div key={product.id} onClick={() => { saveSearch(searchTerm); navigate(`/product/${product.id}`); }} className="flex items-center space-x-4 p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] transition-all hover:border-zinc-200 dark:border-zinc-700">
                <div className="w-16 h-16 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 flex-shrink-0 flex items-center justify-center border border-zinc-50 overflow-hidden">
                  <img src={product.image} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" alt={product.name} />
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <h4 className="font-bold text-sm truncate text-zinc-900 dark:text-zinc-100">{product.name}</h4>
                  <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{product.category} • ৳{product.price}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-900 hover:text-white transition-colors">
                  <Icon name="chevron-right" className="text-[10px]" />
                </div>
              </div>
            ))}
            {results.length === 0 && (
              <div className="py-20 text-center opacity-40">
                <Icon name="box-open" className="text-4xl mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No products matched</p>
              </div>
            )}
         </div>
       )}
    </div>
  );
};

export default Search;