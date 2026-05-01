import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import Icon from '../../components/Icon';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: number;
}

const ManageReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'));
      const querySnapshot = await getDocs(q);
      const reviewsList: Review[] = [];
      querySnapshot.forEach((doc) => {
        reviewsList.push({ id: doc.id, ...doc.data() } as Review);
      });
      reviewsList.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewsList);
    } catch (error) {
      notify("Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: Review) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    
    try {
      // 1. Get the product to recalculate rating
      const productRef = doc(db, 'products', review.productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
         const productData = productSnap.data();
         const oldRating = productData.rating || 0;
         const oldNumReviews = productData.numReviews || 0;
         
         let newNumReviews = Math.max(0, oldNumReviews - 1);
         let newRating = 0;
         
         if (newNumReviews > 0) {
            newRating = ((oldRating * oldNumReviews) - review.rating) / newNumReviews;
         }
         
         await updateDoc(productRef, {
            rating: Number(newRating.toFixed(1)),
            numReviews: newNumReviews
         });
      }

      // 2. Delete the review
      await deleteDoc(doc(db, 'reviews', review.id));
      setReviews(reviews.filter(r => r.id !== review.id));
      notify("Review deleted successfully", "success");
    } catch (error) {
      notify("Failed to delete review", "error");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate('/admin')} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
          <Icon name="arrow-left" className="text-xs" />
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-white">Manage Reviews</h1>
      </div>

      <div className="bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
        {loading ? (
           <div className="flex justify-center items-center h-40">
              <Icon name="spinner-third" className="animate-spin text-xl text-emerald-500" />
           </div>
        ) : reviews.length === 0 ? (
           <div className="text-center py-20 text-zinc-500">
              <Icon name="comment-slash" className="text-lg mb-4 opacity-50" />
              <p className="font-bold uppercase tracking-normal text-xs">No reviews found</p>
           </div>
        ) : (
           <div className="space-y-4">
              <AnimatePresence>
                 {reviews.map(review => (
                    <motion.div 
                       key={review.id}
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="border border-zinc-200 dark:border-zinc-800 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                       <div className="flex-1">
                          <div className="flex items-center mb-2 gap-3">
                             <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                <img src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}&background=06331e&color=fff`} className="w-full h-full object-cover" alt="" />
                             </div>
                             <div>
                                <p className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{review.userName}</p>
                                <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-zinc-400 tracking-normal">
                                   <span className="flex text-yellow-400">
                                      {[...Array(5)].map((_, i) => <Icon key={i} name={i < review.rating ? 'star' : 'star-outline'} className="mr-0.5" />)}
                                   </span>
                                   <span>•</span>
                                   <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                          </div>
                          {review.comment && <p className="text-sm text-zinc-600 dark:text-zinc-400 ml-12 italic leading-relaxed">"{review.comment}"</p>}
                          {review.images && review.images.length > 0 && (
                             <div className="flex gap-2 mt-4 ml-12">
                                {review.images.map((img, i) => (
                                   <div key={i} className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                                      <img src={img} className="w-full h-full object-cover" alt="" />
                                   </div>
                                ))}
                             </div>
                          )}
                          <div className="ml-12 mt-3">
                            <span className="text-[9px] uppercase font-bold tracking-normal text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-md">Product ID: {review.productId}</span>
                          </div>
                       </div>
                       
                       <button onClick={() => handleDelete(review)} className="px-5 py-3 h-max shrink-0 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/30 text-red-600 rounded-xl font-bold text-[10px] uppercase tracking-normal transition-colors flex items-center justify-center gap-2">
                          <Icon name="trash" />
                          <span>Delete</span>
                       </button>
                    </motion.div>
                 ))}
              </AnimatePresence>
           </div>
        )}
      </div>
    </div>
  );
};

export default ManageReviews;
