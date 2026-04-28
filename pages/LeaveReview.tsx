
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { Product } from '../types';
import { uploadToImgbb } from '../services/imgbb';
import Icon from '../components/Icon';

const LeaveReview: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('productId');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) return;
      const snap = await getDoc(doc(db, 'products', productId));
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
    };
    fetchProduct();
  }, [productId]);

  const handleSubmit = async () => {
    if (!auth.currentUser) return notify("Please login to leave a review.", "error");
    if (rating === 0) return notify("Please select a rating.", "error");
    if (!comment.trim()) return notify("Please write a review.", "error");
    if (!productId || !product) return;

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadToImgbb(file);
        imageUrls.push(url);
      }

      await addDoc(collection(db, 'reviews'), {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || 'Vibe Customer',
        userPhoto: auth.currentUser.photoURL || '',
        rating,
        comment: comment.trim(),
        images: imageUrls,
        createdAt: Date.now()
      });

      const oldRating = product.rating || 0;
      const oldNumReviews = product.numReviews || 0;
      const newNumReviews = oldNumReviews + 1;
      const newRating = ((oldRating * oldNumReviews) + rating) / newNumReviews;

      await updateDoc(doc(db, 'products', productId), {
        rating: Number(newRating.toFixed(1)),
        numReviews: newNumReviews
      });

      notify("Review posted!", "success");

      navigate(`/product/${productId}`);
    } catch (err) {
      notify("Failed to post review.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!product) return <div className="h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-8 animate-fade-in min-h-screen flex flex-col max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-800">
       <div className="flex items-center justify-between mb-10 relative z-10">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full active:scale-95 transition-all shadow-sm hover:-translate-x-1 group">
             <Icon name="arrow-left" className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </button>
          <div className="text-center flex-1 pr-12">
             <h1 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-2"><Icon name="stars" className="text-yellow-400" /> Share Your Vibe</h1>
             <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Review Product</p>
          </div>
       </div>

       <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 flex items-center space-x-6 mb-8 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-[1.5rem] overflow-hidden p-3 border border-zinc-100 dark:border-zinc-700 shadow-inner group-hover:scale-105 transition-transform duration-500 relative z-10">
             <img src={product.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="" />
          </div>
          <div className="flex-1 min-w-0 relative z-10">
             <span className="inline-block px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-black text-[8px] uppercase tracking-widest rounded-full mb-3">{product.category}</span>
             <h4 className="font-black text-lg md:text-xl truncate tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight">{product.name}</h4>
          </div>
       </div>

       <div className="text-center mb-8 bg-zinc-900 dark:bg-zinc-50 p-10 md:p-12 rounded-[2.5rem] border border-transparent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] dark:shadow-none relative overflow-hidden text-white dark:text-black hover-tilt">
          <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-emerald-500/20 to-transparent pointer-events-none"></div>
          <h3 className="text-2xl md:text-3xl font-black mb-3 tracking-tighter drop-shadow-md relative z-10">Rate your experience</h3>
          <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em] mb-10 relative z-10">How much do you love it?</p>
          <div className="flex justify-center space-x-3 md:space-x-5 relative z-10">
             {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} onClick={() => setRating(star)} 
                  className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${star <= rating ? 'bg-yellow-400 text-yellow-900 shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-110 -translate-y-2 border-2 border-yellow-200' : 'bg-zinc-800 dark:bg-zinc-200 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700 dark:hover:bg-zinc-300 hover:-translate-y-1'}`}
                >
                  <Icon name={star <= rating ? 'star' : 'star-outline'} className="text-xl md:text-2xl" />
                  {star <= rating && <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>}
                </button>
             ))}
          </div>
          {rating > 0 && <p className="text-xs font-black text-emerald-400 dark:text-emerald-600 uppercase tracking-widest mt-8 animate-fade-in relative z-10 bg-emerald-900/50 dark:bg-emerald-100/50 inline-block px-4 py-1.5 rounded-full backdrop-blur-md">{['Not for me', 'Could be better', 'It is alright', 'Pretty good', 'Absolutely amazing!'][rating-1]}</p>}
       </div>

       <div className="flex-1 space-y-6 md:space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none focus-within:border-[#06331e] dark:focus-within:border-emerald-500 transition-colors relative group">
             <div className="absolute top-0 right-8 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"><Icon name="comment-alt-lines" className="text-6xl text-emerald-900 dark:text-zinc-500" /></div>
             <label className="flex items-center text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em] mb-4 pl-1 relative z-10">
                Detailed Review
             </label>
             <textarea 
                placeholder="What do you love about it? How's the quality? Does it match the pictures? Your feedback helps others decide!" 
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-6 rounded-[1.5rem] outline-none h-40 border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 font-medium text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none shadow-inner relative z-10"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />
          </div>

          <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/20 dark:shadow-none">
             <div className="flex flex-col mb-4 pl-1">
               <label className="text-[10px] font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-[0.2em] mb-1">
                  Upload Photos
               </label>
               <p className="text-[9px] font-bold text-zinc-400 tracking-widest uppercase">Show us how it looks in real life (Optional)</p>
             </div>
             
             <div className="relative overflow-hidden group">
                <input 
                   type="file" multiple accept="image/*"
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   onChange={e => e.target.files && setImageFiles(Array.from(e.target.files))}
                />
                <div className={`w-full bg-zinc-50 dark:bg-zinc-800 p-10 rounded-[1.5rem] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 ${imageFiles.length > 0 ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 group-active:scale-95'}`}>
                   {imageFiles.length > 0 ? (
                      <div className="flex flex-col items-center animate-fade-in text-center">
                         <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                           <Icon name="images" className="text-2xl text-emerald-500" />
                         </div>
                         <span className="font-black text-base text-emerald-700 dark:text-emerald-400 tracking-tight mb-1">{imageFiles.length} photo(s) selected</span>
                         <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-500/70">Tap to browse files to replace</span>
                      </div>
                   ) : (
                      <div className="flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 shadow-sm border border-zinc-100 dark:border-zinc-800">
                           <Icon name="camera" className="text-2xl text-zinc-300 dark:text-zinc-600 group-hover:text-[#06331e] dark:group-hover:text-emerald-400 transition-colors" />
                         </div>
                         <span className="font-black text-sm text-zinc-700 dark:text-zinc-300 tracking-tight mb-1">Click or drag photos here</span>
                         <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Supported formats: JPG, PNG, WEBP</span>
                      </div>
                   )}
                </div>
             </div>
          </div>
       </div>

       <div className="pt-8 mb-4">
          <button 
             disabled={loading}
             onClick={handleSubmit} 
             className="w-full py-5 bg-[#06331e] text-emerald-300 rounded-full font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-900/30 hover:-translate-y-1 hover:shadow-emerald-900/40 hover:bg-zinc-900 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-3 transition-all group border border-[#06331e] dark:border-emerald-900/30"
           >
             {loading ? <Icon name="spinner-third" className="animate-spin text-xl text-emerald-400" /> : (
               <>
                 <span>Submit Review</span> 
                 <Icon name="paper-plane" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </>
             )}
          </button>
       </div>
    </div>
  );
};

export default LeaveReview;
