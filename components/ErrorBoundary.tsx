import React, { Component, ReactNode } from 'react';
import { motion } from 'framer-motion';
import Icon from './Icon';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('An unexpected error occurred.');
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
              <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                 <Icon name="exclamation-triangle" className="text-4xl" />
              </div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-4 tracking-tight">Oops! Something went wrong.</h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium mb-8 leading-relaxed">
                 We've encountered an unexpected issue. Please try refreshing the page or navigating back to the home page.
              </p>
              <button onClick={() => window.location.href = '/'} className="px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-black font-semibold rounded-xl hover:bg-black dark:hover:bg-zinc-200 transition-colors shadow-md text-sm">
                 Return Home
              </button>
           </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
