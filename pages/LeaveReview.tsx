
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
    <div className="p-8 animate-fade-in min-h-screen flex flex-col max-w-md mx-auto bg-zinc-50 dark:bg-zinc-800">
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl active:scale-90 transition-all shadow-sm">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-2xl font-black tracking-tight">Write Review</h1>
       </div>

       <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 flex items-center space-x-5 mb-10">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-2xl overflow-hidden p-1 shadow-sm border border-zinc-100 dark:border-zinc-800">
             <img src={product.image} className="w-full h-full object-contain" alt="" />
          </div>
          <div className="flex-1 min-w-0">
             <h4 className="font-bold text-sm truncate tracking-tight text-zinc-900 dark:text-zinc-100">{product.name}</h4>
             <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{product.category}</p>
          </div>
       </div>

       <div className="text-center mb-10">
          <h3 className="text-xl font-bold mb-2 tracking-tight">Your Rating</h3>
          <p className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mb-6">How was your experience?</p>
          <div className="flex justify-center space-x-3">
             {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} onClick={() => setRating(star)} 
                  className={`text-3xl transition-all ${star <= rating ? 'text-yellow-400 scale-110' : 'text-zinc-200'}`}
                >
                  <Icon name={star <= rating ? 'star' : 'star-outline'} />
                </button>
             ))}
          </div>
       </div>

       <div className="flex-1 space-y-8">
          <div>
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-1">Review Message</label>
             <textarea 
                placeholder="Tell us what you think about the product..." 
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-6 rounded-[2rem] outline-none h-40 border border-transparent focus:border-black transition-all font-medium text-sm leading-relaxed"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
             />
          </div>

          <div>
             <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-3 px-1">Upload Photos</label>
             <input 
                type="file" multiple accept="image/*"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-[10px] font-bold uppercase border-2 border-dashed border-zinc-200 dark:border-zinc-700"
                onChange={e => e.target.files && setImageFiles(Array.from(e.target.files))}
             />
          </div>
       </div>

       <button 
          disabled={loading}
          onClick={handleSubmit} 
          className="w-full mt-10 py-5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl disabled:opacity-50"
        >
          {loading ? "Posting..." : "Submit Review"}
       </button>
    </div>
  );
};

export default LeaveReview;
