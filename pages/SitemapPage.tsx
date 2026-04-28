import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import SEO from '../components/SEO';
import Icon from '../components/Icon';

const SitemapPage: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Store",
      links: [
        { label: "Home", path: "/" },
        { label: "All Products", path: "/all-products" },
        { label: "Search", path: "/search" },
        { label: "Cart", path: "/cart" },
      ]
    },
    {
      title: "User Account",
      links: [
        { label: "My Profile", path: "/profile" },
        { label: "My Orders", path: "/orders" },
        { label: "Wishlist", path: "/wishlist" },
        { label: "Notifications", path: "/notifications" },
        { label: "Account Settings", path: "/settings" }
      ]
    },
    {
      title: "Legal & Support",
      links: [
        { label: "About Us", path: "/about" },
        { label: "Contact Us", path: "/contact" },
        { label: "Terms & Conditions", path: "/terms" },
        { label: "Privacy Policy", path: "/privacy" },
        { label: "Help Center", path: "/help-center" }
      ]
    }
  ];

  return (
    <div className="p-6 md:p-12 pb-24 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
       <SEO title="Site Map" description="Navigate through all pages of VibeGadget." />
       <div className="flex items-center space-x-6 mb-12">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-900 hover:text-white transition-all shadow-sm">
             <Icon name="chevron-left" className="text-sm" />
          </button>
          <h1 className="text-2xl md:text-4xl font-black tracking-tight">Site Map</h1>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {sections.map((section, idx) => (
             <div key={idx}>
                <h2 className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100 mb-6 border-b border-zinc-100 dark:border-zinc-800 pb-2">{section.title}</h2>
                <ul className="space-y-4">
                   {section.links.map((link, i) => (
                      <li key={i}>
                         <Link to={link.path} className="text-zinc-600 dark:text-zinc-400 hover:text-black dark:text-white font-bold transition-colors">{link.label}</Link>
                      </li>
                   ))}
                </ul>
             </div>
          ))}
       </div>
    </div>
  );
};

export default SitemapPage;
