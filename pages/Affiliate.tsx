import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { UserProfile, AffiliateLog } from '../types';
import Icon from '../components/Icon';
import { useNotify } from '../components/Notifications';
import { sendAffiliateRequestToTelegram } from '../services/telegram';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../components/ThemeContext';

const AffiliatePage: React.FC<{ userData: UserProfile | null }> = ({ userData }) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark, toggleTheme } = useTheme();
  const [logs, setLogs] = useState<AffiliateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCopying, setIsCopying] = useState(false);
  
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [tempCode, setTempCode] = useState('');
  const [savingCode, setSavingCode] = useState(false);
  const [configs, setConfigs] = useState<any>(null);
  
  useEffect(() => {
    getDoc(doc(db, 'settings', 'platform')).then(snap => {
       if(snap.exists()) setConfigs(snap.data());
    });
  }, []);
  
  const [formData, setFormData] = useState({
     fullName: '',
     phone: '',
     socialUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!userData) {
      if (!auth.currentUser) navigate('/auth-selector');
      return;
    }
    setTempCode(userData.affiliateCode || '');
    
    if (userData.isAffiliate) {
      const unsub = onSnapshot(query(collection(db, 'affiliates_log'), where('affiliateId', '==', userData.uid), orderBy('createdAt', 'desc')), (snapshot) => {
          const l: AffiliateLog[] = [];
          snapshot.forEach(doc => l.push({ id: doc.id, ...doc.data() } as AffiliateLog));
          setLogs(l);
          setLoading(false);
      });
      return () => unsub();
    } else {
      setLoading(false);
    }
  }, [userData, navigate]);

  if (loading || !userData) {
    return <div className="min-h-screen flex items-center justify-center"><Icon name="spinner-third" className="animate-spin text-lg text-zinc-900" /></div>;
  }

  const handleApplyAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!formData.fullName || !formData.phone) return notify("Please fill in required fields", "error");
    
    setSubmitting(true);
    try {
      const requestData = {
         userId: auth.currentUser!.uid,
         email: userData.email,
         displayName: userData.displayName,
         fullName: formData.fullName,
         phone: formData.phone,
         socialUrl: formData.socialUrl,
         status: 'pending',
         createdAt: Date.now()
      };
      await addDoc(collection(db, 'affiliate_requests'), requestData);
      
      await updateDoc(doc(db, 'users', auth.currentUser!.uid), {
         affiliateStatus: 'pending'
      });
      
      await sendAffiliateRequestToTelegram(requestData);
      
      notify("Application submitted successfully!", "success");
    } catch(e) {
      notify("Error submitting application", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!userData.isAffiliate) {
    if (userData.affiliateStatus === 'pending') {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] p-6 flex flex-col items-center justify-center text-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm max-w-sm w-full mx-auto">
               <div className="w-16 h-16 bg-amber-50 dark:bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon name="clock" className="text-lg" />
               </div>
               <h1 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">Application Reviewing</h1>
               <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-8">We are reviewing your affiliate application. This usually takes 24-48 hours. We'll update you soon.</p>
               <button onClick={() => navigate('/profile')} className="w-full py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-sm">
                  Back to Profile
               </button>
            </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] p-6 lg:p-12 pb-32 flex flex-col items-center justify-center">
        <div className="max-w-md w-full">
          <div className="flex items-center justify-between mb-8 px-1">
             <div className="flex items-center space-x-4">
               <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
                 <Icon name="arrow-left" className="text-xs" />
               </button>
               <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Partner Program</h1>
             </div>
             
             <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50">
                <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
                   <Icon name={isDark ? "sun" : "moon"} className="text-sm" />
                </button>
                <button onClick={() => navigate('/notifications')} className="w-10 h-10 flex items-center justify-center rounded-full relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
                   <Icon name="bell" className="text-sm" />
                   <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_0_2px_#f4f4f5] dark:shadow-[0_0_0_2px_#27272a] animate-pulse"></span>
                </button>
             </div>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">Partner & Earn</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">Join our exclusive network. Share your custom promo code to give your audience 5% OFF, and earn up to <span className="font-bold text-emerald-600 dark:text-emerald-400">৳200 commission</span> for every successful sale directly to your wallet based on your tier!</p>
          </div>
          
          <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-emerald-50 dark:bg-emerald-900/10 p-6 flex items-start gap-4 rounded-3xl border border-emerald-100 dark:border-emerald-800/30">
                <div>
                   <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">5% Flat Discount</h3>
                   <p className="text-xs text-emerald-700/80 dark:text-emerald-200/60 font-medium leading-relaxed">Your audience gets a flat discount on every purchase using your code.</p>
                </div>
             </div>
             <div className="bg-blue-50 dark:bg-blue-900/10 p-6 flex items-start gap-4 rounded-3xl border border-blue-100 dark:border-blue-800/30">
                <div>
                   <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1 tracking-tight">Tiered Commission</h3>
                   <p className="text-xs text-blue-700/80 dark:text-blue-200/60 font-medium leading-relaxed">The more you sell, the more you earn. Reach higher tiers for up to ৳200 per sale.</p>
                </div>
             </div>
          </div>
          
          <form onSubmit={handleApplyAffiliate} className="bg-white dark:bg-zinc-900/50 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-5">
             <div>
               <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2 block">Full Legal Name</label>
               <input 
                 type="text" 
                 required
                 placeholder="e.g. John Doe"
                 className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl font-medium text-sm outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors"
                 value={formData.fullName}
                 onChange={e => setFormData(p => ({...p, fullName: e.target.value}))}
               />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2 block">Phone Number</label>
               <input 
                 type="tel" 
                 required
                 placeholder="01XXXXXXXXX"
                 className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl font-medium text-sm outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors"
                 value={formData.phone}
                 onChange={e => setFormData(p => ({...p, phone: e.target.value}))}
               />
             </div>
             <div>
               <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-1 block">Social Profile / Website</label>
               <p className="text-[10px] text-zinc-500 mb-2">Optional. Helps us verify your reach.</p>
               <input 
                 type="url" 
                 placeholder="https://facebook.com/yourprofile"
                 className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl font-medium text-sm outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 dark:focus:border-zinc-300 transition-colors"
                 value={formData.socialUrl}
                 onChange={e => setFormData(p => ({...p, socialUrl: e.target.value}))}
               />
             </div>
             
             <button disabled={submitting} type="submit" className="w-full py-4 mt-6 bg-zinc-900 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 active:scale-95 transition-all outline-none flex items-center justify-center disabled:opacity-50">
                {submitting ? <Icon name="spinner" className="animate-spin mr-2" /> : null}
                {submitting ? "Submitting..." : "Apply Now"}
             </button>
          </form>
        </div>
      </div>
    );
  }

  const getConfigVal = (key: string, fallback: number) => configs?.[key] ?? fallback;
  
  const minWithdrawal = getConfigVal('affiliateMinWithdrawal', 50);
  const t1Limit = getConfigVal('affiliateTier1Threshold', 3);
  const t1Comm = getConfigVal('affiliateTier1Commission', 50);
  const t2Limit = getConfigVal('affiliateTier2Threshold', 10);
  const t2Comm = getConfigVal('affiliateTier2Commission', 100);
  const t3Limit = getConfigVal('affiliateTier3Threshold', 20);
  const t3Comm = getConfigVal('affiliateTier3Commission', 150);
  const t4Limit = getConfigVal('affiliateTier4Threshold', 30);
  const t4Comm = getConfigVal('affiliateTier4Commission', 200);

  const salesCount = logs.length;
  
  let currentTier = 1;
  let currentTarget = t1Limit;
  let prevTarget = 0;
  let currentCommission = t1Comm;
  let nextCommission = t2Comm;

  if (salesCount >= t3Limit) {
      currentTier = 4;
      prevTarget = t3Limit;
      currentTarget = t4Limit;
      currentCommission = t4Comm;
      nextCommission = t4Comm;
  } else if (salesCount >= t2Limit) {
      currentTier = 3;
      prevTarget = t2Limit;
      currentTarget = t3Limit;
      currentCommission = t3Comm;
      nextCommission = t4Comm;
  } else if (salesCount >= t1Limit) {
      currentTier = 2;
      prevTarget = t1Limit;
      currentTarget = t2Limit;
      currentCommission = t2Comm;
      nextCommission = t3Comm;
  }
  
  let progressPercent = 0;
  if (currentTier === 4 && salesCount >= t4Limit) {
      progressPercent = 100;
  } else {
      progressPercent = Math.min(100, Math.max(0, ((salesCount - prevTarget) / (currentTarget - prevTarget)) * 100));
  }

  const affiliateCode = userData.affiliateCode || `AFF-${userData.uid.substring(0, 6).toUpperCase()}`;
  const shareLink = `${window.location.origin}/?ref=${affiliateCode}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopying(true);
      notify("Copied!", "success");
      setTimeout(() => setIsCopying(false), 2000);
    } catch(err) {
      notify("Failed to copy", "error");
    }
  };

  const handleSaveCode = async () => {
     let userCode = tempCode.trim().toUpperCase();
     if (!userCode || userCode.length < 3) return notify("Code must be at least 3 characters", "error");
     if (!/^[A-Z0-9_-]+$/.test(userCode)) return notify("Only letters, numbers, hyphens and underscores allowed", "error");

     const code = userCode;

     const reservedWords = ['TEST', 'USER', 'ADMIN', 'SYSTEM', 'DEFAULT', 'PROMO', 'DISCOUNT'];
     if (reservedWords.includes(userCode) && userData.role !== 'admin') {
         return notify("This promo code name is reserved. Choose another name.", "error");
     }

     if (code === userData.affiliateCode) {
        setIsEditingCode(false);
        return;
     }

     setSavingCode(true);
     try {
       // Check if coupon exists
       const couponQ = query(collection(db, 'coupons'), where('code', '==', code));
       const snap = await getDocs(couponQ);
       if (!snap.empty) {
          notify("This promo code is already taken!", "error");
          setSavingCode(false);
          return;
       }

       // Update user document
       await updateDoc(doc(db, 'users', userData.uid), { affiliateCode: code });
       
       // Add new coupon
       await addDoc(collection(db, 'coupons'), {
          code: code,
          discount: 5,
          type: 'percent',
          maxUses: 999999,
          usedCount: 0,
          isActive: true,
          isAffiliate: true,
          affiliateId: userData.uid,
          createdAt: Date.now()
       });

       notify("Custom promo code saved!", "success");
       setIsEditingCode(false);
     } catch(e) {
       notify("Failed to save code", "error");
     }
     setSavingCode(false);
  };

   // Compute chart data
   const getChartData = () => {
      const last12Months = Array.from({length: 6}).map((_, i) => {
         const d = new Date();
         d.setMonth(d.getMonth() - i);
         return {
            month: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            earned: 0,
            sales: 0
         };
      }).reverse();

      logs.forEach((log: any) => {
         const d = new Date(log.createdAt);
         const month = d.toLocaleString('default', { month: 'short' });
         const year = d.getFullYear();
         const match = last12Months.find(m => m.month === month && m.year === year);
         if (match) {
            match.earned += (log.commission || 0);
            match.sales += 1;
         }
      });
      return last12Months;
   };

   const chartData = getChartData();

  return (
     <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen font-inter pb-32">
        <div className="flex items-center justify-between mb-10 relative z-10">
          <div className="flex items-center space-x-6">
            <button onClick={() => navigate('/profile')} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm hover:bg-zinc-900 hover:text-white transition-all active:scale-90 group hover-tilt">
              <Icon name="chevron-left" className="text-xs group-hover:-translate-x-1 transition-transform" />
            </button>
            <div className="flex flex-col">
               <h1 className="text-lg md:text-xl lg:text-base xl:text-sm font-semibold tracking-tight uppercase text-shine">Partners.</h1>
               <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-normal mt-1 pl-1">Affiliate Portal</p>
            </div>
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50">
             <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
                <Icon name={isDark ? "sun" : "moon"} className="text-sm" />
             </button>
             <button onClick={() => navigate('/notifications')} className="w-10 h-10 flex items-center justify-center rounded-full relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
               <Icon name="bell" className="text-sm" />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_0_2px_#f4f4f5] dark:shadow-[0_0_0_2px_#27272a] animate-pulse"></span>
             </button>
          </div>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          <div className="lg:col-span-8 bg-gradient-to-br from-[#06331e] to-emerald-900 text-white p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden shadow-2xl flex flex-col justify-between group">
             <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Icon name="chart-line" className="text-[16rem]" />
             </div>
             
             <div className="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
               <div>
                 <div className="flex items-center space-x-2 text-emerald-300 mb-3 bg-white/10 w-max px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
                   <Icon name="wallet" className="text-sm" />
                   <p className="text-[10px] font-bold uppercase tracking-normal">Available Balance</p>
                 </div>
                 <h2 className="text-lg md:text-7xl font-semibold tracking-tight truncate drop-shadow-lg">৳{userData.walletBalance || 0}</h2>
               </div>
               
               <div className="flex flex-col gap-2 shrink-0">
                  <div className="text-right">
                     <p className="text-[10px] uppercase font-bold text-emerald-300/80 tracking-normal mb-1">Total Lifetime</p>
                     <p className="text-xl font-semibold">৳{(userData.walletBalance || 0) + (logs.reduce((acc: any, log: any) => acc + (log.commission || 0), 0) || 0)}</p>
                  </div>
               </div>
             </div>
             
             <div className="flex flex-col sm:flex-row gap-4 relative z-10 w-full">
                <button 
                  onClick={() => navigate('/withdraw')} 
                  className="bg-white text-[#06331e] px-8 py-4 rounded-2xl font-semibold uppercase tracking-normal hover:bg-zinc-100 transition-all shadow-xl shadow-black/20 flex-1 flex items-center justify-center space-x-2 text-xs hover:-translate-y-1 active:scale-95"
                >
                  <Icon name="money-bill" className="text-sm" />
                  <span>Withdraw Funds</span>
                </button>
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex-1 flex items-center justify-between">
                   <div>
                     <p className="text-[10px] uppercase font-bold text-emerald-200 tracking-normal mb-1">Current Tier</p>
                     <p className="font-semibold text-sm uppercase">Level {currentTier}</p>
                   </div>
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                     <Icon name="medal" className="text-xl text-yellow-400 drop-shadow-md" />
                   </div>
                </div>
             </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group">
               <div className="z-10 relative">
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-[10px] font-semibold uppercase tracking-normal text-zinc-400">Next Goal</h2>
                     <span className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-normal">+ {nextCommission}৳ / Sale</span>
                  </div>
                  
                  <div className="flex items-end gap-2 mb-4">
                     <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{salesCount}</h3>
                     <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-normal mb-2">/ {currentTarget} Sales</p>
                  </div>

                  <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-black/5 dark:border-white/5 mb-4 shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="absolute h-full left-0 top-0 bg-gradient-to-r from-emerald-400 via-teal-500 to-emerald-600 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></motion.div>
                  </div>
                  
                  {currentTier === 4 && salesCount >= t4Limit ? (
                     <p className="text-[10px] font-semibold text-emerald-500 flex items-center bg-emerald-50 dark:bg-emerald-900/10 px-3 py-1.5 rounded-full w-max border border-emerald-100 dark:border-emerald-900/30">
                        <Icon name="check-circle" className="mr-2 text-sm" /> MAX TIER ACTIVE
                     </p>
                  ) : (
                     <p className="text-[10px] uppercase font-bold text-zinc-500 leading-relaxed">
                        <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{currentTarget - salesCount} more sales</span> needed to activate Level {currentTier + 1} commission.
                     </p>
                  )}
               </div>
               <div className="absolute right-0 bottom-0 opacity-5 translate-x-1/4 translate-y-1/4 pointer-events-none group-hover:rotate-12 transition-transform duration-700">
                 <Icon name="rocket" className="text-[12rem]" />
               </div>
            </div>
          </div>
       </div>

       <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 overflow-hidden relative hidden md:block">
          <div className="flex justify-between items-center mb-6 z-10 relative">
             <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Performance Over Time</h2>
             <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-normal text-zinc-400">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Sales</div>
             </div>
          </div>
          <div className="h-56 w-full relative z-10 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} allowDecimals={false} />
                  <Tooltip 
                     cursor={{ stroke: '#ecfdf5', strokeWidth: 2, strokeDasharray: '4 4' }}
                     contentStyle={{ backgroundColor: 'white', borderRadius: '1.5rem', border: '1px solid #f4f4f5', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }} 
                     itemStyle={{ fontSize: '14px', fontWeight: '900', color: '#10b981' }}
                     labelStyle={{ fontSize: '10px', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', marginBottom: '4px' }}
                  />
                  <Area type="monotone" dataKey="sales" name="Total Sales" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorSales)" />
               </AreaChart>
            </ResponsiveContainer>
          </div>
       </div>

       <div className="bg-white dark:bg-zinc-900 p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 relative z-10">
             <div>
               <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">Your Promotion Hub</h2>
               <p className="text-xs text-zinc-500 font-medium max-w-md leading-relaxed">Share your code everywhere. Customers get <span className="font-bold text-emerald-600 dark:text-emerald-400">5% OFF</span> instantly, and you earn <span className="font-bold text-emerald-600 dark:text-emerald-400">{currentCommission}৳</span> immediately upon delivery.</p>
             </div>
             
             <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 px-4 py-2 rounded-2xl flex items-center space-x-3 w-full md:w-auto">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800/50 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400"><Icon name="tag" /></div>
                <div>
                   <p className="text-[9px] uppercase font-bold text-emerald-600/70 dark:text-emerald-400/70 tracking-normal mb-0.5">Your Rate</p>
                   <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{currentCommission}৳ / Sale</p>
                </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
             <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-700/50">
               <label className="text-[10px] font-bold uppercase tracking-normal text-zinc-400 mb-3 block">Custom Promo Code</label>
               {isEditingCode ? (
                  <div className="flex bg-white dark:bg-zinc-900 border-2 border-emerald-500 p-1.5 rounded-2xl transition-all h-14 shadow-sm">
                    <input type="text" value={tempCode} onChange={e => setTempCode(e.target.value.toUpperCase())} className="flex-1 bg-transparent px-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none uppercase tracking-normal min-w-0" placeholder="e.g. VIBEGADGET" />
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={handleSaveCode} disabled={savingCode} className="h-full w-12 flex items-center justify-center bg-[#06331e] text-white rounded-xl shadow-md hover:bg-zinc-900 transition-colors">
                        {savingCode ? <Icon name="spinner-third" className="animate-spin text-sm" /> : <Icon name="check" className="text-sm" />}
                      </button>
                      <button onClick={() => { setIsEditingCode(false); setTempCode(userData.affiliateCode || ''); }} className="h-full w-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <Icon name="times" className="text-sm" />
                      </button>
                    </div>
                  </div>
               ) : (
                  <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-2xl transition-all h-14 shadow-sm group">
                    <input type="text" readOnly value={affiliateCode} className="flex-1 bg-transparent px-4 text-base font-semibold text-emerald-600 dark:text-emerald-400 outline-none uppercase tracking-normal min-w-0" />
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setIsEditingCode(true)} className="h-full px-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[10px] font-bold uppercase tracking-normal">
                        Edit
                      </button>
                      <button onClick={() => copyToClipboard(affiliateCode)} className="h-full px-5 flex items-center justify-center bg-[#06331e] text-white rounded-xl hover:bg-zinc-900 transition-colors text-[10px] font-bold uppercase tracking-normal shadow-md">
                        {isCopying ? 'Copied!' : 'Copy Code'}
                      </button>
                    </div>
                  </div>
               )}
             </div>

             <div className="bg-zinc-50 dark:bg-zinc-800/50 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-700/50">
               <label className="text-[10px] font-bold uppercase tracking-normal text-zinc-400 mb-3 block transform-gpu">Direct Referral Link</label>
               <div className="flex bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 p-1.5 rounded-2xl transition-all h-14 shadow-sm group">
                 <div className="flex items-center justify-center w-10 text-zinc-300 dark:text-zinc-600">
                    <Icon name="link" />
                 </div>
                 <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent pr-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 outline-none min-w-0 truncate" />
                 <button onClick={() => copyToClipboard(shareLink)} className="h-full px-5 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-[10px] font-bold uppercase tracking-normal">
                   {isCopying ? <Icon name="check" /> : 'Copy'}
                 </button>
               </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
           <div className="flex items-center justify-between mb-6 px-2">
             <h3 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Transaction History</h3>
             <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-normal bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">{logs.length} Sales</span>
           </div>
           
           {logs.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-zinc-900 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-zinc-800 shadow-sm">
                 <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon name="receipt" className="text-xl text-zinc-300 dark:text-zinc-600" />
                 </div>
                 <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No transactions yet</h4>
                 <p className="text-[11px] font-medium text-zinc-500 max-w-xs mx-auto leading-relaxed">Your earnings will appear here once customers receive their orders using your code.</p>
              </div>
           ) : (
              <div className="bg-white dark:bg-zinc-900 p-3 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col gap-2">
                 {logs.map(log => (
                    <div key={log.id} className="flex items-center justify-between py-4 px-5 bg-zinc-50 dark:bg-zinc-800/30 rounded-3xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors group">
                       <div className="flex items-center overflow-hidden pr-4">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mr-4 shadow-inner group-hover:scale-105 transition-transform">
                             <Icon name="arrow-down-left" className="text-sm" />
                          </div>
                          <div className="truncate">
                             <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate mb-1">Sale Commission</p>
                             <p className="text-[10px] font-bold text-zinc-500 flex items-center gap-2">
                               <span>{new Date(log.createdAt).toLocaleDateString()}</span>
                               <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700"></span>
                               <span className="truncate max-w-[100px] sm:max-w-[150px]">{log.customerName || 'Customer'}</span>
                             </p>
                          </div>
                       </div>
                       <div className="shrink-0 text-right">
                          <p className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">+৳{log.commission}</p>
                          <p className="text-[9px] font-bold text-emerald-600/50 uppercase tracking-normal mt-0.5">Added to Wallet</p>
                       </div>
                    </div>
                 ))}
              </div>
           )}
         </div>

         <div className="lg:col-span-1">
            <div className="bg-zinc-900 dark:bg-zinc-50 p-8 rounded-[2.5rem] text-white dark:text-zinc-900 shadow-xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
               <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 dark:bg-black/5 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-md">
                     <Icon name="bullhorn" className="text-xl" />
                  </div>
                  <h3 className="text-xl font-semibold tracking-tight mb-3">Marketing Tips</h3>
                  <ul className="space-y-5 mb-4">
                     <li className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5 shadow-sm">
                           <Icon name="check" className="text-emerald-400 dark:text-emerald-600 text-[10px]" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">Add your code to your Instagram & TikTok bios.</p>
                     </li>
                     <li className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5 shadow-sm">
                           <Icon name="check" className="text-emerald-400 dark:text-emerald-600 text-[10px]" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">Share our daily offers and mention your code gives extra 5% off.</p>
                     </li>
                     <li className="flex items-start gap-4">
                        <div className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/20 mt-0.5 shadow-sm">
                           <Icon name="check" className="text-emerald-400 dark:text-emerald-600 text-[10px]" />
                        </div>
                        <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 leading-relaxed">Unbox products and vocally remind viewers to use your code.</p>
                     </li>
                  </ul>
               </div>
            </div>
         </div>
       </div>
       <div className="h-20" />
     </div>
  );
};

export default AffiliatePage;
