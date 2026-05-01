
import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { Order, OrderStatus } from '../types';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotify } from '../components/Notifications';
import Icon from '../components/Icon';

const StatusIconSmall = ({ status }: { status: OrderStatus }) => {
  const base = "w-10 h-10 rounded-2xl flex items-center justify-center text-xs shadow-inner ";
  switch (status) {
    case OrderStatus.HOLD: return <div className={base + "bg-yellow-50 text-yellow-600"}><Icon name="pause" /></div>;
    case OrderStatus.PROCESSING: return <div className={base + "bg-blue-50 text-blue-600"}><Icon name="sync-alt" className="animate-spin" /></div>;
    case OrderStatus.SHIPPED: return <div className={base + "bg-orange-50 text-orange-600"}><Icon name="truck-moving" /></div>;
    case OrderStatus.ON_THE_WAY: return <div className={base + "bg-purple-50 text-purple-600"}><Icon name="motorcycle" /></div>;
    case OrderStatus.DELIVERED: return <div className={base + "bg-green-50 text-green-600"}><Icon name="box-check" /></div>;
    case OrderStatus.CANCELLED: return <div className={base + "bg-red-50 text-red-600"}><Icon name="times" /></div>;
    default: return <div className={base + "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}><Icon name="box" /></div>;
  }
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    const uid = auth.currentUser?.uid || 'guest';
    const q = query(collection(db, 'orders'), where('userId', '==', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
      setLoading(false);
    });

    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
        unsubscribe();
        clearInterval(timer);
    };
  }, []);

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      try {
          await updateDoc(doc(db, 'orders', orderId), { status: OrderStatus.CANCELLED });
          notify("Order has been cancelled.", "info");
      } catch (err) {
          notify("Failed to cancel order.", "error");
      }
  };

  const isCancelable = (order: Order) => {
      if (order.status !== OrderStatus.PENDING) return false;
      const minutesPassed = (currentTime - order.createdAt) / (1000 * 60);
      return minutesPassed <= 5;
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 pb-40 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center space-x-5 mb-14">
        <button onClick={() => navigate(-1)} className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-full hover:bg-zinc-900 hover:text-white transition-all active:scale-95">
          <Icon name="arrow-left" className="text-xs" />
        </button>
        <div>
           <h1 className="text-lg md:text-xl lg:text-base xl:text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-0.5">My Orders</h1>
           <p className="text-zinc-500 text-[11px] font-medium tracking-normal uppercase">Purchase History</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
           {Array(4).fill(0).map((_, i) => (
              <div key={i} className="bg-zinc-50 dark:bg-zinc-800 p-4 pr-6 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between mb-4">
                 <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-2xl animate-pulse"></div>
                    <div>
                       <div className="h-2 w-16 bg-zinc-200/50 dark:bg-zinc-700/50 rounded mb-1.5 animate-pulse"></div>
                       <div className="h-4 w-24 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full animate-pulse"></div>
                    </div>
                 </div>
                 <div className="h-4 w-12 bg-zinc-200/50 dark:bg-zinc-700/50 rounded animate-pulse"></div>
              </div>
           ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-40 flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6">
             <Icon name="shopping-bag" className="text-lg text-zinc-300" />
          </div>
          <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-normal mb-8">No order history found</p>
          <button onClick={() => navigate('/')} className="px-8 py-3.5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-full text-[10px] font-bold uppercase tracking-normal shadow-md hover:bg-zinc-800 transition-all">Start Shopping</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order, index) => {
            const recent = index === 0;

            if (recent) {
              return (
                <motion.div 
                  whileTap={{ scale: 0.99 }}
                  key={order.id} 
                  onClick={() => navigate(`/track-order/${order.id}`)} 
                  className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-black transition-all cursor-pointer relative group flex flex-col mb-8"
                >
                  <div className="absolute top-0 left-8 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white text-[9px] font-bold uppercase tracking-normal px-4 py-1.5 rounded-b-lg">
                     Latest Order
                  </div>
                  <div className="flex justify-between items-start mb-8 mt-6">
                    <div className="flex items-center space-x-4">
                      <StatusIconSmall status={order.status} />
                      <div>
                        <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-normal mb-1 mt-0.5">Order Ref</p>
                        <p className="text-sm font-mono font-semibold uppercase text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded leading-none">#{order.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-black dark:text-white uppercase tracking-normal leading-none">{order.status}</p>
                       <p className="text-[10px] text-zinc-400 font-medium mt-2">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center -space-x-3 mb-8 px-1">
                    {order.items.slice(0, 4).map((item, idx) => (
                      <div key={idx} className="w-14 h-14 rounded-full bg-zinc-50 dark:bg-zinc-800 p-2 border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                         <img src={item.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt="" />
                      </div>
                    ))}
                    {order.items.length > 4 && (
                       <div className="w-14 h-14 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 flex items-center justify-center text-[11px] font-bold border border-zinc-200 dark:border-zinc-700 shadow-sm z-10">
                          +{order.items.length - 4}
                       </div>
                    )}
                  </div>

                  <div className="flex justify-between items-end pt-6 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-normal mb-1.5">Grand Total</p>
                      <p className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 leading-none">৳{order.total.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        {isCancelable(order) && (
                            <button 
                              onClick={(e) => handleCancelOrder(order.id, e)}
                              className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-full text-[9px] font-bold uppercase tracking-normal transition-colors"
                            >
                               Cancel Order
                            </button>
                        )}
                        <button className="w-10 h-10 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                           <Icon name="arrow-right" className="text-[10px]" />
                        </button>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Older orders as generic pills
            return (
                <motion.div 
                  whileTap={{ scale: 0.98 }}
                  key={order.id} 
                  onClick={() => navigate(`/track-order/${order.id}`)} 
                  className="bg-zinc-50 dark:bg-zinc-800 p-4 pr-6 rounded-full border border-zinc-100 dark:border-zinc-800 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                   <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-2 shrink-0">
                         <img src={order.items[0]?.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform" alt="" />
                      </div>
                      <div>
                         <p className="text-xs font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 uppercase">#{order.id.slice(0, 8)}</p>
                         <p className="text-[9px] font-bold text-zinc-400 mt-0.5 tracking-normal uppercase">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                   </div>
                   
                   <div className="flex items-center space-x-6">
                      <div className="hidden sm:block text-right">
                          <p className="text-[9px] font-bold text-zinc-400 tracking-normal uppercase mb-0.5">Status</p>
                          <p className={`text-[10px] font-semibold uppercase tracking-tight ${order.status === OrderStatus.CANCELLED ? 'text-red-500' : 'text-zinc-900 dark:text-zinc-100'}`}>{order.status}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-zinc-900 group-hover:text-white transition-all shadow-sm">
                         <Icon name="chevron-right" className="text-xs" />
                      </div>
                   </div>
                </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
