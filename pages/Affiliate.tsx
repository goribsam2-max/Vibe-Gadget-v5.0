import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { UserProfile, AffiliateLog } from '../types';
import Icon from '../components/Icon';
import { useNotify } from '../components/Notifications';
import { sendAffiliateRequestToTelegram } from '../services/telegram';
import { motion } from 'framer-motion';

const AffiliatePage: React.FC<{ userData: UserProfile | null }> = ({ userData }) => {
  const navigate = useNavigate();
  const notify = useNotify();
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
    return <div className="min-h-screen flex items-center justify-center"><Icon name="spinner-third" className="animate-spin text-4xl text-zinc-900" /></div>;
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
                  <Icon name="clock" className="text-2xl" />
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
          <div className="flex items-center space-x-4 mb-8">
            <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors">
              <Icon name="arrow-left" className="text-xs" />
            </button>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Partner Program</h1>
          </div>

          <div className="mb-8">
            <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed">Join our exclusive network. Share your custom promo code to give your audience 5% OFF, and earn up to <span className="font-semibold text-zinc-900 dark:text-white">৳200</span> for every successful sale directly to your wallet based on your tier!</p>
          </div>
          
          <form onSubmit={handleApplyAffiliate} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-6">
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
             
             <button disabled={submitting} type="submit" className="w-full mt-4 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-black dark:hover:bg-zinc-200 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center">
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
     const code = tempCode.trim().toUpperCase();
     if (!code || code.length < 3) return notify("Code must be at least 3 characters", "error");
     if (!/^[A-Z0-9_-]+$/.test(code)) return notify("Only letters, numbers, hyphens and underscores allowed", "error");
     
     const reservedWords = ['TEST', 'USER', 'ADMIN', 'SYSTEM', 'DEFAULT', 'PROMO', 'DISCOUNT'];
     if (reservedWords.includes(code) && userData.role !== 'admin') {
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

  return (
     <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen font-inter pb-32">
       <div className="flex items-center space-x-4 mb-8">
         <button onClick={() => navigate('/profile')} className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-full transition-colors shadow-sm">
           <Icon name="arrow-left" className="text-xs" />
         </button>
         <h1 className="text-2xl font-black tracking-tight uppercase text-zinc-900 dark:text-zinc-100">Affiliate Portal</h1>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-7 bg-gradient-to-br from-[#06331e] to-emerald-900 text-white p-8 md:p-10 rounded-[2rem] relative overflow-hidden shadow-lg shadow-emerald-900/20 flex flex-col justify-between">
             <div className="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4 pointer-events-none">
               <Icon name="chart-line" className="text-[12rem]" />
             </div>
             
             <div>
               <div className="flex items-center space-x-2 text-emerald-300 mb-2">
                 <Icon name="wallet" className="text-sm" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">Available Balance</p>
               </div>
               <h2 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter truncate">৳{userData.walletBalance || 0}</h2>
             </div>
             
             <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                <button 
                  onClick={() => navigate('/withdraw')} 
                  className="bg-white text-[#06331e] px-6 py-3.5 rounded-xl font-bold uppercase tracking-widest hover:bg-zinc-100 transition-colors shadow-xl w-full sm:w-auto flex items-center justify-center space-x-2 text-xs"
                >
                  <span>Withdraw Funds</span>
                  <Icon name="arrow-right" className="text-[10px]" />
                </button>
             </div>
          </div>

          <div className="md:col-span-5 flex flex-col gap-6">
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col justify-between h-full relative overflow-hidden">
               <div className="z-10 relative">
                  <div className="flex items-center justify-between mb-3">
                     <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Tier Levels</h2>
                     <span className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">Lvl {currentTier}</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
                    Progress
                  </h3>
                  <div className="flex justify-between items-center mb-1.5 mt-2">
                     <span className="text-[10px] uppercase font-bold text-zinc-400">{salesCount} Sales</span>
                     <span className="text-[10px] uppercase font-bold text-emerald-500">{currentCommission}৳ / Sale</span>
                  </div>
                  <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden relative border border-black/5 dark:border-white/5">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${progressPercent}%` }} transition={{ duration: 1, ease: 'easeOut' }} className="absolute h-full left-0 top-0 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></motion.div>
                  </div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 text-right mt-1.5">
                     {currentTier === 4 && salesCount >= t4Limit ? 'Max Tier Reached' : `${currentTarget - salesCount} more for ${nextCommission}৳/sale`}
                  </p>
               </div>
               <div className="absolute right-0 bottom-0 opacity-5 translate-x-1/4 translate-y-1/4 pointer-events-none">
                 <Icon name="rocket" className="text-[10rem]" />
               </div>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
               <div className="flex items-center space-x-3 text-zinc-900 dark:text-zinc-100 font-black tracking-tight mb-2">
                 <Icon name="bolt" className="text-amber-500 text-lg" />
                 <span>How it Works</span>
               </div>
               <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                 Share your Custom Promo Code everywhere. When customers check out using your code, they get immediate discounts, and your account credits automatically after order completion.
               </p>
            </div>
          </div>
       </div>

       <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm mb-8">
          <div className="flex items-center justify-between mb-4">
             <div>
               <h2 className="text-sm font-black uppercase tracking-tight text-zinc-800 dark:text-zinc-200 mb-1">Your Custom Promo Code</h2>
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">5% OFF for customers • {currentCommission}৳ for you</p>
             </div>
             <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-200">Active</span>
          </div>
          
          <div className="flex flex-col gap-3 mt-6">
            {isEditingCode ? (
               <div className="flex bg-zinc-50 dark:bg-zinc-800/50 border-2 border-emerald-500 p-1.5 rounded-2xl transition-all h-14">
                 <input type="text" value={tempCode} onChange={e => setTempCode(e.target.value.toUpperCase())} className="flex-1 bg-transparent px-3 text-sm font-black text-zinc-800 dark:text-zinc-200 outline-none uppercase tracking-widest min-w-0" placeholder="e.g. VIBEGADGET" />
                 <div className="flex gap-1.5 shrink-0">
                   <button onClick={handleSaveCode} disabled={savingCode} className="h-full w-12 flex items-center justify-center bg-[#06331e] text-white rounded-xl shadow-md">
                     {savingCode ? <Icon name="spinner-third" className="animate-spin text-sm" /> : <Icon name="check" className="text-sm" />}
                   </button>
                   <button onClick={() => { setIsEditingCode(false); setTempCode(userData.affiliateCode || ''); }} className="h-full w-12 flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-xl hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                     <Icon name="times" className="text-sm" />
                   </button>
                 </div>
               </div>
            ) : (
               <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-500/20 p-2 rounded-2xl group relative overflow-hidden h-14 shadow-inner">
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                 <input type="text" readOnly value={affiliateCode} className="bg-transparent px-3 text-sm md:text-base font-black text-emerald-700 dark:text-emerald-400 outline-none uppercase tracking-[0.2em] relative z-10 flex-1 min-w-0 truncate" />
                 <div className="flex items-center gap-1.5 shrink-0 z-10 h-full">
                   <button onClick={() => setIsEditingCode(true)} className="h-full px-4 flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors">
                     <Icon name="edit" className="md:mr-2 text-[10px]" /> <span className="hidden md:inline">Edit</span>
                   </button>
                   <button 
                     onClick={() => copyToClipboard(affiliateCode)}
                     className="h-full px-4 flex items-center justify-center bg-emerald-600 outline-none text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-md hover:bg-emerald-700 transition-colors"
                   >
                     {isCopying ? <><Icon name="check" className="md:mr-2 text-[10px]" /> <span className="hidden md:inline">Copied</span></> : <><Icon name="copy" className="md:mr-2 text-[10px]" /> <span className="hidden md:inline">Copy</span></>}
                   </button>
                 </div>
               </div>
            )}
            
            <div className="flex items-center bg-zinc-50 dark:bg-zinc-800/30 border border-zinc-200 dark:border-zinc-800 p-2 rounded-2xl group relative overflow-hidden h-14 mt-2">
               <div className="px-3 shrink-0 text-zinc-400">
                 <Icon name="link" className="text-xs" />
               </div>
               <input type="text" readOnly value={shareLink} className="flex-1 bg-transparent pr-3 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 outline-none truncate relative z-10" />
               <button 
                 onClick={() => copyToClipboard(shareLink)}
                 className="h-full px-4 flex items-center justify-center bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors shrink-0 shadow-sm active:scale-95 text-[10px] font-bold uppercase tracking-widest relative z-10"
               >
                 {isCopying ? <Icon name="check" className="text-[10px]" /> : 'Copy Link'}
               </button>
            </div>
          </div>
       </div>

       <div>
         <div className="flex items-center justify-between mb-4 px-2">
           <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">Successful Referrals</h3>
           <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{logs.length} total</span>
         </div>
         
         {logs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-[2rem] border border-dashed border-zinc-200 dark:border-zinc-800">
               <Icon name="users-slash" className="text-3xl text-zinc-300 dark:text-zinc-700 mb-4" />
               <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">No earnings yet. Start sharing!</p>
            </div>
         ) : (
            <div className="bg-white dark:bg-zinc-900 p-2 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col gap-1.5">
               {logs.map(log => (
                  <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-zinc-50 dark:bg-zinc-800/30 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                     <div className="flex items-center overflow-hidden pr-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mr-3 hidden sm:flex">
                           <Icon name="check-circle" className="text-xs" />
                        </div>
                        <div className="truncate">
                           <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate pb-0.5">Order from {log.customerName || 'Customer'}</p>
                           <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-widest">{new Date(log.createdAt).toLocaleDateString()}</p>
                        </div>
                     </div>
                     <div className="shrink-0">
                        <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900 shadow-sm text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                          +৳ {log.commission}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
         )}
       </div>
       <div className="h-20" />
     </div>
  );
};

export default AffiliatePage;
