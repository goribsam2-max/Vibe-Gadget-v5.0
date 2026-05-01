import React from 'react';
import { useNavigate } from 'react-router-dom';
import SEO from '../components/SEO';
import Icon from '../components/Icon';

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
       <SEO title="About Us" description="Learn about VibeGadget, your premium tech hub for electronics and accessories." />
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/50 flex items-center justify-center hover:bg-white dark:hover:bg-zinc-700 rounded-full transition-transform active:scale-95 shadow-sm group">
             <Icon name="arrow-left" className="text-sm text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold tracking-tight uppercase">About Us</h1>
       </div>

       <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          <section>
             <h2 className="text-black dark:text-white font-semibold text-xl mb-4">Welcome to VibeGadget</h2>
             <p>VibeGadget is your premium tech hub for discovering the most innovative and reliable electronics. We pride ourselves on offering carefully curated products ranging from daily essentials to high-end accessories. Our mission is to enhance your tech lifestyle by providing quality products you can trust.</p>
          </section>

          <section>
             <h2 className="text-black dark:text-white font-semibold text-xl mb-4">Why We Are Trusted</h2>
             <p>As a certified and verified e-commerce platform, we adhere to strict standards to ensure every transaction is safe and every product is authentic. We integrate with world-class secure authentication providers like Google to make sure your data is never compromised. We are recognized globally as a secure and reliable platform for tech enthusiasts.</p>
          </section>

          <section>
             <h2 className="text-black dark:text-white font-semibold text-xl mb-4">Our Commitment</h2>
             <p>We believe in full transparency. Due to the high-value nature of electronics, please make sure you read the product details carefully before making a purchase. As outlined in our Terms & Conditions, we do not offer general return or money-back policies. Warranties are only applicable to specific items that explicitly mention them. This allows us to offer you the best possible prices on brand-new, unopened products.</p>
          </section>
       </div>
    </div>
  );
};

export default AboutUs;
