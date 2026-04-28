
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import { collection, onSnapshot, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { Order, OrderStatus } from '../../types';
import { useNotify } from '../../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../../components/Icon';
import { OrderSkeleton } from '../../components/Skeletons';

const ManageOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)));
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      const order = orders.find(o => o.id === orderId);
      await updateDoc(doc(db, 'orders', orderId), { status });
      notify(`Order status: ${status}`, "success");

      // Affiliate Commission Logic
      if (status === OrderStatus.DELIVERED && order?.affiliateRef && !order.commissionPaid) {
        try {
           const { where, getDocs, limit, addDoc, doc: f_doc, updateDoc: f_updateDoc, increment, getDoc: f_getDoc } = await import('firebase/firestore');
           // Get configs
           const reqConfigSnap = await f_getDoc(f_doc(db, 'settings', 'platform'));
           const configs = reqConfigSnap.exists() ? reqConfigSnap.data() : {};
           
           const t1Limit = configs.affiliateTier1Threshold ?? 3;
           const t1Comm = configs.affiliateTier1Commission ?? 50;
           const t2Limit = configs.affiliateTier2Threshold ?? 10;
           const t2Comm = configs.affiliateTier2Commission ?? 100;
           const t3Limit = configs.affiliateTier3Threshold ?? 20;
           const t3Comm = configs.affiliateTier3Commission ?? 150;
           const t4Limit = configs.affiliateTier4Threshold ?? 30;
           const t4Comm = configs.affiliateTier4Commission ?? 200;

           // Find user with this affiliateCode
           const q = query(collection(db, 'users'), where('affiliateCode', '==', order.affiliateRef), limit(1));
           const snap = await getDocs(q);
           if (!snap.empty) {
              const affiliateDoc = snap.docs[0];
              const affiliateId = affiliateDoc.id;
              
              const logsQ = query(collection(db, 'affiliates_log'), where('affiliateId', '==', affiliateId));
              const logsSnap = await getDocs(logsQ);
              const salesCount = logsSnap.docs.length; // Approximate enough for now

              let currentCommission = t1Comm;
              if (salesCount >= t3Limit) currentCommission = t4Comm;
              else if (salesCount >= t2Limit) currentCommission = t3Comm;
              else if (salesCount >= t1Limit) currentCommission = t2Comm;

              // Add balance
              await f_updateDoc(f_doc(db, 'users', affiliateId), {
                 walletBalance: increment(currentCommission)
              });
              // Log
              await addDoc(collection(db, 'affiliates_log'), {
                 affiliateId,
                 orderId: order.id,
                 customerName: order.customerName,
                 commission: currentCommission,
                 createdAt: Date.now()
              });
              // Mark order as paid
              await f_updateDoc(f_doc(db, 'orders', order.id), { commissionPaid: true });
           }
        } catch(e) {
           console.error('Affiliate sync failed:', e);
        }
      }
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  const updateTrackingId = async (orderId: string, trackingId: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { trackingId: trackingId.trim() });
      notify("Tracking ID synced", "success");
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center space-x-6 mb-12">
        <button onClick={() => navigate('/admin')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95"><Icon name="chevron-left" className="text-xs" /></button>
        <div>
           <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#06331e] mb-1.5">Orders Overview</h1>
           <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">Manual Logistics Management</p>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
           Array(5).fill(0).map((_, i) => <OrderSkeleton key={i} />)
        ) : (
          orders.map(order => (
          <div key={order.id} className="bg-white dark:bg-[#121212] rounded-[24px] border border-zinc-100 dark:border-zinc-800/80 shadow-[0_2px_10px_rgba(0,0,0,0.02)] transition-shadow hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col xl:flex-row group">
             
             {/* Left Column: Customer Details */}
             <div className="xl:w-[320px] shrink-0 p-6 xl:p-8 bg-zinc-50/50 dark:bg-zinc-800/20 border-b xl:border-b-0 xl:border-r border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between">
                <div>
                   <div className="flex items-center justify-between mb-8">
                      <p className="font-mono text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">#{order.id.slice(0, 10)}</p>
                      <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${order.status === OrderStatus.DELIVERED ? 'bg-emerald-100/50 text-emerald-600' : 'bg-white dark:bg-zinc-800 text-zinc-500 shadow-sm border border-zinc-100 dark:border-zinc-800'}`}>{order.status}</span>
                   </div>
                   <div className="space-y-1.5 mb-8">
                      <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{order.customerName}</p>
                      <p className="text-xs font-medium text-zinc-500">{order.contactNumber}</p>
                      <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-2 max-w-[280px]">{order.shippingAddress}</p>
                   </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest">Order Status</label>
                  <div className="relative">
                     <select 
                       className="w-full appearance-none p-3.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/50 text-xs font-semibold outline-none cursor-pointer focus:border-zinc-400 dark:focus:border-zinc-500 rounded-xl transition-all shadow-[0_2px_10px_rgba(0,0,0,0.02)]"
                       value={order.status}
                       onChange={(e) => updateStatus(order.id, e.target.value as OrderStatus)}
                     >
                       {Object.values(OrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                     </select>
                     <Icon name="chevron-down" className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none" />
                  </div>
                </div>
             </div>

             {/* Middle Column: Logistics & Items */}
             <div className="flex-1 p-6 xl:p-8 flex flex-col justify-between">
                <div>
                   <div className="flex flex-wrap gap-4 mb-8">
                      {order.items.map((item, i) => (
                         <div key={i} className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-800/30 p-2.5 pr-5 rounded-2xl border border-zinc-100 dark:border-zinc-800/50">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-900 p-1.5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
                               <img src={item.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="" />
                            </div>
                            <div>
                               <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 max-w-[140px] truncate">{item.name}</p>
                               <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Qty: {item.quantity}</p>
                            </div>
                         </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
                   <div>
                      <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest block mb-2">Tracking ID</label>
                      <input 
                        type="text" 
                        placeholder="Enter Tracking ID..."
                        className="w-full bg-transparent p-3 text-xs font-semibold outline-none border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-400 transition-colors uppercase placeholder:text-zinc-300 dark:placeholder:text-zinc-700"
                        defaultValue={order.trackingId}
                        onBlur={(e) => updateTrackingId(order.id, e.target.value)}
                      />
                   </div>

                   {order.status === OrderStatus.ON_THE_WAY && (
                     <div className="grid grid-cols-2 gap-6 animate-fade-in">
                       <div>
                         <label className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest block mb-2">Rider Number</label>
                         <input 
                           type="text" 
                           placeholder="Phone..."
                           className="w-full bg-transparent p-3 text-xs font-semibold outline-none border-b border-emerald-200 dark:border-emerald-900/50 focus:border-emerald-500 transition-colors"
                           defaultValue={order.riderNumber || ''}
                           onBlur={(e) => updateDoc(doc(db, 'orders', order.id), { riderNumber: e.target.value.trim() })}
                         />
                       </div>
                       <div>
                         <label className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-500/80 uppercase tracking-widest block mb-2">Courier Name</label>
                         <input 
                           type="text" 
                           placeholder="e.g. Steadfast"
                           className="w-full bg-transparent p-3 text-xs font-semibold outline-none border-b border-emerald-200 dark:border-emerald-900/50 focus:border-emerald-500 transition-colors uppercase"
                           defaultValue={order.courierName || ''}
                           onBlur={(e) => updateDoc(doc(db, 'orders', order.id), { courierName: e.target.value.trim() })}
                         />
                       </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Right Column: Summary */}
             <div className="xl:w-[200px] p-6 xl:p-8 bg-zinc-50/80 dark:bg-zinc-800/10 border-t xl:border-t-0 xl:border-l border-zinc-100 dark:border-zinc-800/80 flex flex-col justify-between items-start xl:items-end text-left xl:text-right">
                <div className="w-full">
                   <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-widest mb-2 xl:text-right">Total Amount</p>
                   {!!order.discount && (
                       <>
                       <p className="text-[10px] font-bold text-zinc-400 xl:text-right line-through">৳{(order.subTotal || 0) + 150}</p>
                       <p className="text-[10px] font-bold text-emerald-500 xl:text-right mb-1">-৳{order.discount} ({order.couponCode})</p>
                       </>
                   )}
                   <p className="text-2xl xl:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 xl:text-right">৳{order.total}</p>
                </div>
                <div className="mt-8 xl:mt-auto text-[10px] font-medium text-zinc-400 xl:text-right">
                   <p>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                   <p className="mt-1">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
             </div>
          </div>
        ))
        )}
        {!loading && orders.length === 0 && <div className="py-32 text-center text-zinc-400 font-bold uppercase tracking-[0.2em] text-[11px]">No log found in database</div>}
      </div>
    </div>
  );
};

export default ManageOrders;
