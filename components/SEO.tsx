import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  jsonLd?: any;
  price?: number;
  currency?: string;
  availability?: string; // 'in stock' | 'out of stock'
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  keywords, 
  image = "/favicon.ico", 
  url = window.location.href, 
  type = "website",
  jsonLd,
  price,
  currency = "BDT",
  availability
}) => {
  useEffect(() => {
    document.title = `${title} | VibeGadget`;

    const setMeta = (propertyOrName: string, content: string) => {
      const isProperty = propertyOrName.startsWith('og:') || propertyOrName.startsWith('product:');
      const selector = isProperty ? `meta[property="${propertyOrName}"]` : `meta[name="${propertyOrName}"]`;
      let element = document.querySelector(selector);
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
            element.setAttribute('property', propertyOrName);
        } else {
            element.setAttribute('name', propertyOrName);
        }
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
      return element;
    };

    setMeta('description', description);
    if (keywords) setMeta('keywords', keywords);
    
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:image', image);
    setMeta('og:url', url);
    setMeta('og:type', type);
    setMeta('og:site_name', 'VibeGadget');
    
    if (price !== undefined) setMeta('product:price:amount', price.toString());
    if (price !== undefined) setMeta('product:price:currency', currency);
    if (availability) setMeta('product:availability', availability);
    
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);
    setMeta('twitter:image', image);

    if (jsonLd) {
       let jsonLdScript = document.querySelector('script[id="dynamic-schema"]');
       if (!jsonLdScript) {
         jsonLdScript = document.createElement('script');
         jsonLdScript.setAttribute('type', 'application/ld+json');
         jsonLdScript.setAttribute('id', 'dynamic-schema');
         document.head.appendChild(jsonLdScript);
       }
       jsonLdScript.textContent = JSON.stringify(jsonLd);
    }

  }, [title, description, keywords, image, url, type, jsonLd]);

  return null;
};

export default SEO;
