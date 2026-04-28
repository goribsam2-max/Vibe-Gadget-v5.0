import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [pushEnabled, setPushEnabled] = useState(false);

  React.useEffect(() => {
    const isEnabled = localStorage.getItem('vibe_push_enabled') === 'true';
    setPushEnabled(isEnabled);
  }, []);

  const togglePush = async () => {
    const OneSignal = (window as any).OneSignal;
    if (!OneSignal) return;
    
    if (!pushEnabled) {
      await OneSignal.Notifications.requestPermission();
      localStorage.setItem('vibe_push_enabled', 'true');
      setPushEnabled(true);
      notify("Push notifications enabled", "success");
    } else {
      // Note: Truly disabling requires browser settings, 
      // but we store the preference local state
      localStorage.setItem('vibe_push_enabled', 'false');
      setPushEnabled(false);
      notify("Push notifications disabled locally", "info");
    }
  };

  const handleDeleteAccount = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setIsDeleting(true);
    try {
      // 1. Delete Firestore User Doc
      await deleteDoc(doc(db, 'users', user.uid));
      // 2. Delete Auth Account
      await deleteUser(user);
      
      notify("Account permanently deleted", "info");
      navigate('/auth-selector');
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        notify("Session expired. Please re-login to delete account.", "error");
        await auth.signOut();
        navigate('/signin');
      } else {
        notify("Process failed", "error");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const options = [
    { label: 'Password Manager', path: '/settings/password', icon: 'lock' },
    { label: 'Privacy Policy', path: '/privacy', icon: 'shield-alt' },
    { label: 'Delete Account', path: 'DELETE', danger: true, icon: 'trash-alt' }
  ];

  return (
    <div className="p-6 md:p-12 pb-48 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800 max-w-3xl mx-auto font-inter">
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="w-12 h-12 flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[#06331e] rounded-full shadow-sm hover:bg-[#06331e] hover:text-white transition-all active:scale-95">
             <Icon name="chevron-left" className="text-xs" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-[#06331e] mb-1.5">Settings</h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-widest uppercase">App & Account</p>
          </div>
       </div>

       <div className="space-y-4">
          <div className="w-full flex items-center justify-between p-4 px-6 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 rounded-full hover:shadow-sm transition-all">
             <div className="flex items-center space-x-4">
                <Icon name="bell" className="w-5 text-center text-zinc-400" />
                <div className="flex flex-col">
                  <span className="font-bold text-sm uppercase tracking-widest text-[#06331e]">Push Notifications</span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest">{pushEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
             </div>
             <button 
               onClick={togglePush}
               className={`w-12 h-6 rounded-full p-1 transition-colors flex ${pushEnabled ? 'bg-emerald-500 justify-end' : 'bg-zinc-300 justify-start'}`}
             >
                <motion.div layout className="w-4 h-4 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-sm"></motion.div>
             </button>
          </div>

          {options.map((opt, i) => (
            <button 
               key={i} 
               onClick={() => opt.path === 'DELETE' ? setShowDeleteModal(true) : navigate(opt.path)}
               className={`w-full flex items-center justify-between p-4 px-6 bg-zinc-50 dark:bg-zinc-800 border rounded-full hover:shadow-sm transition-all group ${opt.danger ? 'border-red-100 hover:border-red-500 hover:bg-red-50 text-red-500' : 'border-zinc-100 dark:border-zinc-800 hover:border-[#06331e]/30 hover:bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
            >
               <div className="flex items-center space-x-4">
                  <Icon name={opt.icon} className={`w-5 text-center transition-colors ${opt.danger ? 'text-red-400 group-hover:text-red-500' : 'text-zinc-400 group-hover:text-[#06331e]'}`} />
                  <span className={`font-bold text-sm uppercase tracking-widest transition-colors ${opt.danger ? 'group-hover:text-red-600' : 'group-hover:text-[#06331e]'}`}>{opt.label}</span>
               </div>
               <Icon name="chevron-right" className={`text-[10px] transition-colors ${opt.danger ? 'text-red-300 group-hover:text-red-500' : 'text-zinc-300 group-hover:text-[#06331e]'}`} />
            </button>
          ))}
       </div>

       {showDeleteModal && (
          <div className="fixed inset-0 bg-[#06331e]/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-8 animate-fade-in">
             <div className="bg-zinc-50 dark:bg-zinc-800 rounded-[40px] p-8 w-full shadow-2xl border border-white/20">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                   <Icon name="exclamation-triangle" className="text-2xl" />
                </div>
                <h3 className="text-xl font-bold text-center mb-2">Wait, are you sure?</h3>
                <p className="text-xs text-f-gray text-center font-medium leading-relaxed mb-8 px-4">
                   Deleting your account is permanent. All your order history and profile data will be erased from our database.
                </p>
                <div className="space-y-3">
                   <button 
                      disabled={isDeleting}
                      onClick={handleDeleteAccount}
                      className="w-full py-4 bg-red-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all disabled:opacity-50"
                   >
                      {isDeleting ? 'Deleting...' : 'Permanently Delete'}
                   </button>
                   <button 
                      onClick={() => setShowDeleteModal(false)}
                      className="w-full py-4 bg-[#f4f4f5] dark:bg-zinc-800/80 text-[#06331e] rounded-2xl font-bold text-xs uppercase tracking-widest active:scale-[0.98]"
                   >
                      Keep Account
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  );
};

export default Settings;