import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useNotify } from '../components/Notifications';
import { motion } from 'framer-motion';
import Icon from '../components/Icon';
import { getFriendlyErrorMessage } from '../lib/firebaseErrorMapper';

const ForgotPassword: React.FC = () => {
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return notify("Please enter your email", "error");
    setResetLoading(true);
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/signin', // will redirect here after reset
        handleCodeInApp: true
      };
      await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
      setSuccess(true);
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setResetLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] flex flex-col justify-center px-6 py-12 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <motion.div 
             initial={{ scale: 0.9, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-8 rounded-3xl shadow-sm text-center"
           >
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="check" className="text-2xl" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Check your email</h2>
            <p className="text-sm text-zinc-500 mb-8 leading-relaxed">
              We've sent a password reset link to <strong>{resetEmail}</strong>. Please check your inbox and spam folder.
            </p>
            <button 
              onClick={() => navigate('/signin')}
              className="w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-black dark:hover:bg-zinc-200 transition-colors"
            >
              Back to Sign In
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">Reset Password</h1>
        <p className="mt-2 text-sm text-zinc-500 font-medium leading-relaxed">Enter your email address and we'll send you a secure link to reset your password.</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-zinc-900 py-8 px-6 shadow-sm border border-zinc-200 dark:border-zinc-800 rounded-3xl sm:px-10">
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 tracking-wide mb-2">Email address</label>
              <input 
                type="email" 
                required
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="name@example.com" 
                className="w-full bg-zinc-50 dark:bg-[#121212] px-4 py-3.5 rounded-xl outline-none border border-zinc-200 dark:border-zinc-800 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all font-medium text-sm shadow-sm"
              />
            </div>
            
            <button disabled={resetLoading} type="submit" className="w-full py-4 mt-2 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-black dark:hover:bg-zinc-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center">
              {resetLoading ? <Icon name="spinner" className="mr-2 animate-spin" /> : null}
              {resetLoading ? "Sending Link..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
