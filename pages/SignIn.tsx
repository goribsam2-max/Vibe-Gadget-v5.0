
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import { getFriendlyErrorMessage } from '../lib/firebaseErrorMapper';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      await setDoc(doc(db, 'users', user.uid), {
        lastActive: Date.now()
      }, { merge: true });

      notify("Welcome back!", "success");
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
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Sign in</h1>
        <p className="mt-2 text-sm text-zinc-500 font-medium">Welcome back! Please enter your details.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:px-10">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2">Email address</label>
              <input 
                type="email" 
                placeholder="name@example.com" 
                className="w-full bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500 transition-all font-medium text-sm shadow-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide">Password</label>
                <Link to="/forgot-password" className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">Forgot Password?</Link>
              </div>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  placeholder="••••••••" 
                  className="w-full bg-zinc-50 dark:bg-zinc-800/50 pl-4 pr-12 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:focus:border-emerald-500 dark:focus:ring-emerald-500 transition-all font-medium text-sm shadow-sm"
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

            <button disabled={loading} className="w-full py-4 mt-2 bg-zinc-900 dark:bg-emerald-500 text-white rounded-2xl font-bold text-sm tracking-tight shadow-xl shadow-zinc-900/10 dark:shadow-emerald-500/10 hover:shadow-zinc-900/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center">
              {loading ? <Icon name="spinner" className="mr-2 animate-spin" /> : null}
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          
          <p className="mt-8 text-center text-xs font-medium text-zinc-500">
            Don't have an account? <Link to="/signup" className="text-emerald-600 font-bold ml-1 hover:text-emerald-700 transition-colors">Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
