
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, onSnapshot, deleteDoc, setDoc, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Product, Review } from '../types';
import { useNotify } from '../components/Notifications';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import Icon from '../components/Icon';
import SEO from '../components/SEO';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';

const ProductDetails: React.FC = () => {
  const { id, slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(id || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [direction, setDirection] = useState(0); 
  const [fullScreenImg, setFullScreenImg] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState<{ d: number, h: number, m: number, s: number } | null>(null);
  const [mysteryOffer, setMysteryOffer] = useState<{ discountPrice: number, expiresAt: number, discountPct: number } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingBundle, setAddingBundle] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [notifying, setNotifying] = useState(false);
  
  const notify = useNotify();
  const navigate = useNavigate();

  const handleNotifyMe = async () => {
     if (!product) return;
     setNotifying(true);
     try {
       await setDoc(doc(collection(db, 'restock_notifications')), {
          productId: product.id,
          productName: product.name,
          userEmail: auth.currentUser?.email || 'guest',
          userId: auth.currentUser?.uid || 'guest',
          createdAt: Date.now()
       });
       notify("We'll notify you when it's back in stock!", "success");
     } catch(e) {
       notify("Could not set up notification.", "error");
     }
     setTimeout(() => setNotifying(false), 2000);
  };

  const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        getDoc(doc(db, 'users', user.uid)).then(d => {
          if (d.exists() && d.data().isAffiliate && d.data().affiliateCode) {
            setAffiliateCode(d.data().affiliateCode);
          }
        });
      } else {
        setAffiliateCode(null);
      }
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    return () => {
      unsubAuth();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      let matchedProduct = null;
      let mId = id;

      if (id) {
        const snap = await getDoc(doc(db, 'products', id));
        if (snap.exists()) {
          matchedProduct = { id: snap.id, ...snap.data() } as Product;
        }
      } else if (slug) {
         const snap = await getDocs(query(collection(db, 'products')));
         const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
         matchedProduct = allProducts.find(p => toSlug(p.name) === slug || p.name === decodeURIComponent(slug));
         if (matchedProduct) mId = matchedProduct.id;
      }

      if (matchedProduct) {
        setProduct(matchedProduct);
        setResolvedId(mId as string);
        
        // Rewrite URL
        if (mId && (!slug || slug !== toSlug(matchedProduct.name))) {
           window.history.replaceState(null, '', `/${toSlug(matchedProduct.name)}`);
        }

        // Increment views
        try {
           const { increment, updateDoc } = await import('firebase/firestore');
           await updateDoc(doc(db, 'products', mId as string), { views: increment(1) });
        } catch(e) {}
      } else {
        // If couldn't resolve, maybe go home
        if (!id && slug) navigate('/');
      }
    };
    fetchProduct();
  }, [id, slug]);

  useEffect(() => {
    if (!product) return;

    // We now use SEO component in render
  }, [product, mysteryOffer]);

  useEffect(() => {
    if (resolvedId) {
      if (settings?.mysteryBoxActive === false) {
         if (mysteryOffer) setMysteryOffer(null);
      } else {
        try {
          const boxOffer = JSON.parse(localStorage.getItem('vibe_mystery_box') || '{}');
          if (boxOffer.result === 'win' && !boxOffer.used && boxOffer.productId === resolvedId && boxOffer.expiresAt > Date.now()) {
              setMysteryOffer({
                 discountPrice: boxOffer.discountPrice,
                 expiresAt: boxOffer.expiresAt,
                 discountPct: boxOffer.discountPct
              });
          }
        } catch(e) {}
      }
      
      const q = query(collection(db, 'reviews'), where('productId', '==', resolvedId));
      const unsubscribeReviews = onSnapshot(q, (snapshot) => {
        const reviewList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
        reviewList.sort((a, b) => b.createdAt - a.createdAt);
        setReviews(reviewList);
      }, (err) => console.warn("Reviews fetch error:", err.message));

      let unsubscribeWishlist = () => {};
      if (auth.currentUser) {
        const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', resolvedId);
        unsubscribeWishlist = onSnapshot(wishlistRef, (snap) => {
          setIsWishlisted(snap.exists());
        }, (err) => console.warn("Wishlist fetch error:", err.message));
      }

      const productQ = query(collection(db, 'products'));
      const unsubscribeProducts = onSnapshot(productQ, (snap) => {
         const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
         const others = allProducts.filter(p => p.id !== resolvedId).slice(0, 2);
         setBundleItems(others);
      });
      
      return () => {
        unsubscribeReviews();
        unsubscribeWishlist();
        unsubscribeProducts();
      }
    }
  }, [resolvedId, auth.currentUser, settings?.mysteryBoxActive]);

  useEffect(() => {
     let interval: HTMLInputElement | null | number = null;
     
     const validateAndSetTime = (endTime: number) => {
        const now = Date.now();
        const distance = endTime - now;
        if (distance < 0) {
           setTimeLeft(null);
           if (mysteryOffer) setMysteryOffer(null); // Expire mystery offer
           clearInterval(interval as number);
        } else {
           setTimeLeft({
              d: Math.floor(distance / (1000 * 60 * 60 * 24)),
              h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
              m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
              s: Math.floor((distance % (1000 * 60)) / 1000)
           });
        }
     };

     if (mysteryOffer) {
        // Enforce Mystery Offer timer
        interval = window.setInterval(() => validateAndSetTime(mysteryOffer.expiresAt), 1000);
     } else if (product?.isOffer && product?.offerEndTime) {
        interval = window.setInterval(() => validateAndSetTime(product.offerEndTime!), 1000);
     }
     return () => { if (interval) clearInterval(interval as number); }
  }, [product, mysteryOffer]);

  const toggleWishlist = async () => {
    if (!auth.currentUser) return notify("Please sign in to save items", "info");
    if (!product || !resolvedId) return;

    const wishlistRef = doc(db, 'users', auth.currentUser.uid, 'wishlist', resolvedId);
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
        notify("Removed from wishlist.", "info");
      } else {
        await setDoc(wishlistRef, {
          productId: resolvedId,
          name: product.name,
          image: product.image,
          price: product.price,
          rating: product.rating,
          addedAt: Date.now()
        });
        notify("Added to wishlist!", "success");
      }
    } catch (e) {
      notify("Failed to update wishlist.", "error");
    }
  };

  const addToCart = (redirect = false) => {
    if (!product) return;
    if (!redirect) setAddingToCart(true);
    
    // We update local storage but do a small delay before navigating
    setTimeout(() => {
      const cart = JSON.parse(localStorage.getItem('f_cart') || '[]');
      const existingIndex = cart.findIndex((item: any) => item.id === product.id);
      
      const offerPrice = mysteryOffer ? mysteryOffer.discountPrice : (product.isOffer && product.offerPrice ? product.offerPrice : product.price);

      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
        cart[existingIndex].price = offerPrice; // Update to the correct price
      } else {
        cart.push({ ...product, price: offerPrice, originalPrice: product.price, quantity: 1, isMysteryOffer: !!mysteryOffer });
      }

      localStorage.setItem('f_cart', JSON.stringify(cart));
      
      if (mysteryOffer) {
         try {
           const boxOffer = JSON.parse(localStorage.getItem('vibe_mystery_box') || '{}');
           if (boxOffer.productId === product.id) {
             boxOffer.used = true;
             localStorage.setItem('vibe_mystery_box', JSON.stringify(boxOffer));
           }
         } catch(e) {}
      }
      
      if (redirect) {
        navigate('/checkout');
      } else {
        // notify("Added to cart!", "success"); // Disabled simple toast
        setTimeout(() => {
           setAddingToCart(false);
           navigate('/cart');
        }, 600); // give the animation some time to complete
      }
    }, redirect ? 0 : 200);
  };

  const changeImage = (index: number) => {
    setDirection(index > activeImg ? 1 : -1);
    setActiveImg(index);
  };

  const handleBundleAddToCart = () => {
    if (!product) return;
    setAddingBundle(true);
    
    setTimeout(() => {
      const itemsToAdd = [product, ...bundleItems];
      let cart: any[] = [];
      try { cart = JSON.parse(localStorage.getItem('f_cart') || '[]'); } catch(e) {}
      
      itemsToAdd.forEach(item => {
         const offerPrice = item.isOffer && item.offerPrice ? item.offerPrice : item.price;
         const existing = cart.find(c => c.id === item.id);
         if (existing) {
            existing.quantity += 1;
         } else {
            cart.push({ ...item, quantity: 1, originalPrice: item.price, price: offerPrice * 0.90 }); // 10% bundle discount
         }
      });
      localStorage.setItem('f_cart', JSON.stringify(cart));
      // notify("Bundle added to cart with 15% discount!", "success");
      
      setTimeout(() => {
         setAddingBundle(false);
         navigate('/cart');
      }, 600);
    }, 200);
  };

  if (!product) return (
    <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#121212]">
      <div className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-emerald-500 animate-pulse mix-blend-screen" />
    </div>
  );

  const images = product.images || [product.image];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)'
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 500 : -500,
      opacity: 0,
      scale: 0.9,
      filter: 'blur(10px)'
    })
  };

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images || [product.image],
    "description": product.description || `Buy ${product.name} at VibeGadget premium store.`,
    "sku": product.id,
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "BDT",
      "price": mysteryOffer ? mysteryOffer.discountPrice : (product.isOffer && product.offerPrice ? product.offerPrice : product.price),
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "itemCondition": "https://schema.org/NewCondition"
    },
    ...((product.rating && product.numReviews) ? {
       "aggregateRating": {
         "@type": "AggregateRating",
         "ratingValue": product.rating,
         "reviewCount": product.numReviews
       }
    } : {})
  };

  return (
    <div className="animate-fade-in bg-zinc-50 dark:bg-zinc-800 min-h-screen pb-32 w-full mx-auto flex flex-col lg:flex-row lg:items-start lg:p-12 lg:gap-16 relative overflow-hidden transition-colors">
      <SEO 
        title={product.name} 
        description={product.description || `Buy ${product.name} for ${mysteryOffer ? mysteryOffer.discountPrice : (product.isOffer && product.offerPrice ? product.offerPrice : product.price)} BDT`}
        image={product.image}
        jsonLd={jsonLd}
        price={mysteryOffer ? mysteryOffer.discountPrice : (product.isOffer && product.offerPrice ? product.offerPrice : product.price)}
        availability={product.stock > 0 ? 'in stock' : 'out of stock'}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      
      <div className="w-full lg:w-[45%] lg:max-w-[450px] xl:max-w-[500px] lg:sticky lg:top-12 animate-stagger-1 relative z-10">
        <div className="relative aspect-square md:aspect-video lg:aspect-square bg-zinc-50 dark:bg-zinc-800 dark:bg-zinc-800 rounded-b-[2.5rem] lg:rounded-[2.5rem] overflow-hidden flex items-center justify-center border border-zinc-100 dark:border-zinc-800 group shadow-lg hover-glow transition-all">
          <button onClick={() => navigate(-1)} className="absolute top-4 left-4 lg:hidden z-10 w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-md rounded-full text-zinc-600 dark:text-zinc-400 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-900 hover:text-white transition-all active:scale-95 group/btn">
            <Icon name="arrow-left" className="text-xs group-hover/btn:-translate-x-1 transition-transform" />
          </button>
          
          <AnimatePresence initial={false} custom={direction}>
            <motion.img 
              key={activeImg}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 400, damping: 35 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 },
                filter: { duration: 0.3 }
              }}
              src={images[activeImg]} 
              className={`absolute w-full h-full object-contain p-6 md:p-12 lg:p-16 cursor-zoom-in group-hover:scale-105 transition-transform duration-700 mix-blend-multiply dark:mix-blend-normal ${product.stock <= 0 ? 'grayscale opacity-75' : ''}`}
              onClick={() => setFullScreenImg(images[activeImg])}
              alt={product.name}
            />
          </AnimatePresence>

          {product.stock <= 0 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
              <div className="bg-zinc-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full border border-zinc-700 shadow-2xl flex items-center space-x-2 animate-pulse">
                <Icon name="clock" className="text-zinc-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Restocking Soon</span>
              </div>
            </div>
          )}
          
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2 bg-zinc-50 dark:bg-zinc-900/70 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-lg z-10">
              {images.map((_, i) => (
                <button key={i} onClick={() => changeImage(i)} className={`h-1.5 rounded-full transition-all duration-500 ${i === activeImg ? 'w-6 bg-[#06331e]' : 'w-1.5 bg-zinc-300 hover:bg-zinc-400'}`}></button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-center flex-wrap gap-3 mt-6 px-6 lg:px-0">
          {images.map((img, i) => (
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              key={i} 
              onClick={() => changeImage(i)}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl border-2 p-1 bg-zinc-50 dark:bg-zinc-800 transition-all overflow-hidden relative ${i === activeImg ? 'border-[#06331e] shadow-md pulse-ring-active' : 'border-zinc-100 dark:border-zinc-800 opacity-60 hover:opacity-100 hover:border-emerald-200'}`}
            >
              <img src={img} className="w-full h-full object-contain rounded-xl mix-blend-multiply dark:mix-blend-normal" alt="" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="px-6 py-10 lg:py-0 flex-1 w-full max-w-3xl mx-auto lg:mx-0 animate-stagger-2 relative z-10">
        <div className="mb-10 px-1">
           <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-[0.2em] mb-3 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">{product.category}</p>
           <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-4 leading-tight text-zinc-900 dark:text-zinc-100 dark:text-zinc-50">{product.name}</h1>
           
           {mysteryOffer && (
             <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 rounded-2xl mb-6 text-white shadow-xl shadow-purple-500/20 border border-purple-400 border-dashed relative overflow-hidden">
               <div className="absolute -top-4 -right-4 w-12 h-12 bg-zinc-50 dark:bg-zinc-900/20 rotate-45"></div>
               <div className="flex items-center space-x-3">
                 <Icon name="gift" className="text-2xl animate-bounce text-yellow-300 drop-shadow-md" />
                 <div>
                   <p className="text-xs font-black tracking-widest uppercase text-purple-200">Mystery Box offer active!</p>
                   <p className="text-sm font-bold mt-0.5">You unlocked {mysteryOffer.discountPct}% OFF</p>
                 </div>
               </div>
             </motion.div>
           )}

           <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-6 gap-4">
              <div className="flex items-center space-x-3">
                 <div className={`bg-gradient-to-r ${mysteryOffer ? 'from-purple-600 to-indigo-900' : 'from-[#06331e] to-black'} text-white px-6 py-3 rounded-full inline-flex items-center shadow-lg hover-glow ${mysteryOffer ? 'shadow-purple-900/40 ring-2 ring-purple-400 ring-offset-2' : 'shadow-emerald-900/20'}`}>
                    <span className="text-xs font-bold opacity-80 mr-1">৳</span>
                    <span className="text-xl lg:text-2xl font-black tracking-tight">{(mysteryOffer ? mysteryOffer.discountPrice : (product.isOffer && product.offerPrice ? product.offerPrice : product.price)).toLocaleString()}</span>
                 </div>
                 {((product.isOffer && product.offerPrice) || mysteryOffer) && (
                    <span className="text-zinc-400 font-bold line-through text-base md:text-lg lg:text-base xl:text-sm mt-0.5">৳{product.price.toLocaleString()}</span>
                 )}
              </div>
              <div className="flex w-fit items-center space-x-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 px-3 py-2 rounded-full shadow-sm shrink-0">
                 <Icon name="star" className="text-yellow-500 text-[10px]" />
                 <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{product.rating}</span>
                 <span className="text-[10px] font-bold text-zinc-400 capitalize">({product.numReviews || 0} revs)</span>
              </div>
           </div>
           {(mysteryOffer || (product.isOffer && product.offerEndTime)) && timeLeft && (
             <div className={`mt-4 ${mysteryOffer ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-red-50 text-red-600 border-red-100'} rounded-lg p-2 border flex items-center justify-center w-full shadow-sm`}>
               <div className="flex items-center space-x-1.5 whitespace-nowrap">
                 <Icon name="clock" className="text-[10px] animate-pulse" />
                 <span className="font-bold text-[8px] uppercase tracking-widest">{mysteryOffer ? "Special Deal Ends In:" : "Offer Ends In:"}</span>
                 <div className="flex space-x-0.5 font-black text-[10px]">
                   <span>{String(timeLeft.d).padStart(2, '0')}</span><span className="text-[7px] text-zinc-500 uppercase tracking-widest opacity-80 mr-0.5">d</span>
                   <span>{String(timeLeft.h).padStart(2, '0')}</span><span className="text-[7px] text-zinc-500 uppercase tracking-widest opacity-80 mr-0.5">h</span>
                   <span>{String(timeLeft.m).padStart(2, '0')}</span><span className="text-[7px] text-zinc-500 uppercase tracking-widest opacity-80 mr-0.5">m</span>
                   <span>{String(timeLeft.s).padStart(2, '0')}</span><span className="text-[7px] text-zinc-500 uppercase tracking-widest opacity-80">s</span>
                 </div>
               </div>
             </div>
           )}
        </div>

        <div className="mb-12">
            {affiliateCode && (
               <div className="mb-8 bg-emerald-50 dark:bg-[#06331e] border border-emerald-200 dark:border-emerald-900 rounded-[1.5rem] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                 <div>
                   <h3 className="text-[10px] font-black uppercase tracking-widest text-[#06331e] dark:text-emerald-400 mb-1 flex items-center">
                      <Icon name="gem" className="mr-1.5 text-[12px] text-emerald-500" /> Affiliate Program
                   </h3>
                   <p className="text-xs text-zinc-600 dark:text-zinc-300 font-medium">Earn <strong className="text-emerald-700 dark:text-emerald-400">৳50</strong> per successful order!</p>
                 </div>
                 <button 
                   onClick={() => {
                     const shareLnk = `${window.location.origin}/product/${product.id}?ref=${affiliateCode}`;
                     if (navigator.share) {
                       navigator.share({ title: `Buy ${product.name}`, url: shareLnk }).catch(() => {});
                     } else {
                       navigator.clipboard.writeText(shareLnk);
                       notify("Affiliate Link copied!", "success");
                     }
                   }}
                   className="shrink-0 bg-[#06331e] dark:bg-emerald-500 text-white dark:text-black px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center hover:bg-emerald-900 dark:hover:bg-emerald-400 transition-colors shadow-md active:scale-95"
                 >
                   Copy Link
                 </button>
               </div>
            )}
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 px-1">Product Description</h3>
            <p className="text-sm md:text-base text-zinc-600 dark:text-zinc-400 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap px-1">
              {product.description || "High-quality premium accessory designed for ultimate performance and style."}
            </p>
            
            {product.videoUrl && (
              <div className="mt-8 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 shadow-md bg-zinc-900 dark:bg-zinc-50 dark:text-black relative aspect-video">
                 <iframe 
                   src={product.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')} 
                   className="absolute inset-0 w-full h-full"
                   allowFullScreen 
                   allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 ></iframe>
              </div>
            )}
        </div>

        {bundleItems.length > 0 && <div className="mb-12 border-t border-zinc-100 dark:border-zinc-800 pt-8">
            <div className="flex justify-between items-center mb-6 px-1">
               <div>
                 <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Bundle Offer</h3>
                 <h2 className="text-lg font-black tracking-tight mt-1 text-zinc-900 dark:text-zinc-100">Shop the Look</h2>
               </div>
               <button 
                 onClick={handleBundleAddToCart} 
                 disabled={addingBundle}
                 className={`px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-widest shadow-sm transition-all active:scale-95 flex items-center justify-center min-w-[100px] ${addingBundle ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200'}`}
               >
                  {addingBundle ? <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><Icon name="check" className="text-[12px]" /></motion.div> : 'Add Bundle'}
               </button>
            </div>
            
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-700 shadow-inner flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center w-full md:w-auto overflow-x-auto no-scrollbar pb-2">
                   <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center p-2 shrink-0">
                      <img src={product.image} className="w-full h-full object-contain" alt="" />
                   </div>
                   {bundleItems.map(item => (
                     <React.Fragment key={item.id}>
                       <div className="text-zinc-300 mx-3"><Icon name="plus" /></div>
                       <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-center p-2 shrink-0">
                          <img src={item.image} className="w-full h-full object-contain" alt="" />
                       </div>
                     </React.Fragment>
                   ))}
                </div>
                
                <div className="md:ml-auto text-center md:text-right border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-700 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                   <p className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase mb-1">Save 15%</p>
                   {(() => {
                      const basePrice = product.price + bundleItems.reduce((a, b) => a + b.price, 0);
                      const discountPrice = basePrice * 0.85;
                      return (
                       <>
                         <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 line-through opacity-30 text-xs mb-0.5">৳{basePrice.toLocaleString()}</p>
                         <p className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">৳{discountPrice.toLocaleString()}</p>
                       </>
                      );
                   })()}
                </div>
            </div>
        </div>}

        <div className="mb-12">
           <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Customer Reviews</h3>
              <button onClick={() => navigate(`/leave-review?productId=${product.id}`)} className="text-[10px] font-bold text-emerald-600 hover:text-emerald-800 uppercase tracking-widest transition-all">Write a Review</button>
           </div>

           <div className="space-y-4">
              {reviews.map(review => (
                <div key={review.id} className="bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-200 dark:border-zinc-700">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-4">
                         <img src={review.userPhoto || `https://ui-avatars.com/api/?name=${review.userName}&background=000&color=fff`} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white shadow-sm" alt="" />
                         <div>
                            <p className="text-xs font-black tracking-tight text-zinc-900 dark:text-zinc-100">{review.userName}</p>
                            <div className="flex text-[8px] text-yellow-400 mt-1">
                               {[...Array(5)].map((_, i) => <Icon key={i} name={i < review.rating ? 'star' : 'star-outline'} solid={i < review.rating} className="mr-0.5" />)}
                            </div>
                         </div>
                      </div>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase">{new Date(review.createdAt).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">"{review.comment}"</p>
                   {review.images && review.images.length > 0 && (
                      <div className="flex gap-3 overflow-x-auto no-scrollbar py-2 mt-3">
                         {review.images.map((img, i) => (
                           <img 
                            key={i} src={img} 
                            className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-white shadow-sm cursor-zoom-in shrink-0 hover:scale-105 transition-transform" 
                            onClick={() => setFullScreenImg(img)}
                            alt="" 
                           />
                         ))}
                      </div>
                   )}
                </div>
              ))}
              {reviews.length === 0 && <div className="py-12 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-center text-[10px] font-bold uppercase tracking-widest text-zinc-400">No reviews yet</div>}
           </div>
               {createPortal(
          <div className="fixed bottom-6 left-0 right-0 w-full flex justify-center z-[100] px-4 pointer-events-none">
             <div className="bg-zinc-50 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-200 dark:border-zinc-700 p-2.5 rounded-[2rem] flex items-center space-x-2 w-full max-w-md shadow-2xl pointer-events-auto">
               
               {product.stock <= 0 ? (
                 <button 
                   onClick={handleNotifyMe} 
                   className="flex-1 py-3.5 bg-[#06331e] text-white rounded-[1.5rem] flex items-center justify-center space-x-2 text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all active:scale-95 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                 >
                    <span>Notify Me</span>
                    <Icon name="bell" className={`text-yellow-400 text-[12px] ml-1 ${notifying ? 'animate-bounce' : ''}`} />
                 </button>
               ) : (
                 <>
                   <button 
                     onClick={() => addToCart(false)} 
                     disabled={addingToCart}
                     className={`flex-[1.2] py-3.5 border border-transparent rounded-[1.5rem] flex items-center justify-center space-x-2 text-[10px] md:text-[9px] font-bold uppercase tracking-widest transition-all whitespace-nowrap ${addingToCart ? 'bg-emerald-500 text-white scale-95 origin-center' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 active:scale-95'}`}
                   >
                      {addingToCart ? (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center justify-center">
                          <Icon name="check" className="text-[12px] font-bold" />
                        </motion.div>
                      ) : (
                        <>
                          <Icon name="shopping-bag" className="text-[10px]" />
                          <span className="hidden sm:inline">Add</span>
                        </>
                      )}
                   </button>
                   <button 
                     onClick={() => addToCart(true)} 
                     className="flex-[2] py-3.5 bg-[#06331e] text-white rounded-[1.5rem] flex items-center justify-center space-x-2 text-[10px] md:text-[9px] font-bold uppercase tracking-widest hover:bg-zinc-900 transition-all active:scale-95 shadow-lg shadow-emerald-900/20 whitespace-nowrap"
                   >
                      <span>Buy Now</span>
                      <Icon name="bolt" className="text-yellow-400 text-[10px] ml-1" />
                   </button>
                 </>
               )}

               <button 
                 onClick={toggleWishlist}
                 className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full border transition-all active:scale-90 shadow-sm ${isWishlisted ? 'bg-red-50 text-red-500 border-red-100' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 hover:text-zinc-600 dark:text-zinc-400'}`}
               >
                 <Icon name="heart" solid={isWishlisted} className="text-[12px]" />
               </button>
               <button 
                 onClick={() => {
                    if (navigator.share) {
                       navigator.share({ title: product.name, url: window.location.href }).catch(() => {});
                    } else {
                       navigator.clipboard.writeText(window.location.href);
                       notify("Link copied to clipboard!", "success");
                    }
                 }}
                 className="w-11 h-11 shrink-0 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:text-zinc-400 transition-all active:scale-90 shadow-sm"
               >
                 <Icon name="share-alt" className="text-[12px]" />
               </button>
             </div>
          </div>,
          document.body
        )}
      </div>
      </div>

      <AnimatePresence>
        {fullScreenImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-[40px] z-[10000] flex items-center justify-center p-6 md:p-20"
            onClick={() => setFullScreenImg(null)}
          >
            <motion.button 
              whileHover={{ scale: 1.1 }}
              className="absolute top-10 right-10 text-white p-4 md:p-5 bg-black/50 hover:bg-black/70 rounded-full transition-all z-[10001] shadow-2xl backdrop-blur-md border border-white/20 hover:border-white/40"
            >
              <Icon name="times" className="text-2xl" />
            </motion.button>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              src={fullScreenImg} 
              className="max-w-full max-h-full object-contain rounded-3xl md:rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)] border border-white/10" 
              alt="Immersive product view" 
              onClick={e => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <CustomSectionEmbed location="product_bottom" />
    </div>
  );
};

export default ProductDetails;
