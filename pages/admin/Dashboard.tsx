
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase';
import { motion } from 'framer-motion';
import { useNotify } from '../../components/Notifications';
import Icon from '../../components/Icon';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [stats, setStats] = useState({ products: 0, users: 0, orders: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const pSnap = await getDocs(collection(db, 'products'));
      const uSnap = await getDocs(collection(db, 'users'));
      const oSnap = await getDocs(collection(db, 'orders'));
      setStats({ products: pSnap.size, users: uSnap.size, orders: oSnap.size });
      const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
      const ordersSnap = await getDocs(qOrders);
      setRecentOrders(ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    };
    fetchStats();
  }, []);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    notify("This module will be available in the next update.", "info");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 pb-32 min-h-screen bg-zinc-50 dark:bg-zinc-800/50 relative overflow-hidden">
      {/* Background blobs for premium feel */}
      <div className="absolute top-[-10%] left-[-5%] w-[40rem] h-[40rem] bg-emerald-100/40 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="absolute top-[20%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-100/30 rounded-full blur-[100px] pointer-events-none z-0"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div className="flex items-center space-x-6">
          <button onClick={() => navigate('/')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95"><Icon name="arrow-left" className="text-xs" /></button>
          <div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
               {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, Admin
            </h1>
            <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-widest uppercase flex items-center">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-2"></span>
               System Online &bull; {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        
         {/* Quick Actions Row */}
        <div className="flex flex-wrap gap-3 animate-fade-in relative z-10">
           <button onClick={() => navigate('products')} className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all flex items-center gap-2 group hover-tilt relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-2"><Icon name="plus" className="group-hover:rotate-90 transition-transform duration-500" /> Add Product</span>
              <div className="absolute inset-0 bg-emerald-600 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300"></div>
           </button>
           <button onClick={() => navigate('orders')} className="px-5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm hover:border-zinc-300 hover:text-black dark:text-white hover:-translate-y-0.5 hover:shadow-md transition-all flex items-center gap-2 hover-tilt group">
              <span className="group-hover:-translate-y-0.5 transition-transform"><Icon name="shopping-cart" /></span> View Orders
           </button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10 animate-stagger-1">
        <StatCard title="Total Products" value={stats.products} icon="boxes" gradient="from-zinc-100 to-zinc-50" iconColor="text-zinc-800 dark:text-zinc-200" trend="+12% this week" />
        <StatCard title="Registered Users" value={stats.users} icon="users" gradient="from-blue-50 to-white" iconColor="text-blue-600" trend="+34 new" />
        <StatCard title="Total Orders" value={stats.orders} icon="shopping-bag" gradient="from-emerald-50 to-white" iconColor="text-emerald-600" trend="All time" />
        <StatCard title="Pending Tickets" value="0" icon="ticket-alt" gradient="from-orange-50 to-white" iconColor="text-orange-600" trend="Clear queue" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 space-y-8">
           {/* Advanced Revenue Chart Mock */}
           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] border border-zinc-200 dark:border-zinc-700/80 p-6 md:p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[80px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none"></div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 relative z-10">
                 <div>
                    <h3 className="font-black text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">Revenue Analytics</h3>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mt-1">Live Demo Data</p>
                 </div>
                 <div className="bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-inner">
                    <span className="text-emerald-500"><Icon name="trend-up" className="text-sm" /></span> +24.5% vs Last Week
                 </div>
              </div>
              <div className="h-[280px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[
                  { name: 'Mon', revenue: 4000 },
                  { name: 'Tue', revenue: 3000 },
                  { name: 'Wed', revenue: 5000 },
                  { name: 'Thu', revenue: 2780 },
                  { name: 'Fri', revenue: 8890 },
                  { name: 'Sat', revenue: 6390 },
                  { name: 'Sun', revenue: 9490 },
               ]}>
                 <defs>
                   <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 'bold' }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#a1a1aa', fontWeight: 'bold' }} dx={-10} tickFormatter={(value) => `৳${value}`} />
                 <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontWeight: 'bold', fontSize: '12px' }}
                   itemStyle={{ color: '#06331e' }}
                   formatter={(value: any) => [`৳${value}`, 'Revenue']}
                 />
                 <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </motion.div>
      </div>
      
      <div className="lg:col-span-1 space-y-6">
         {/* System Health Widget */}
         <div className="bg-zinc-900 rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden h-[55%] min-h-[200px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500 rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
            <h3 className="font-black text-white mb-6 uppercase tracking-widest text-[10px] md:text-xs">Live System Health</h3>
            
            <div className="space-y-5 relative z-10">
               <div>
                  <div className="flex justify-between text-[9px] md:text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-widest"><span>Database Load</span> <span className="text-emerald-400">12%</span></div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 w-[12%]"></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-[9px] md:text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-widest"><span>Storage Capacity</span> <span className="text-blue-400">45%</span></div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-blue-500 w-[45%]"></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-[9px] md:text-[10px] text-zinc-400 font-bold mb-2 uppercase tracking-widest"><span>API Bandwidth</span> <span className="text-orange-400">89%</span></div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden"><div className="h-full bg-orange-500 w-[89%] animate-pulse"></div></div>
               </div>
            </div>
         </div>
         
         {/* Quick Alerts */}
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-[2rem] p-6 border border-zinc-200 dark:border-zinc-700 flex items-start gap-4 shadow-sm h-[40%] flex-col justify-center relative overflow-hidden group">
             <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-blue-100/50 rounded-full blur-2xl group-hover:bg-blue-200/50 transition-colors"></div>
             <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100"><Icon name="shield-check" className="text-xl" /></div>
             <div className="relative z-10 mt-2">
                <h4 className="font-black text-sm text-zinc-900 dark:text-zinc-100 mb-1">Security Scan OK</h4>
                <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">All firewalls and SSL certificates are active. No anomalies detected.</p>
             </div>
         </div>
      </div>
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 px-1 relative z-10">Management Modules</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-16 relative z-10">
         <AdminBentoLink to="products" title="Inventory Catalog" subtitle="Add, edit, or remove store products." icon="cubes" />
         <AdminBentoLink to="users" title="Customer Database" subtitle="Manage registered users and accounts." icon="users-cog" />
         <AdminBentoLink to="orders" title="Order Fulfillment" subtitle="Process and updates active orders." icon="truck-fast" />
         <AdminBentoLink to="fake-orders" title="Risk & Security" subtitle="Review AI-flagged suspicious orders." icon="shield-virus" highlight="border-red-200 bg-red-50/20" iconColor="text-red-500" />
         <AdminBentoLink to="notifications" title="Push Messaging" subtitle="Send targeted alerts to users." icon="comment-dots" />
         <AdminBentoLink to="banners" title="Storefront Design" subtitle="Manage homepage hero banners." icon="images" />
         <AdminBentoLink to="stories" title="Flash Stories" subtitle="Administer Instagram-style stories." icon="bolt" />
         <AdminBentoLink to="config" title="Global Settings" subtitle="Configure platform variables & API Keys." icon="sliders-h" />
         <AdminBentoLink to="custom-sections" title="Custom Content" subtitle="Inject HTML/CSS anywhere." icon="edit" />
         
         {/* Extended modules for professional look */}
         <AdminBentoLink to="coupons" title="Coupons & Promos" subtitle="Create discount codes and campaigns." icon="ticket" />
         <AdminBentoLink to="riders" title="Rider Management" subtitle="Assign and track delivery riders." icon="motorcycle" />
         <AdminBentoLink to="mock/analytics" title="Sales Analytics" subtitle="View detailed revenue reports." icon="chart-line" />
         <AdminBentoLink to="helpdesk" title="Help Desk" subtitle="Respond to customer support tickets." icon="headset" />
         <AdminBentoLink to="mock/refunds" title="Refund Requests" subtitle="Process returned items and payouts." icon="undo" />
         
         <AdminBentoLink to="withdrawals" title="Payouts" subtitle="Manage Affiliate payouts." icon="wallet" />
         <AdminBentoLink to="affiliates" title="Affiliates" subtitle="Review affiliate programs." icon="users-cog" />
         <AdminBentoLink to="staff" title="Staff Roles" subtitle="Manage RBAC and admin permissions." icon="id-badge" />
         <AdminBentoLink to="seo" title="SEO & Ads" subtitle="Meta tags, fb pixels, indexing." icon="search" />
         <AdminBentoLink to="mock/taxes" title="Tax Configuration" subtitle="Set regional tax and VAT rates." icon="file-invoice-dollar" />
         <AdminBentoLink to="mock/bulk" title="Stock Export" subtitle="Bulk import/export CSV actions." icon="file-csv" />
      </div>

      <div>
         <div className="flex items-center justify-between mb-6 px-1">
            <h3 className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Recent Activity</h3>
            <Link to="orders" className="text-[10px] font-bold text-[#06331e] uppercase tracking-widest hover:text-emerald-600 transition-colors flex items-center">
               View All <Icon name="arrow-right" className="ml-1.5 text-[8px]" />
            </Link>
         </div>
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-3xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shadow-sm">
            {recentOrders.map((order, i) => (
               <div key={order.id} className={`flex items-center justify-between p-6 ${i !== recentOrders.length - 1 ? 'border-b border-zinc-100 dark:border-zinc-800' : ''} hover:bg-zinc-50 dark:bg-zinc-800 transition-colors cursor-pointer group`} onClick={() => navigate(`orders`)}>
                  <div className="flex items-center space-x-5">
                     <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-100 dark:border-zinc-800 group-hover:bg-zinc-50 dark:bg-zinc-800 group-hover:border-zinc-200 dark:border-zinc-700 shadow-sm transition-colors group-hover:shadow-md"><Icon name="shopping-bag" className="text-zinc-500 text-sm" /></div>
                     <div>
                       <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 mb-0.5 tracking-tight group-hover:text-[#06331e] transition-colors">{order.customerName}</p>
                       <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Order #{order.id.slice(0,8)}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm md:text-base font-black text-black dark:text-white">৳{order.total}</p>
                     <p className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase mt-0.5 ${order.status === 'Delivered' ? 'text-emerald-500' : order.status === 'Cancelled' ? 'text-red-500' : 'text-blue-500'}`}>{order.status}</p>
                  </div>
               </div>
            ))}
            {recentOrders.length === 0 && (
               <div className="p-12 text-center flex flex-col items-center justify-center text-zinc-400">
                   <div className="w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-4"><Icon name="inbox" className="text-xl text-zinc-300" /></div>
                   <div className="font-bold text-xs uppercase tracking-widest">No recent orders</div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, gradient, iconColor, trend }: any) => (
  <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} rounded-bl-[100px] z-0 opacity-30 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none`}></div>
    <div className="relative z-10 flex flex-col h-full justify-between gap-4">
       <div className={`w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-100 dark:border-zinc-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex items-center justify-center ${iconColor}`}>
          <Icon name={icon as any} className="text-xl" />
       </div>
       <div>
         <p className="text-3xl font-black text-zinc-900 dark:text-zinc-100 leading-none mb-1 tracking-tight">{value}</p>
         <p className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase mb-2">{title}</p>
         {trend && <p className={`text-[9px] font-black tracking-widest uppercase ${trend.includes('+') ? 'text-emerald-500' : 'text-zinc-400'}`}>{trend}</p>}
       </div>
    </div>
  </div>
);

const AdminBentoLink = ({ to, title, subtitle, icon, highlight, iconColor, onClick }: any) => (
  <Link to={to} onClick={onClick} className={`bg-white dark:bg-zinc-900 p-6 rounded-3xl border ${highlight ? highlight : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'} shadow-sm hover:shadow-md transition-all group flex items-start space-x-4`}>
     <div className={`w-12 h-12 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border-2 border-zinc-100 dark:border-zinc-700/50 transition-colors shrink-0 shadow-[0_2px_10px_rgba(0,0,0,0.02)] ${iconColor || 'text-zinc-500 group-hover:text-black dark:text-white'}`}>
        <Icon name={icon as any} className="text-lg transition-transform group-hover:scale-110" />
     </div>
     <div>
        <h4 className={`text-sm font-bold mb-1 ${iconColor ? iconColor : 'text-zinc-900 dark:text-zinc-100'}`}>{title}</h4>
        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed pr-2">{subtitle}</p>
     </div>
  </Link>
);

export default AdminDashboard;
