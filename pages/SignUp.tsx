
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useNotify } from '../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import { getFriendlyErrorMessage } from '../lib/firebaseErrorMapper';

const SignUp: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agree) return notify("Please agree to the Terms & Conditions", "error");
    
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;
      await updateProfile(user, { displayName: name });

      const userData = {
        uid: user.uid,
        email,
        displayName: name,
        role: 'user',
        isBanned: false,
        createdAt: Date.now(),
        registrationDate: Date.now(),
        lastActive: Date.now()
      };

      await setDoc(doc(db, 'users', user.uid), userData);
      
      notify("Account created successfully!", "success");
      navigate('/');
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] flex flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.button 
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full flex items-center justify-center mb-8 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-400"
        >
          <Icon name="arrow-left" className="text-xs" />
        </motion.button>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Create an account</h1>
        <p className="mt-2 text-sm text-zinc-500 font-medium">Start exploring premium gadgets today.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:px-10">
          <form onSubmit={handleSignUp} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2">Full Name</label>
              <input 
                type="text" 
                placeholder="e.g. John Doe" 
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-sm shadow-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2">Email address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-sm shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2">Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="At least 6 characters" 
                  className="w-full bg-zinc-50 dark:bg-[#121212] pl-4 pr-12 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-sm shadow-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                >
                  <Icon name={showPassword ? 'eye-slash' : 'eye'} className="text-lg" />
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="w-4 h-4 text-zinc-900 bg-zinc-100 dark:bg-zinc-800 border-zinc-300 rounded focus:ring-zinc-900 focus:ring-2 cursor-pointer" 
                checked={agree}
                onChange={(e) => setAgree(e.target.checked)}
              />
              <label htmlFor="terms" className="text-xs font-medium text-zinc-500 cursor-pointer">I agree to the <span className="text-zinc-900 dark:text-zinc-100 font-semibold underline underline-offset-2">Terms & Conditions</span></label>
            </div>

            <button disabled={loading} className="w-full py-4 mt-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-black dark:hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50">
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          
          <p className="mt-8 text-center text-xs font-medium text-zinc-500">
            Already have an account? <Link to="/signin" className="text-emerald-600 font-bold ml-1 hover:text-emerald-700 transition-colors">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
