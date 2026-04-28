
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signOut, updateProfile } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { uploadToImgbb } from '../services/imgbb';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';

import { useTheme } from '../components/ThemeContext';

const Profile: React.FC<{ userData: UserProfile | null }> = ({ userData: initialUserData }) => {
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [updating, setUpdating] = useState(false);
  const [localUserData, setLocalUserData] = useState<UserProfile | null>(initialUserData);
  
  const [showSpinModal, setShowSpinModal] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);

  useEffect(() => { 
    setLocalUserData(initialUserData); 
  }, [initialUserData]);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('f_cart');
    navigate('/auth-selector');
  };

  const menuItems = [
    { label: 'My Orders', icon: 'shopping-bag', path: '/orders', desc: 'Track and view your orders' },
    { label: 'Blog', icon: 'newspaper', path: '/blog', desc: 'Tech news and reviews' },
    { label: localUserData?.isAffiliate ? 'Affiliate Portal' : 'Join Affiliate Program', icon: 'money-bill-wave', path: '/affiliate', desc: localUserData?.isAffiliate ? 'Promote and earn commission' : 'Become an affiliate and earn' },
    { label: 'My Wishlist', icon: 'heart', path: '/wishlist', desc: 'View saved products' },
    { label: 'Account Settings', icon: 'user-cog', path: '/settings', desc: 'Manage your profile and security' },
    { label: 'Help Center', icon: 'headset', path: '/help-center', desc: 'Contact customer support' },
    { label: 'Privacy Policy', icon: 'user-shield', path: '/privacy', desc: 'Read our privacy policy' },
    { label: 'Terms & Conditions', icon: 'shield-check', path: '/terms', desc: 'Read our terms and conditions' },
    { label: 'About Us', icon: 'info-circle', path: '/about', desc: 'Learn more about VibeGadget' },
    { label: 'Contact Us', icon: 'envelope', path: '/contact', desc: 'Get in touch with us' },
    { label: 'Site Map', icon: 'share-alt', path: '/sitemap-page', desc: 'View all pages' }
  ];

  const isAdmin = localUserData?.role === 'admin' || 
                  localUserData?.email?.toLowerCase().trim() === 'admin@vibe.shop' ||
                  localUserData?.role === 'staff';

  const userPoints = localUserData?.points || 0;
  const lastSpinDate = localUserData?.lastSpinDate || '';
  const canSpin = lastSpinDate !== new Date().toISOString().split('T')[0];
  const nextTierLimit = userPoints < 1000 ? 1000 : userPoints < 5000 ? 5000 : 10000;
  const tierName = userPoints < 1000 ? 'Silver Tier' : userPoints < 5000 ? 'Gold Tier' : 'Platinum Tier';
  const progressPercent = Math.min(100, Math.max(0, (userPoints / nextTierLimit) * 100));

  const handleSpin = async () => {
     if (!canSpin) return notify("You already spun today! Come back tomorrow.", "info");
     if (!localUserData || !auth.currentUser) return;
     
     setSpinning(true);
     // Simulate wheel spinning duration
     await new Promise(r => setTimeout(r, 2000));
     
     const won = [10, 20, 50, 100][Math.floor(Math.random() * 4)];
     const newPoints = userPoints + won;
     const today = new Date().toISOString().split('T')[0];
     
     try {
       await updateDoc(doc(db, 'users', auth.currentUser.uid), {
         points: newPoints,
         lastSpinDate: today
       });
       setLocalUserData(prev => prev ? { ...prev, points: newPoints, lastSpinDate: today } : null);
       setSpinResult(won);
     } catch(e) {
       notify("Failed to save reward", "error");
     }
     setSpinning(false);
  };

  const handleRedeem = async () => {
    if (userPoints < 500) return notify("You need at least 500 points to redeem a coupon.", "error");
    if (!auth.currentUser) return;
    try {
       setUpdating(true);
       await updateDoc(doc(db, 'users', auth.currentUser.uid), {
         points: userPoints - 500
       });
       setLocalUserData(prev => prev ? { ...prev, points: userPoints - 500 } : null);
       notify("Success! 500 points redeemed. Use code VIBE500 at checkout for discount.", "success");
    } catch(e) {
       notify("Failed to redeem points", "error");
    } finally {
       setUpdating(false);
    }
  };

  return (
    <div className="p-6 md:p-12 pb-24 bg-zinc-50 dark:bg-zinc-800 max-w-2xl mx-auto min-h-screen">
       {localUserData ? (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-16 mt-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
               <div className="flex items-center space-x-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] border border-zinc-100 dark:border-zinc-800 overflow-hidden shadow-sm"
                  >
                     <img src={localUserData?.photoURL || `https://ui-avatars.com/api/?name=${localUserData.displayName}&background=000&color=fff`} className="w-full h-full object-cover" alt="Profile" referrerPolicy="no-referrer" />
                  </motion.div>
                  
                  <div>
                     <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">{localUserData?.displayName}</h2>
                     <p className="text-zinc-500 text-xs font-medium mb-3">{localUserData?.email}</p>
                     <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-lg text-[10px] font-bold uppercase tracking-widest leading-none flex w-max">{isAdmin ? 'Admin' : 'Member'}</span>
                  </div>
               </div>
               
               <button onClick={() => navigate('/profile/edit')} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 rounded-xl shadow-sm hover:bg-zinc-900 hover:text-white hover:border-black transition-all active:scale-95 group shrink-0">
                   <Icon name="edit" className="text-sm" />
               </button>
            </div>

            {localUserData?.isAffiliate && (
              <div className="mb-10 bg-gradient-to-br from-black to-zinc-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 blur-[80px] opacity-20 rounded-full transition-transform group-hover:scale-150 duration-700"></div>
                  <div className="flex items-center justify-between mb-4 relative z-10">
                     <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#4ade80]">Affiliate Program</p>
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-2">Your Earnings</h3>
                     </div>
                     <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-900/10 border border-white/20 rounded-full flex items-center justify-center backdrop-blur-md shadow-inner">
                        <Icon name="wallet" className="text-emerald-400 text-lg" />
                     </div>
                  </div>
                  
                  <div className="relative z-10 mb-5 flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Wallet Balance</p>
                       <p className="text-3xl font-black text-white">৳{localUserData?.walletBalance || 0}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">Total Earned</p>
                       <p className="text-xl font-black text-zinc-300">৳{localUserData?.totalEarned || 0}</p>
                     </div>
                  </div>
                  
                  <div className="relative z-10 flex gap-3">
                     <button onClick={() => navigate('/affiliate')} className="flex-1 bg-zinc-50 dark:bg-zinc-800 text-black dark:text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-colors shadow-lg active:scale-95 text-center block">
                        Manage Affiliate
                     </button>
                  </div>
               </div>
            )}

            {/* Vibe Rewards Section Removed */}

            <div className="space-y-3">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 ml-4">Dashboard</h3>
               {isAdmin && (
                 <Link to="/admin" className="flex items-center justify-between p-5 px-6 bg-emerald-900 dark:bg-emerald-800 rounded-[2rem] hover:bg-emerald-950 dark:hover:bg-emerald-700 shadow-xl shadow-emerald-900/10 transition-all group overflow-hidden mb-6 relative hover-tilt">
                    <div className="absolute right-[-10%] top-[-20%] text-emerald-500/20 group-hover:scale-110 transition-transform pointer-events-none">
                       <Icon name="cog" className="text-9xl animate-[spin_10s_linear_infinite]" />
                    </div>
                    <div className="flex items-center space-x-5 z-10">
                       <div className="w-12 h-12 bg-white/10 backdrop-blur-md text-white rounded-[1.2rem] flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                           <Icon name="shield-alt" className="text-lg drop-shadow-sm" />
                       </div>
                       <div>
                           <div className="font-black tracking-tight text-lg text-white">Admin Portal</div>
                           <div className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest mt-0.5">Manage Configuration</div>
                       </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white z-10 group-hover:bg-white transition-colors group-hover:text-emerald-900">
                        <Icon name="arrow-right" className="text-sm group-hover:translate-x-0.5 transition-transform" />
                    </div>
                 </Link>
               )}
               
               <div className="h-px w-full bg-zinc-200 dark:bg-zinc-800 my-8"></div>
               
               <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-4 ml-4">Your Account</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
               {menuItems.map((item, idx) => (
                 <Link key={idx} to={item.path} className="flex items-center justify-between p-5 px-6 bg-zinc-100/50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-700/50 hover:bg-zinc-100 hover:border-zinc-300 dark:hover:bg-zinc-800/80 dark:hover:border-zinc-600 rounded-3xl transition-all group">
                    <div className="flex items-center space-x-5">
                       <div className="w-12 h-12 rounded-[1.2rem] bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm border border-zinc-100 dark:border-zinc-800 group-hover:scale-110 group-hover:rotate-3 transition-transform text-zinc-600 dark:text-zinc-300">
                          <Icon name={item.icon} className="text-lg" />
                       </div>
                       <div>
                           <div className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 mb-0.5">{item.label}</div>
                           <div className="text-[10px] font-semibold text-zinc-500 line-clamp-1">{item.desc}</div>
                       </div>
                    </div>
                    <Icon name="chevron-right" className="text-xs text-zinc-300 group-hover:text-emerald-500 transition-colors group-hover:translate-x-1" />
                 </Link>
               ))}
               </div>

                <div className="pt-8">
                   <button onClick={handleLogout} className="w-full flex items-center justify-center py-5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors font-bold text-xs uppercase tracking-widest active:scale-95 space-x-2 shadow-sm">
                      <Icon name="sign-out-alt" className="text-sm" />
                      <span>Log Out Securely</span>
                   </button>
               </div>
            </div>
          </div>
       ) : (
          <div className="flex flex-col items-center justify-center text-center py-40 animate-fade-in">
             <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-8 shadow-inner border border-zinc-100 dark:border-zinc-800">
               <Icon name="user" className="text-3xl text-zinc-300" />
             </div>
             <h2 className="text-3xl font-black mb-4 tracking-tight text-zinc-900 dark:text-zinc-100">Sign In to Continue</h2>
             <p className="text-sm font-medium text-zinc-500 mb-10 max-w-xs leading-relaxed">Log in to view your profile, track orders, and manage wishlist.</p>
             <button onClick={() => navigate('/auth-selector')} className="px-10 py-4 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-full font-bold text-[11px] uppercase tracking-widest shadow-xl hover:bg-zinc-800 hover:scale-105 active:scale-95 transition-all flex items-center space-x-3">
               <span>Sign In</span>
               <Icon name="arrow-right" />
             </button>
          </div>
       )}

     {/* Daily Spin Modal */}
     <AnimatePresence>
       {showSpinModal && (
         <div className="fixed inset-0 z-[200] bg-zinc-900/50 backdrop-blur-sm flex items-center justify-center p-6">
            <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="bg-zinc-50 dark:bg-zinc-800 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden border border-zinc-100 dark:border-zinc-800 shadow-2xl"
            >
               {spinResult !== null ? (
                 <div className="py-6 animate-fade-in">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                       <Icon name="coins" className="text-4xl" />
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">You Won!</h2>
                    <p className="text-5xl font-black text-emerald-500 mb-4">+{spinResult} <span className="text-lg">pts</span></p>
                    <p className="text-zinc-500 font-medium text-sm mb-8">Come back tomorrow for another spin.</p>
                    <button onClick={() => { setShowSpinModal(false); setSpinResult(null); }} className="w-full py-4 bg-[#06331e] text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg">
                       Awesome
                    </button>
                 </div>
               ) : (
                 <div className="py-4">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Daily Free Spin</h2>
                    <p className="text-zinc-500 font-medium text-sm mb-8 px-4">Test your luck and win daily reward points!</p>
                    
                    <div className="relative w-48 h-48 mx-auto mb-8">
                       <motion.div 
                          animate={{ rotate: spinning ? 1440 : 0 }} 
                          transition={{ duration: spinning ? 2 : 0, ease: "easeInOut" }}
                          className="w-full h-full rounded-full border-[12px] border-emerald-50 border-r-emerald-500 border-b-yellow-400 border-l-blue-400 shadow-inner"
                       />
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Icon name="gem" className="text-3xl text-zinc-300" />
                       </div>
                    </div>
                    
                    <div className="flex gap-3">
                       <button onClick={() => setShowSpinModal(false)} disabled={spinning} className="flex-[1] py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold uppercase tracking-widest text-[11px]">
                          Close
                       </button>
                       <button onClick={handleSpin} disabled={spinning} className="flex-[2] py-4 bg-emerald-500 text-white rounded-xl font-bold uppercase tracking-widest text-[11px] shadow-lg flex justify-center items-center">
                          {spinning ? <Icon name="circle-notch" className="animate-spin" /> : 'Spin Now'}
                       </button>
                    </div>
                 </div>
               )}
            </motion.div>
         </div>
       )}
     </AnimatePresence>
     <CustomSectionEmbed location="profile_bottom" />
    </div>
  );
};

export default Profile;
