import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Icon from '../components/Icon';

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
       <SEO title="Terms & Conditions" description="Terms and Conditions and return policy of VibeGadget." />
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Terms & Conditions</h1>
       </div>

       <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          <section>
             <h2 className="text-black dark:text-white font-black text-xl mb-4">1. Acceptance of Terms</h2>
             <p>By accessing and shopping at VibeGadget, you agree to be bound by these Terms and Conditions. Our platform is a secure, Google-verified service designed for your trust and convenience.</p>
          </section>

          <section>
             <h2 className="text-black dark:text-white font-black text-xl mb-4">2. Returns & Refunds Policy</h2>
             <p className="font-bold text-red-600 mb-2">Strict No Refund / No General Return Policy.</p>
             <p>Once an order has been successfully placed and delivered, we do not accept returns. We firmly do not offer money-back guarantees or refunds under any circumstances. Please verify the product model, specifications, and compatibility before confirming your purchase. This policy ensures all our customers receive 100% brand-new untouched inventory.</p>
          </section>

          <section>
             <h2 className="text-black dark:text-white font-black text-xl mb-4">3. Warranty Information</h2>
             <p>General products do not come with a warranty. Warranty is strictly limited only to specific products where it is explicitly written and stated on the product page. If a product does not mention a warranty period, it is sold "as is" without any warranty coverage.</p>
          </section>
          
          <section>
             <h2 className="text-black dark:text-white font-black text-xl mb-4">4. Account Security</h2>
             <p>We provide state-of-the-art secure authentication (including Google and robust Manual Login) ensuring your account is safe from unauthorized access. You are responsible for keeping your login credentials confidential.</p>
          </section>
       </div>
    </div>
  );
};

export default Terms;
