
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider, FacebookAuthProvider, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { db, auth } from '../firebase';
import { useNotify } from '../components/Notifications';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import Icon from '../components/Icon';

const AuthSelector: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [config, setConfig] = useState<any>({
    googleLogin: true,
    facebookLogin: true,
    appleLogin: true
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) {
        setConfig((prev: any) => ({ ...prev, ...snap.data() }));
      }
    });
    return unsub;
  }, []);

  const captureUserDetails = async (user: any) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userRef);
      
      const ipRes = await fetch('https://api.ipify.org?format=json').catch(() => null);
      const ipData = ipRes ? await ipRes.json() : { ip: 'Unknown' };

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || 'Guest User',
          photoURL: user.photoURL || '',
          role: 'user',
          isBanned: false,
          createdAt: Date.now(),
          registrationDate: Date.now(),
          ipAddress: ipData.ip,
          lastActive: Date.now()
        });
      } else {
        await setDoc(userRef, { 
          lastActive: Date.now(),
          ipAddress: ipData.ip 
        }, { merge: true });
      }
    } catch (e) {
      console.error("Profile error:", e);
    }
  };

  const handleSocialLogin = async (providerName: string, enabled: boolean) => {
    if (!enabled) {
      notify(`${providerName} login is currently disabled by admin.`, "info");
      return;
    }
    
    try {
      let provider;
      if (providerName === 'Google') provider = new GoogleAuthProvider();
      else if (providerName === 'Facebook') provider = new FacebookAuthProvider();
      else if (providerName === 'Apple') provider = new OAuthProvider('apple.com');
      else return;

      const result = await signInWithPopup(auth, provider);
      await captureUserDetails(result.user);
      notify(`Welcome, ${result.user.displayName || 'User'}!`, "success");
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code !== 'auth/popup-closed-by-user') {
        notify(err.message, "error");
      }
    }
  };

  return (
    <div className="h-screen flex flex-col p-10 items-center justify-center text-center bg-zinc-50 dark:bg-zinc-800/30 max-w-md mx-auto font-inter">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="flex justify-center w-full mb-8">
           <Logo scale={1} className="scale-110 md:scale-90 lg:scale-75 xl:scale-50 origin-center" />
        </div>
        <p className="text-zinc-500 text-sm font-medium mb-10 px-4 leading-relaxed">
          Premium mobile accessories and gadgets delivered right to your doorstep in Bangladesh.
        </p>
        
        <div className="w-full space-y-4 px-2 tracking-tight">
          <button 
            onClick={() => navigate('/signup')} 
            className="w-full py-4 bg-zinc-900 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-zinc-900/10 hover:shadow-zinc-900/20 dark:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20 active:scale-95 transition-all outline-none"
          >
            Create Account
          </button>
          <button 
            onClick={() => navigate('/signin')} 
            className="w-full py-4 border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-2xl font-bold text-sm text-zinc-900 dark:text-white shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 active:scale-95 transition-all outline-none"
          >
            Sign In Account
          </button>
        </div>
      </div>
      
      <div className="w-full pb-8">
         <div className="flex items-center space-x-4 mb-8 px-6">
            <div className="flex-1 h-px bg-zinc-200"></div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-normal">Or social login</span>
            <div className="flex-1 h-px bg-zinc-200"></div>
         </div>
         <div className="flex justify-center space-x-6">
            <SocialBtn icon="facebook-f" active={config.facebookLogin} onClick={() => handleSocialLogin('Facebook', config.facebookLogin)} color="text-[#1877F2]" />
            <SocialBtn icon="google" active={config.googleLogin} onClick={() => handleSocialLogin('Google', config.googleLogin)} color="text-zinc-900 dark:text-zinc-100" />
            <SocialBtn icon="apple" active={config.appleLogin} onClick={() => handleSocialLogin('Apple', config.appleLogin)} color="text-zinc-900 dark:text-zinc-100" />
         </div>
      </div>
    </div>
  );
};

const SocialBtn = ({ icon, active, onClick, color }: any) => (
  <motion.button 
    whileTap={active ? { scale: 0.9 } : {}}
    onClick={onClick} 
    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all border ${active ? `bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 ${color} shadow-sm hover:bg-zinc-50 dark:bg-zinc-800` : 'bg-zinc-50 dark:bg-zinc-800 border-transparent text-zinc-300 cursor-not-allowed'}`}
  >
      <Icon name={icon} className={`text-lg ${color}`} />
  </motion.button>
);

export default AuthSelector;
