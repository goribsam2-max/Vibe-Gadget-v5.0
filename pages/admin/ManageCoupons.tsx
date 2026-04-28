import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useNotify } from '../../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';

const ManageCoupons: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discountInfo: '', type: 'percent', maxUses: 100 });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      notify("Failed to load coupons", "error");
    }
    setLoading(false);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountInfo) return;
    
    try {
      await addDoc(collection(db, 'coupons'), {
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discountInfo),
        type: newCoupon.type,
        maxUses: Number(newCoupon.maxUses),
        usedCount: 0,
        isActive: true,
        createdAt: Date.now()
      });
      notify("Coupon added successfully", "success");
      setShowAddForm(false);
      setNewCoupon({ code: '', discountInfo: '', type: 'percent', maxUses: 100 });
      fetchCoupons();
    } catch (err) {
      notify("Error adding coupon", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      notify("Coupon removed", "success");
      fetchCoupons();
    } catch (err) {
      notify("Error deleting coupon", "error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
       <div className="flex items-center justify-between mb-12">
          <div className="flex items-center space-x-6">
             <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
                <Icon name="arrow-left" className="text-xs" />
             </button>
             <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Coupons & Promos</h1>
                <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Discount Management</p>
             </div>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)} className="bg-[#06331e] text-white px-6 py-3 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-emerald-900 transition-colors shadow-lg">
             <Icon name={showAddForm ? 'times' : 'plus'} className="mr-2" /> {showAddForm ? 'Cancel' : 'New Coupon'}
          </button>
       </div>

       {showAddForm && (
         <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 dark:bg-zinc-800 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-700 mb-8">
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-6 uppercase tracking-widest text-xs">Create Discount Code</h3>
            <form onSubmit={handleAddCoupon} className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Coupon Code</label>
                 <input type="text" value={newCoupon.code || ""} onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} placeholder="e.g. SUMMER20" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold uppercase" required />
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Discount Amount</label>
                 <div className="flex space-x-2">
                    <input type="number" value={newCoupon.discountInfo || ""} onChange={e => setNewCoupon({...newCoupon, discountInfo: e.target.value})} placeholder="Amount" className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
                    <select value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value})} className="p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold uppercase tracking-widest cursor-pointer">
                       <option value="percent">% Off</option>
                       <option value="fixed">৳ Off</option>
                    </select>
                 </div>
               </div>
               <div>
                 <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">Max Uses</label>
                 <input type="number" value={newCoupon.maxUses || ""} onChange={e => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})} className="w-full p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm font-bold" required />
               </div>
               <div className="flex items-end">
                  <button type="submit" className="w-full p-4 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20">Create Promo</button>
               </div>
            </form>
         </motion.div>
       )}

       {loading ? (
         <div className="py-20 text-center"><Icon name="spinner" className="animate-spin text-emerald-500 text-3xl" /></div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {coupons.map(coupon => (
              <div key={coupon.id} className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative group overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                 <div className="flex justify-between items-start mb-6 mt-2">
                    <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-lg font-black tracking-widest border border-emerald-100 flex items-center">
                       <Icon name="ticket-alt" className="mr-2" /> {coupon.code}
                    </div>
                    <button onClick={() => handleDelete(coupon.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center">
                       <Icon name="trash" className="text-xs" />
                    </button>
                 </div>
                 
                 <div className="flex justify-between items-end border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Discount</p>
                        <p className="text-xl font-black text-zinc-900 dark:text-zinc-100">{coupon.type === 'percent' ? `${coupon.discount}%` : `৳${coupon.discount}`}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Usage</p>
                        <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{coupon.usedCount || 0} <span className="text-zinc-300 font-medium">/ {coupon.maxUses}</span></p>
                    </div>
                 </div>
              </div>
            ))}
            {coupons.length === 0 && (
               <div className="col-span-full py-20 text-center bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-400">
                  <Icon name="ticket-alt" className="text-4xl mb-4 text-zinc-300" />
                  <p className="font-bold text-xs uppercase tracking-widest">No active coupons</p>
               </div>
            )}
         </div>
       )}
    </div>
  );
};

export default ManageCoupons;
