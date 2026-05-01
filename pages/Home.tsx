
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import ReactPlayer from 'react-player';
import { getReadableAddress } from '../services/location';
import { useNotify } from '../components/Notifications';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import Logo from '../components/Logo';
import Icon from '../components/Icon';
import WelcomePopup from '../components/WelcomePopup';
import MysteryBox from '../components/MysteryBox';
import SEO from '../components/SEO';
import { useTheme } from '../components/ThemeContext';
import { ProductSkeleton } from '../components/Skeletons';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';

const FullScreenStory = ({ stories, activeIndex, onClose, onNext, onPrev }: any) => {
   const notify = useNotify();
   const [progress, setProgress] = useState(0);
   const [isPaused, setIsPaused] = useState(false);
   const [loading, setLoading] = useState(true);
   const videoRef = useRef<HTMLVideoElement>(null);
   const audioRef = useRef<HTMLAudioElement>(null);
   const timerRef = useRef<any>(null);
   
   const currentStory = stories[activeIndex];
   const isVideo = currentStory.type === 'video';
   const hasAudio = !!currentStory.audioUrl;

   const handleShare = async (e: React.MouseEvent) => {
      e.stopPropagation();
         const shareData = {
            title: currentStory.title || 'Check out this story',
            text: currentStory.description || 'Amazing products on Gadget Galaxy',
            url: window.location.href
         };

         if (navigator.share) {
            try {
               await navigator.share(shareData);
            } catch (err) {
               await navigator.clipboard.writeText(window.location.href);
               notify('Link copied to clipboard!', 'success');
            }
         } else {
            await navigator.clipboard.writeText(window.location.href);
            notify('Link copied to clipboard!', 'success');
         }
   };
   
   // Preload audio explicitly
   useEffect(() => {
      setLoading(true);
      setProgress(0);
      
      const prepareMedia = async () => {
         if (hasAudio && audioRef.current) {
            audioRef.current.load();
            try {
               await new Promise((resolve) => {
                  if (!audioRef.current) return resolve(true);
                  if (audioRef.current.readyState >= 3) resolve(true);
                  else audioRef.current.oncanplay = () => resolve(true);
               });
            } catch(e) {}
         }
         
         if (isVideo && videoRef.current) {
            videoRef.current.load();
         }
         setLoading(false);
      };
      
      prepareMedia();
      
      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      }
   }, [activeIndex, hasAudio, isVideo]);
   
   useEffect(() => {
      if (loading || isPaused) {
         if (timerRef.current) clearInterval(timerRef.current);
         return;
      }
      
      if (!isVideo && !hasAudio) {
         // Image only, 5 seconds
         const duration = 5000;
         const startTime = Date.now() - (progress / 100) * duration;
         timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const newProgress = (elapsed / duration) * 100;
            if (newProgress >= 100) {
               clearInterval(timerRef.current);
               setProgress(100);
               onNext();
            } else {
               setProgress(newProgress);
            }
         }, 16);
      } else if (!isVideo && hasAudio) {
         // Image with audio: let audio progress handle it
         if (audioRef.current) {
             audioRef.current.play().catch(()=>{});
         }
      }
      
      if (isVideo) {
         if (videoRef.current) {
             videoRef.current.play().catch(()=>{});
         }
      }
      
      return () => {
         if (timerRef.current) clearInterval(timerRef.current);
      }
   }, [loading, isPaused, isVideo, hasAudio, activeIndex, onNext]);

   const handleAudioTimeUpdate = () => {
      if (!isVideo && hasAudio && audioRef.current && !isPaused) {
         const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
         setProgress(p);
      }
   };
   
   const handleVideoTimeUpdate = () => {
      if (isVideo && videoRef.current && !isPaused) {
         const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
         setProgress(p);
      }
   };

   return (
      <motion.div 
         initial={{ opacity: 0 }}
         animate={{ opacity: 1 }}
         exit={{ opacity: 0 }}
         className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-0 md:p-6"
      >
         <motion.div 
            initial={{ scale: 0.95, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 50, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full h-full md:h-[90vh] max-w-lg mx-auto bg-zinc-950 md:rounded-[2.5rem] overflow-hidden flex items-center justify-center shadow-[0_0_80px_rgba(0,0,0,0.8)] md:border border-white/10"
         >
            {/* Progress Bars */}
            <div className="absolute top-4 left-4 right-4 flex space-x-1.5 z-40 drop-shadow-md">
               {stories.map((s: any, i: number) => (
                  <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-md">
                     <div 
                        className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,1)] rounded-full transition-all duration-100 ease-linear" 
                        style={{ width: i === activeIndex ? `${progress}%` : i < activeIndex ? '100%' : '0%' }}
                     />
                  </div>
               ))}
            </div>

            {/* Header info */}
            <div className="absolute top-8 left-4 right-4 flex justify-between items-start z-40">
               <div className="flex items-center space-x-3 text-white drop-shadow-md bg-black/40 backdrop-blur-xl pr-5 py-2 pl-2 rounded-full border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-[#06331e] flex items-center justify-center font-bold text-xs border border-white/20 shadow-lg relative overflow-hidden shrink-0">
                    <Icon name="bolt" className="text-white drop-shadow-sm relative z-10 text-sm" />
                    <div className="absolute inset-0 bg-white/20 animate-[pulse_2s_ease-in-out_infinite]"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-black text-sm tracking-wider uppercase drop-shadow-md">{currentStory.category}</span>
                    <span className="text-[9px] font-bold text-white/70 uppercase tracking-[0.2em]">{currentStory.type === 'video' ? 'Video Story' : 'Image Story'}</span>
                  </div>
               </div>
               <div className="flex items-center space-x-2">
                 <button onClick={handleShare} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 border border-white/10 transition-all shadow-lg group">
                   <Icon name="share-alt" className="text-lg drop-shadow-md group-active:scale-95 transition-transform" />
                 </button>
                 <button onClick={onClose} className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 border border-white/10 transition-all shadow-lg group">
                   <Icon name="times" className="text-xl drop-shadow-md group-active:scale-95 transition-transform" />
                 </button>
               </div>
            </div>

            {loading && (
               <div className="absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/50 backdrop-blur-sm">
                   <Icon name="spinner-third" className="animate-spin text-4xl text-white drop-shadow-lg" />
               </div>
            )}

            {/* Media */}
            <div 
               className="w-full h-full flex items-center justify-center bg-zinc-950 relative overflow-hidden group"
               onPointerDown={() => setIsPaused(true)}
               onPointerUp={() => setIsPaused(false)}
               onPointerLeave={() => setIsPaused(false)}
               onTouchStart={() => setIsPaused(true)}
               onTouchEnd={() => setIsPaused(false)}
            >
                <div className="absolute inset-0 z-10 pointer-events-none shadow-[inset_0_0_120px_40px_rgba(0,0,0,0.9)] bg-gradient-to-b from-black/40 via-transparent to-black/80"></div>
                
                {isVideo ? (
                   currentStory.mediaUrl.toLowerCase().includes('.mp4') ? (
                     <video 
                        ref={videoRef}
                        src={currentStory.mediaUrl}
                        className="w-full h-full object-contain transform transition-transform duration-[10s] ease-linear group-hover:scale-105"
                        onPlaying={() => {
                           if (audioRef.current && !isPaused) audioRef.current.play().catch(()=>{});
                        }}
                          onWaiting={() => {
                             if (audioRef.current) audioRef.current.pause();
                          }}
                          onTimeUpdate={handleVideoTimeUpdate}
                          onEnded={onNext}
                          playsInline
                          loop={false}
                          muted={hasAudio}
                       />
                   ) : (
                       <div className="w-full h-full">
                           <ReactPlayer 
                               url={currentStory.mediaUrl} 
                               playing={!isPaused && !loading} 
                               controls={false}
                               muted={hasAudio}
                               width="100%" 
                               height="100%" 
                               style={{ pointerEvents: 'none', objectFit: 'contain' }}
                               onProgress={(state: any) => {
                                   if (!isPaused && state.playedSeconds > 0 && state.loadedSeconds > 0) {
                                       setProgress(state.played * 100);
                                   }
                               }}
                               onEnded={onNext}
                               config={{
                                   youtube: { playerVars: { showinfo: 0, controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, fs: 0 } as any },
                                   facebook: { appId: '29c39d8a7be8404a', attributes: { 'data-hide-controls': 'true', 'data-show-captions': 'false' } }
                               }}
                           />
                       </div>
                   )
                ) : (
                  <img src={currentStory.mediaUrl} className="w-full h-full object-contain transform transition-transform duration-[10s] ease-linear group-hover:scale-105 select-none" draggable="false" alt="story" />
                )}
            </div>

            {hasAudio && (
              <audio 
                 ref={audioRef}
                 src={`${currentStory.audioUrl}#t=${currentStory.audioStart || 0}`} 
                 playsInline 
                 preload="auto"
                 className="hidden"
                 onTimeUpdate={handleAudioTimeUpdate}
                 onEnded={!isVideo ? onNext : undefined}
              />
            )}

            {/* Content Info (if any) */}
            {currentStory.title && (
               <div className="absolute bottom-28 left-4 right-4 z-40">
                  <h3 className="text-white text-2xl font-black drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] mb-2">{currentStory.title}</h3>
                  {currentStory.description && <p className="text-white/90 text-sm font-medium drop-shadow-md">{currentStory.description}</p>}
               </div>
            )}

            {/* Click Areas */}
            <div className="absolute inset-0 z-30 flex">
               <div className="w-1/3 h-full cursor-pointer" onClick={() => { onPrev(); }}></div>
               <div className="w-2/3 h-full cursor-pointer" onClick={() => { onNext(); }}></div>
            </div>
            
            {/* CTA */}
            {currentStory.linkUrl && (
               <div className="absolute bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
                 <button onClick={() => { window.location.href = currentStory.linkUrl; }} className="bg-white/90 backdrop-blur-3xl text-emerald-950 px-10 py-5 rounded-full font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_60px_rgba(0,0,0,0.6)] hover:bg-white hover:-translate-y-2 active:scale-95 transition-all flex items-center space-x-4 group border border-white/50 pointer-events-auto overflow-hidden animate-bounce-subtle">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <Icon name="chevron-up" className="text-lg animate-[bounce_1.5s_infinite]" />
                    </div>
                    <span className="relative z-10 text-[#06331e]">Swipe up to shop</span>
                 </button>
               </div>
            )}
         </motion.div>
      </motion.div>
   );
};

const ThinBanner = ({ banner, navigate }: { banner: any, navigate: any }) => {
   const [showAdLabel, setShowAdLabel] = useState(false);

   useEffect(() => {
      let timeout: any;
      if (showAdLabel) {
         timeout = setTimeout(() => setShowAdLabel(false), 3000);
      }
      return () => clearTimeout(timeout);
   }, [showAdLabel]);

   if (!banner) return null;

   return (
      <div className="relative overflow-hidden rounded-3xl cursor-pointer hover-tilt w-full mb-14 border border-zinc-100 dark:border-zinc-800 shadow-sm" onClick={() => banner.link && navigate(banner.link)}>
         <img src={banner.imageUrl} alt="banner" className="w-full h-auto object-cover" />
         
         <div 
           className="absolute top-3 right-3 z-20 flex items-center justify-end"
           onClick={(e) => { e.stopPropagation(); setShowAdLabel(!showAdLabel); }}
         >
           <motion.div
             layout
             className="bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center text-white overflow-hidden shadow-lg border border-white/20"
             initial={{ borderRadius: 999 }}
           >
             <AnimatePresence mode="wait">
               {showAdLabel ? (
                 <motion.span 
                   key="text"
                   initial={{ opacity: 0, width: 0 }}
                   animate={{ opacity: 1, width: "auto" }}
                   exit={{ opacity: 0, width: 0 }}
                   className="pl-3 pr-4 py-1.5 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap"
                 >
                   Sponsored Ad
                 </motion.span>
               ) : (
                 <motion.div 
                   key="icon"
                   className="w-8 h-8 flex items-center justify-center font-serif text-sm font-bold"
                 >
                   i
                 </motion.div>
               )}
             </AnimatePresence>
           </motion.div>
         </div>
      </div>
   );
};

const Home: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeFeatured, setActiveFeatured] = useState(0);
  const [activeCategory, setActiveCategory] = useState('All');
  const [locationName, setLocationName] = useState('Locating...');
  const [quickViewImg, setQuickViewImg] = useState<string | null>(null);
  const [stories, setStories] = useState<any[]>([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [viewedStories, setViewedStories] = useState<string[]>([]);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const isStoryPausedRef = useRef(false);
  const storyVideoRef = useRef<HTMLVideoElement>(null);
  const storyAudioRef = useRef<HTMLAudioElement>(null);

  const setStoryPaused = (paused: boolean) => {
    setIsStoryPaused(paused);
    isStoryPausedRef.current = paused;
    if (storyVideoRef.current) {
      if (paused) storyVideoRef.current.pause();
      else storyVideoRef.current.play();
    }
    if (storyAudioRef.current) {
      if (paused) storyAudioRef.current.pause();
      else storyAudioRef.current.play();
    }
  };

  useEffect(() => {
    try {
      const vs = JSON.parse(localStorage.getItem('f_viewed_stories') || '[]');
      setViewedStories(vs);
    } catch(e) {}
  }, []);

  const handleStoryClick = (idx: number) => {
    setActiveStoryIndex(idx);
    const sId = stories[idx]?.id;
    if (sId && !viewedStories.includes(sId)) {
      const newVs = [...viewedStories, sId];
      setViewedStories(newVs);
      localStorage.setItem('f_viewed_stories', JSON.stringify(newVs));
    }
  };

  const heroBanners = banners.filter(b => (!b.bannerType || b.bannerType === 'hero'));
  const popupBanners = banners.filter(b => b.bannerType === 'popup');
  const gifBanners = banners.filter(b => b.bannerType === 'gif');

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % heroBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  useEffect(() => {
     try {
        const h = JSON.parse(localStorage.getItem('f_search_history') || '[]');
        setSearchHistory(h);
     } catch(e) {}
  }, []);

  const saveSearchHistory = (query: string) => {
     if (!query.trim()) return;
     try {
        let history = JSON.parse(localStorage.getItem('f_search_history') || '[]');
        history = [query.trim(), ...history.filter((h: string) => h !== query.trim())].slice(0, 5);
        localStorage.setItem('f_search_history', JSON.stringify(history));
        setSearchHistory(history);
     } catch(e) {}
  };
  const [timeLeft, setTimeLeft] = useState({ y: 0, mo: 0, d: 0, h: 2, m: 45, s: 30 });
  const [showProof, setShowProof] = useState(false);
  const [proofData, setProofData] = useState({ name: 'Someone', item: 'an item', location: 'Dhaka' });

  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  
  const bannerContainerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: bannerContainerRef,
    offset: ["start end", "end start"],
    layoutEffect: false
  });
  
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const smoothY = useSpring(parallaxY, { stiffness: 80, damping: 20, restDelta: 0.001 });

  useEffect(() => {
    const qProds = query(collection(db, 'products'));
    const unsubscribeProds = onSnapshot(qProds, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (err) => {
      console.warn("Products fetch error:", err.message);
    });

    const qBanners = query(collection(db, 'banners'), orderBy('createdAt', 'desc'));
    const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
      setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Banners fetch error:", err.message);
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'settings', 'platform'), (snap) => {
      if (snap.exists()) setSettings(snap.data());
    });

    const unsubscribeStories = onSnapshot(collection(db, 'stories'), (snap) => {
      setStories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    import('firebase/firestore').then(({ limit }) => {
      const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'), limit(3));
      onSnapshot(qBlogs, (snap) => {
        setRecentBlogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const address = await getReadableAddress(position.coords.latitude, position.coords.longitude);
        setLocationName(address);
      }, () => setLocationName('Dhaka, Bangladesh'));
    }
    return () => { unsubscribeProds(); unsubscribeBanners(); unsubscribeSettings(); unsubscribeStories(); };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (settings?.dealEndTime) {
         const diff = new Date(settings.dealEndTime).getTime() - new Date().getTime();
          if (diff > 0) {
            const totalDays = Math.floor(diff / (1000 * 60 * 60 * 24));
            const y = Math.floor(totalDays / 365);
            const mo = Math.floor((totalDays % 365) / 30);
            const d = (totalDays % 365) % 30;
            const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft({ y, mo, d, h, m, s });
         } else {
            setTimeLeft({ y: 0, mo: 0, d: 0, h: 0, m: 0, s: 0 });
         }
      } else {
         setTimeLeft({ y: 0, mo: 0, d: 0, h: 0, m: 0, s: 0 });
      }
    }, 1000);
    
    // Setup timer based on initial load
    return () => clearInterval(timer);
  }, [settings?.dealEndTime]);

  // Separate useEffect for the Social Proof logic so we always have the freshest products list
  useEffect(() => {
    const proofTimer = setInterval(() => {
       if (localStorage.getItem('hide_mock_purchases') === 'true') return;

       const names = [
          'Karim', 'Ayesha', 'Mominul', 'Nafis', 'Tasnim', 'Rahim', 'Jamil', 'Sadia', 'Farid', 'Imran', 
          'Tarek', 'Hasan', 'Rakib', 'Mehedi', 'Sumaiya', 'Anis', 'Sabbir', 'Arif', 'Riyad', 'Sanjida', 'Rubel', 'Nazmul'
       ];
       const locations = [
          'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Comilla', 'Gazipur', 'Narayanganj', 'Bogra'
       ];
       
       let randomItemTitle = 'Premium Gadget';
       if (products.length > 0) {
          randomItemTitle = products[Math.floor(Math.random() * products.length)].name;
       } else {
          // Fallback just in case
          const fallbackItems = ['AirPods Pro', 'MacBook Air', 'iPhone 15', 'Apple Watch'];
          randomItemTitle = fallbackItems[Math.floor(Math.random() * fallbackItems.length)];
       }

       setProofData({
          name: names[Math.floor(Math.random() * names.length)],
          location: locations[Math.floor(Math.random() * locations.length)],
          item: randomItemTitle
       });
       setShowProof(true);
       setTimeout(() => setShowProof(false), 8000);
    }, 15000);

    return () => clearInterval(proofTimer);
  }, [products]);

  useEffect(() => {
    if (!settings?.featuredCategory) return;
    const featuredProds = products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase());
    if (featuredProds.length > 1) {
      const interval = setInterval(() => setActiveFeatured(prev => (prev + 1) % featuredProds.length), 4000);
      return () => clearInterval(interval);
    }
  }, [products, settings?.featuredCategory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      return;
    }
    const results = products.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
    setSearchResults(results);
  }, [searchQuery, products]);

  // Auto Slider for Hero Banners
  useEffect(() => {
     let heroBanners = [];
     if (banners && banners.length > 0) {
        heroBanners = banners;
     } else if (settings?.heroBanners && settings?.heroBanners.length > 0) {
        heroBanners = settings.heroBanners;
     } else {
        heroBanners = [
           { title: 'Summer Collection', description: 'Up to 50% off on all items', imageUrl: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&auto=format&fit=crop&q=80', link: '' },
           { title: 'New Tech Gadgets', description: 'Discover the future today', imageUrl: 'https://images.unsplash.com/photo-1542382257-80dedb725088?w=800&auto=format&fit=crop&q=80', link: '' }
        ];
     }
     
     if (heroBanners.length > 1) {
        const interval = setInterval(() => {
           setActiveBanner(prev => (prev + 1) % heroBanners.length);
        }, 5000);
        return () => clearInterval(interval);
     }
  }, [banners, settings?.heroBanners]);

  // Story progress logic
  useEffect(() => {
     let progressInterval: any;
     if (activeStoryIndex !== null) {
        setStoryProgress(0);
        const currentStory = stories[activeStoryIndex];
        // If it's a video, progress is handled by ReactPlayer's onProgress unless it fails.
        // For images, we use a 10 second duration.
        if (currentStory && currentStory.type !== 'video') {
            progressInterval = setInterval(() => {
               if (isStoryPausedRef.current) return;
               setStoryProgress(prev => {
                  if (prev >= 100) {
                     if (activeStoryIndex < stories.length - 1) {
                        setActiveStoryIndex(activeStoryIndex + 1);
                        return 0;
                     } else {
                        setActiveStoryIndex(null);
                        return 0;
                     }
                  }
                  return prev + (100 / 100); // 100 steps of 100ms = 10 seconds total
               });
            }, 100);
        }
     }
     return () => clearInterval(progressInterval);
  }, [activeStoryIndex, stories]);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const categories = [
    { name: 'Mobile', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Accessories', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Gadgets', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=250&h=250&auto=format&fit=crop' },
    { name: 'Chargers', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?q=80&w=250&h=250&auto=format&fit=crop' }
  ];

  return (
    <div className="relative pt-8 pb-24 px-6 md:px-12 bg-zinc-50 dark:bg-zinc-800 max-w-[1440px] mx-auto min-h-screen font-inter">
      <SEO 
        title="Home" 
        description="VibeGadget - Premium Tech Hub for Mobile, Accessories, and Gadgets in Bangladesh" 
        keywords="vibegadget, gadgets, mobile, accessories, apple, iphone, tech, bd" 
        jsonLd={{
           "@context": "https://schema.org",
           "@type": "WebSite",
           "name": "VibeGadget",
           "url": "https://vibegadget.com",
           "potentialAction": {
             "@type": "SearchAction",
             "target": "https://vibegadget.com/search?q={search_term_string}",
             "query-input": "required name=search_term_string"
           }
        }}
      />
      <WelcomePopup banners={popupBanners} />
      <CustomSectionEmbed location="home_top" />
      {(settings?.mysteryBoxActive ?? true) && <MysteryBox products={products} />}
      {/* Aesthetic Background Blobs */}
      <div className="blob bg-emerald-300/30 w-64 h-64 rounded-full top-0 left-[-10%] z-0"></div>
      <div className="blob bg-emerald-200/20 w-96 h-96 rounded-full top-[20%] right-[-10%] animation-delay-2000 z-0"></div>
      <div className="blob bg-blue-200/20 w-80 h-80 rounded-full bottom-[10%] left-[10%] animation-delay-4000 z-0"></div>

      {/* Premium Announcement Bar */}
      <div className="absolute top-0 left-0 w-full bg-[#06331e] text-emerald-100 py-1.5 overflow-hidden z-50 flex items-center shadow-md">
        <div className="animate-marquee whitespace-nowrap text-[9px] font-black tracking-[0.2em] uppercase flex items-center">
          <span className="mx-8 inline-flex items-center"><Icon name="bolt" className="w-3 h-3 text-emerald-400 mr-2"/> Free Shipping on orders over ৳5000</span>
          <span className="mx-8 inline-flex items-center"><Icon name="award" className="w-3 h-3 text-yellow-400 mr-2"/> 100% Authentic Products</span>
          <span className="mx-8 inline-flex items-center"><Icon name="shield-check" className="w-3 h-3 text-blue-400 mr-2"/> 12 Months Warranty Included</span>
          <span className="mx-8 text-white inline-flex items-center">Use Code: VIBE20 for 20% OFF</span>
        </div>
      </div>

      <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex justify-between items-center mb-6 md:mb-10 pt-2">
        <div className="flex-1 md:hidden">
          <Logo scale={0.8} className="origin-left" />
        </div>
        <div className="hidden md:flex flex-1 items-center">
           <h2 className="text-2xl lg:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
             <Icon name={new Date().getHours() < 18 ? "sun" : "moon"} className="text-emerald-500 text-3xl animate-[spin_10s_linear_infinite]" />
             <span>{new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, <span className="text-emerald-600 dark:text-emerald-400 font-black">Explorer</span></span>
           </h2>
        </div>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <div ref={searchRef} className="hidden lg:flex relative w-64 xl:w-80 transition-all duration-300 z-50">
            <div className={`relative flex items-center bg-zinc-100 dark:bg-zinc-800/50 rounded-full border transition-all duration-300 ${isSearchFocused ? 'border-emerald-500 ring-4 ring-emerald-500/10 bg-white dark:bg-zinc-800 shadow-lg' : 'border-zinc-200 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800'}`}>
              <Icon name="search" className={`absolute left-4 transition-colors ${isSearchFocused ? 'text-emerald-500' : 'text-zinc-400'}`} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full bg-transparent py-2.5 pl-11 pr-10 outline-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={(e) => {
                  if(e.key === 'Enter') {
                     saveSearchHistory(searchQuery);
                     navigate('/search');
                  }
                }}
              />
              {isSearchFocused && searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 w-5 h-5 bg-zinc-200 dark:bg-zinc-700 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                   <Icon name="times" className="text-[8px]" />
                </button>
              )}
            </div>

            {/* Desktop Search Dropdown */}
            <AnimatePresence>
              {isSearchFocused && (searchQuery.trim() !== '' || searchHistory.length > 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 w-[400px] mt-3 bg-white dark:bg-zinc-900 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] border border-zinc-200/80 dark:border-zinc-800 overflow-hidden backdrop-blur-xl"
                >
                  {searchQuery.trim() === '' && searchHistory.length > 0 ? (
                    <div className="p-4">
                       <div className="flex items-center justify-between mb-2 px-2">
                         <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Recent Searches</p>
                         <button onClick={() => { localStorage.removeItem('f_search_history'); setSearchHistory([]); }} className="text-[9px] font-bold uppercase tracking-widest text-emerald-500 hover:text-emerald-600 transition-colors">Clear</button>
                       </div>
                       <div className="flex flex-wrap gap-2">
                         {searchHistory.map((h, i) => (
                           <button 
                              key={i} 
                              onClick={() => {
                                 setSearchQuery(h);
                                 setIsSearchFocused(false);
                                 saveSearchHistory(h);
                                 navigate('/search');
                              }}
                              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-700 dark:hover:text-emerald-300 rounded-xl transition-all text-left text-xs font-semibold text-zinc-600 dark:text-zinc-300 border border-transparent hover:border-emerald-200 dark:hover:border-emerald-800"
                           >
                              <Icon name="history" className="mr-2 text-[10px] opacity-60" />
                              {h}
                           </button>
                         ))}
                       </div>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-3">
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 px-5 mb-2">Products</p>
                      {searchResults.map(product => (
                        <div 
                          key={product.id} 
                          onClick={() => navigate(`/product/${product.id}`)}
                          className="flex items-center space-x-4 px-5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors group"
                        >
                          <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center shrink-0 border border-zinc-200 dark:border-zinc-700 overflow-hidden transform group-hover:scale-105 transition-transform">
                            <img src={product.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt={product.name} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{product.name}</p>
                            <p className="text-xs font-semibold text-emerald-500">৳{product.isOffer && product.offerPrice ? product.offerPrice : product.price}</p>
                          </div>
                        </div>
                      ))}
                      <div className="px-5 mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                         <button onClick={() => navigate('/search')} className="w-full py-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors">
                           View All Results
                         </button>
                      </div>
                    </div>
                  ) : searchQuery.trim() !== '' ? (
                    <div className="py-12 text-center flex flex-col items-center">
                       <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                         <Icon name="search" className="text-2xl text-zinc-300 dark:text-zinc-600" />
                       </div>
                       <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-1">No products found</p>
                       <p className="text-xs text-zinc-500 px-6">We couldn't find anything matching "{searchQuery}". Try different keywords.</p>
                    </div>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="hidden md:flex flex-col text-right mr-2 lg:mr-0 pl-4 lg:border-l lg:border-zinc-200 lg:dark:border-zinc-700/50">
            <p className="text-[9px] text-zinc-400 font-black uppercase tracking-widest mb-0.5">Delivery To</p>
            <button className="flex items-center justify-end font-bold text-xs hover:text-[#06331e] dark:hover:text-emerald-400 transition-colors whitespace-nowrap text-zinc-800 dark:text-zinc-200">
              <Icon name="map-marker" className="text-emerald-500 mr-1.5 text-[10px]" />
              <span className="truncate max-w-[120px]">{locationName}</span>
            </button>
          </div>
          
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 rounded-full p-1 border border-zinc-200 dark:border-zinc-700/50">
             <button onClick={toggleTheme} className="w-10 h-10 flex items-center justify-center rounded-full cursor-pointer relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
                <Icon name={isDark ? "sun" : "moon"} className="text-sm" />
             </button>
             <button onClick={() => navigate('/notifications')} className="w-10 h-10 flex items-center justify-center rounded-full relative active:scale-95 transition-transform hover:bg-white dark:hover:bg-zinc-700 shadow-sm group text-zinc-600 dark:text-zinc-400">
               <Icon name="bell" className="text-sm" />
               <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_0_2px_#f4f4f5] dark:shadow-[0_0_0_2px_#27272a] animate-pulse"></span>
             </button>
          </div>
        </div>
      </motion.div>

      {/* Stories Section */}
      <div className="flex gap-4 md:gap-5 overflow-x-auto no-scrollbar mb-8 py-4 px-1 items-center animate-stagger-1 w-full text-center">
         {stories.length > 0 ? stories.map((story, idx) => (
            <div key={story.id} onClick={() => handleStoryClick(idx)} className="flex flex-col items-center gap-2.5 cursor-pointer group shrink-0 w-[78px] md:w-[92px]">
               <div className={`relative p-[3px] rounded-full transition-transform duration-300 group-hover:scale-105 ${viewedStories.includes(story.id) ? 'bg-zinc-300 dark:bg-zinc-700' : 'bg-gradient-to-tr from-emerald-400 via-teal-500 to-[#06331e] dark:to-emerald-200'}`}>
                  <div className="w-16 h-16 md:w-[82px] md:h-[82px] rounded-full border-[3px] border-zinc-50 dark:border-zinc-800 flex items-center justify-center shadow-inner overflow-hidden bg-white dark:bg-zinc-900 group-active:scale-95 transition-transform duration-200">
                     {story.type === 'video' ? (
                        <video src={`${story.mediaUrl}#t=0.001`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" muted preload="metadata" playsInline />
                     ) : (
                        <img src={story.mediaUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="" />
                     )}
                  </div>
               </div>
               <span className={`text-[9px] md:text-[10px] font-black truncate w-full text-center transition-colors uppercase tracking-[0.1em] ${viewedStories.includes(story.id) ? 'text-zinc-500' : 'text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400'}`}>{story.category}</span>
            </div>
         )) : [
           { icon: 'fire', text: 'Trending', bg: 'bg-orange-100', color: 'text-orange-500' },
           { icon: 'star', text: 'New', bg: 'bg-emerald-100', color: 'text-emerald-500' },
           { icon: 'gift', text: 'Offers', bg: 'bg-blue-100', color: 'text-blue-500' },
           { icon: 'crown', text: 'Premium', bg: 'bg-purple-100', color: 'text-purple-500' },
           { icon: 'bolt', text: 'Flash', bg: 'bg-red-100', color: 'text-red-500' }
         ].map((story, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 cursor-pointer group shrink-0 w-[72px] md:w-[88px]">
               <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${story.bg} border-2 border-white ring-1 ring-zinc-200 group-hover:ring-emerald-400 group-hover:ring-2 group-hover:ring-offset-2 transition-all flex items-center justify-center shadow-sm`}>
                  <Icon name={story.icon} className={`text-xl md:text-2xl ${story.color} transition-transform`} />
               </div>
               <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:text-white w-full truncate">{story.text}</span>
            </div>
         ))}
      </div>

      {heroBanners.length > 0 && (
      <motion.div 
        ref={bannerContainerRef}
        className="relative mb-14 -mx-6 md:mx-0 md:rounded-[3rem] overflow-hidden shadow-2xl z-10 border-0 md:border-4 border-white dark:border-zinc-800 animate-stagger-2 hover-tilt"
      >
        <div className="absolute inset-0 bg-mesh-pattern opacity-30 mix-blend-overlay z-0 pointer-events-none"></div>
        <div className="flex transition-transform duration-1000 ease-[cubic-bezier(0.23, 1, 0.32, 1)]" style={{ transform: `translateX(-${activeBanner * 100}%)` }}>
          {heroBanners.map((banner, i) => (
            <div key={i} className="min-w-full bg-zinc-900 border border-zinc-800/50 h-[220px] md:h-[300px] lg:h-[380px] relative overflow-hidden flex items-center">
               <motion.img 
                src={banner.imageUrl} 
                style={{ y: smoothY, scale: 1.2 }}
                className="absolute inset-0 w-full h-full object-cover origin-center opacity-70 mix-blend-overlay" 
                alt="" 
               />
               <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-emerald-950/40 to-transparent"></div>
               <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                  <span className="inline-block px-3 py-1 bg-white/10 text-emerald-200 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 backdrop-blur-md">Featured Offer</span>
                  <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tighter mb-4 uppercase leading-[1.1] text-white line-clamp-3 w-full whitespace-normal drop-shadow-md">{banner.title}</h2>
                  <p className="text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] opacity-80 mb-6 md:mb-8 text-emerald-100 truncate w-full max-w-sm">{banner.description}</p>
                  <button onClick={() => banner.link && navigate(banner.link)} className="mt-4 px-10 py-4 bg-white/95 backdrop-blur-md text-[#06331e] rounded-2xl font-black text-xs uppercase tracking-widest shadow-[0_15px_40px_rgba(0,0,0,0.3)] hover:bg-white hover:-translate-y-1.5 hover:shadow-black/40 transition-all flex items-center gap-3 group whitespace-nowrap active:scale-95 border border-white/50">
                    <span>Shop Now</span>
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                      <Icon name="arrow-right" className="text-[10px] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
               </div>
            </div>
          ))}
        </div>
        <div className="absolute bottom-6 right-8 flex space-x-2 z-20">
           {heroBanners.map((_, i) => (
             <div key={i} onClick={() => setActiveBanner(i)} className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${i === activeBanner ? 'w-10 bg-white' : 'w-3 bg-white/30 hover:bg-white/50'}`}></div>
           ))}
        </div>
      </motion.div>
      )}

      {settings?.featuredCategory && products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).length > 0 && (
        <div className="mb-10 md:mb-14">
          <div className="relative w-full h-[280px] sm:h-[300px] md:h-[340px] lg:h-[380px] rounded-[2.5rem] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-xl bg-white dark:bg-zinc-900 group">
            <div className="flex transition-transform duration-1000 ease-[cubic-bezier(0.23, 1, 0.32, 1)] h-full" style={{ transform: `translateX(-${activeFeatured * 100}%)` }}>
              {products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).map((product, i) => (
                <div key={product.id} className="min-w-full h-full relative grid grid-cols-5 items-center">
                   <div className="col-span-2 md:col-span-3 h-full relative bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center p-6 overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-200/50 via-zinc-100/10 to-zinc-50/0 dark:from-zinc-700/50 dark:via-zinc-800/10 dark:to-zinc-900/0 mix-blend-multiply dark:mix-blend-normal"></div>
                      <img src={product.image} className="w-full h-[80%] object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-[1.1] transition-transform duration-1000 relative z-10 drop-shadow-xl" alt={product.name} />
                   </div>
                   <div className="col-span-3 md:col-span-2 p-6 md:p-10 flex flex-col justify-center h-full bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white relative">
                      <div className="absolute top-0 right-0 p-4 md:p-6">
                        <span className="px-3 py-1.5 bg-[#06331e] text-emerald-300 dark:bg-zinc-900/10 dark:text-black rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md whitespace-nowrap border border-emerald-900/50 dark:border-zinc-900/20">Featured</span>
                      </div>
                      <h4 className="text-lg md:text-2xl lg:text-3xl font-black mb-2 tracking-tight line-clamp-2 w-full pr-4">{product.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mb-6 md:mb-8 truncate w-full">
                         <p className="text-xl md:text-3xl font-black text-emerald-400">৳{product.isOffer && product.offerPrice ? product.offerPrice : product.price}</p>
                         {product.isOffer && <p className="text-xs md:text-sm text-zinc-500 font-bold line-through">৳{product.price}</p>}
                      </div>
                      <button onClick={() => navigate(`/product/${product.id}`)} className="mt-2 px-6 md:px-8 py-3 md:py-4 bg-zinc-50 dark:bg-zinc-900 text-[#06331e] dark:text-white font-black uppercase tracking-[0.2em] text-[10px] md:text-xs rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors self-start shadow-xl shadow-black/10 active:scale-95 flex items-center whitespace-nowrap">
                        Shop Now <Icon name="arrow-right" className="ml-3 text-[10px]" />
                      </button>
                   </div>
                </div>
              ))}
            </div>
            <div className="absolute bottom-4 left-6 md:left-auto md:right-6 flex space-x-1.5 z-20">
              {products.filter(p => p.category.toLowerCase() === settings.featuredCategory.toLowerCase()).map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${i === activeFeatured ? 'w-6 bg-emerald-400' : 'w-1.5 bg-zinc-50 dark:bg-zinc-900/30'}`}></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 md:mb-16 lg:hidden">
        <h1 className="text-4xl md:text-4xl lg:text-3xl xl:text-2xl font-black font-outfit tracking-tight text-zinc-900 dark:text-zinc-100 leading-[1.1] mb-2 animate-fade-in">Find your perfect <br/><span className="text-gradient">vibe gadget.</span></h1>
        
        <div ref={searchRef} className="relative w-full max-w-md mt-8 z-50 hover-lift">
          <div className={`relative flex items-center bg-zinc-50 dark:bg-zinc-800 rounded-2xl border transition-all ${isSearchFocused ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-zinc-50 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-700'}`}>
            <Icon name="search" className="absolute left-5 text-zinc-400" />
            <input 
              type="text" 
              placeholder="Search for iPhones, AirPods, accessories..." 
              className="w-full bg-transparent py-4 pl-12 pr-12 outline-none text-sm font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={(e) => {
                if(e.key === 'Enter') {
                   saveSearchHistory(searchQuery);
                   navigate('/search');
                }
              }}
            />
            <button className="absolute right-4 text-emerald-500 hover:text-emerald-700 transition-colors">
               <Icon name="microphone" />
            </button>
          </div>

          <AnimatePresence>
            {isSearchFocused && (searchQuery.trim() !== '' || searchHistory.length > 0) && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute top-full mt-2 w-full bg-zinc-50 dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden"
              >
                {searchQuery.trim() === '' && searchHistory.length > 0 ? (
                  <div className="p-2">
                     <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 px-3 py-2">Recent Searches</p>
                     {searchHistory.map((h, i) => (
                       <button 
                          key={i} 
                          onClick={() => {
                             setSearchQuery(h);
                             setIsSearchFocused(false);
                             saveSearchHistory(h);
                             navigate('/search');
                          }}
                          className="w-full flex items-center p-3 hover:bg-zinc-50 dark:bg-zinc-800 rounded-xl transition-colors text-left"
                       >
                          <Icon name="history" className="text-zinc-400 mr-3 text-xs" />
                          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{h}</span>
                       </button>
                     ))}
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map(product => (
                      <div 
                        key={product.id} 
                        onClick={() => navigate(`/product/${product.id}`)}
                        className="flex items-center space-x-4 px-5 py-3 hover:bg-zinc-50 dark:bg-zinc-800 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-100 dark:border-zinc-800 flex-shrink-0 p-1">
                          <img src={product.image} className="w-full h-full object-contain" alt={product.name} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs truncate text-zinc-900 dark:text-zinc-100">{product.name}</h4>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">৳{product.price}</p>
                        </div>
                      </div>
                    ))}
                    <div className="px-3 pt-2 pb-1 border-t border-zinc-50">
                      <button onClick={() => navigate('/search')} className="w-full py-2 bg-zinc-50 dark:bg-zinc-800 hover:bg-[#06331e] hover:text-white rounded-xl text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 transition-colors">
                        View All Results
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 text-center text-sm font-semibold text-zinc-500">
                    No products found for "{searchQuery}"
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Search Output above */}

      <div className="mb-10 w-full animate-fade-in group cursor-pointer" onClick={() => navigate('/affiliate')}>
         <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between border border-emerald-200/50 dark:border-emerald-800/30 transition-all hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700/50 relative overflow-hidden">
            <div className="flex items-center flex-col md:flex-row gap-5 mb-6 md:mb-0 md:mr-8 w-full z-10">
               <div className="text-center md:text-left flex-1">
                 <h3 className="text-xl font-bold text-emerald-950 dark:text-emerald-50 tracking-tight mb-2">Partner & Earn Cash</h3>
                 <p className="text-emerald-800 dark:text-emerald-200/80 text-sm font-medium">Share your referral link and earn up to <span className="font-bold text-emerald-900 dark:text-emerald-300">৳200 commission</span> per successful sale.</p>
               </div>
            </div>
            <button className="w-full md:w-auto bg-emerald-700 dark:bg-emerald-600 text-white px-8 py-3.5 rounded-xl text-sm font-bold transition-all active:scale-95 whitespace-nowrap hover:bg-emerald-800 dark:hover:bg-emerald-500 z-10 shadow-sm block text-center">
               Start Earning
            </button>
         </div>
      </div>

      {products.filter(p => p.isOffer).length > 0 && (
        <div className="mb-12 animate-fade-in">
           <div className="bg-red-50/50 rounded-2xl p-4 md:p-5 border border-red-100 relative overflow-hidden glow-effect">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full blur-[80px] opacity-10 animate-float"></div>
              <div className="relative z-10">
                 <div className="flex items-center space-x-3 mb-4">
                     <div className="w-6 h-6 bg-red-100 text-red-500 rounded-full flex shrink-0 items-center justify-center">
                        <Icon name="bolt" className="text-[10px] animate-pulse" />
                     </div>
                     <div className="flex-1 flex justify-between items-center pr-2 overflow-x-auto no-scrollbar gap-4">
                        <h2 className="text-sm font-black tracking-tight text-red-950 uppercase shrink-0">Limited Deals</h2>
                        <div className="flex items-center space-x-1.5 shrink-0 whitespace-nowrap">
                           {timeLeft.y > 0 && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.y}y</span>}
                           {timeLeft.mo > 0 && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.mo}mo</span>}
                           {timeLeft.d > 0 && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.d}d</span>}
                           {timeLeft.h > 0 && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.h}h</span>}
                           {timeLeft.m > 0 && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.m}m</span>}
                           {(timeLeft.s > 0 || (timeLeft.y === 0 && timeLeft.mo === 0 && timeLeft.d === 0 && timeLeft.h === 0 && timeLeft.m === 0)) && <span className="bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">{timeLeft.s}s</span>}
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex overflow-x-auto no-scrollbar gap-3 md:gap-4 pb-2">
                    {products.filter(p => p.isOffer).map(product => {
                       const originalPrice = product.price;
                       const offerPrice = product.offerPrice || product.price;
                       const discount = Math.round(((originalPrice - offerPrice) / originalPrice) * 100);
                       const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                       
                       return (
                         <div key={product.id} onClick={() => navigate(`/product/${productSlug}/${product.id}`)} className="flex-none w-[140px] md:w-[160px] bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-2.5 border border-red-100/50 shadow-sm hover:border-red-200 transition-colors cursor-pointer group hover:-translate-y-1">
                            <div className="relative aspect-square mb-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center overflow-hidden border border-zinc-100 dark:border-zinc-800 group-hover:border-zinc-200 dark:border-zinc-700 transition-colors">
                               <img 
                                 src={product.image} 
                                 loading="lazy"
                                 className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-700 ease-out" 
                                 alt={product.name}
                                 style={{ opacity: 0 }}
                                 onLoad={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transition = 'opacity 0.4s ease'; }}
                               />
                               {discount > 0 && (
                                  <div className="absolute top-2 left-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">
                                     -{discount}%
                                  </div>
                               )}
                            </div>
                            <div className="px-1">
                               <h3 className="font-bold text-[10px] md:text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-red-600 transition-colors truncate tracking-tight">{product.name}</h3>
                               <div className="flex items-center space-x-1.5 mt-1">
                                  <p className="text-red-600 text-[11px] md:text-sm font-black uppercase tracking-tight">৳{offerPrice}</p>
                                  {discount > 0 && <p className="text-[8px] md:text-[9px] font-bold text-zinc-400 line-through">৳{originalPrice}</p>}
                               </div>
                            </div>
                         </div>
                       );
                    })}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Added Feature Section */}
      <div className="flex overflow-x-auto no-scrollbar gap-3 mb-16 pb-2 px-2 mask-linear-fade">
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="truck-fast" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Fast Delivery Across BD</span>
         </div>
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="shield-check" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">100% Secure Payments</span>
         </div>
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="crown" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">Top Quality Original Gadgets</span>
         </div>
         <div className="bg-zinc-50 dark:bg-zinc-800 rounded-full px-5 py-3 flex items-center shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
            <Icon name="headset" className="text-emerald-600 mr-3 text-sm" />
            <span className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 whitespace-nowrap">24/7 Always Here Support</span>
         </div>
      </div>

      {gifBanners.length > 0 && <ThinBanner banner={gifBanners[0]} navigate={navigate} />}

      <div className="flex justify-start mb-16 overflow-x-auto no-scrollbar gap-6 md:gap-10 pb-4 px-2 animate-stagger-2">
        {categories.map(cat => (
          <motion.button whileHover={{ y: -5 }} key={cat.name} onClick={() => setActiveCategory(cat.name === activeCategory ? 'All' : cat.name)} className={`flex flex-col items-center shrink-0 group`}>
            <div className={`w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center mb-4 transition-all border-4 overflow-hidden ${activeCategory === cat.name ? 'border-[#06331e] shadow-2xl pulse-ring-active' : 'border-zinc-100 dark:border-zinc-800 hover:border-emerald-200 shadow-sm hover-glow border-gradient'}`}>
              <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={cat.name} />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${activeCategory === cat.name ? 'text-[#06331e]' : 'text-zinc-400 group-hover:text-emerald-500'}`}>{cat.name}</span>
          </motion.button>
        ))}
      </div>

      {/* Blog Teaser Section */}
      {recentBlogs.length > 0 && (
         <div className="mb-14 mt-8 px-2">
            <Link to={`/blog/${recentBlogs[0].slug}`} className="group flex flex-col md:flex-row items-center justify-between bg-zinc-900 border border-zinc-800 rounded-3xl p-6 md:px-10 overflow-hidden relative shadow-2xl hover:shadow-emerald-900/20 transition-all">
               <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-700">
                  <img src={recentBlogs[0].image || recentBlogs[0].imageUrl} className="w-full h-full object-cover" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-transparent"></div>
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row items-center justify-between w-full gap-6">
                  <div className="flex-1 flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
                     <span className="bg-emerald-500 text-black dark:text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0">New Story</span>
                     <h3 className="font-bold text-white text-base md:text-lg lg:text-xl line-clamp-1">{recentBlogs[0].title}</h3>
                  </div>
                  <div className="shrink-0 flex items-center bg-white/10 dark:bg-zinc-800/50 backdrop-blur-sm border border-white/10 dark:border-zinc-700 rounded-full px-6 py-3 group-hover:bg-white group-hover:text-black dark:group-hover:bg-zinc-100 dark:group-hover:text-black transition-colors text-white font-bold text-xs uppercase tracking-widest">
                     Read Post <Icon name="arrow-right" className="ml-3 text-[10px] group-hover:translate-x-1 transition-transform" />
                  </div>
               </div>
            </Link>
         </div>
      )}

      <div className="animate-stagger-3 relative z-10">
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-2 px-3 py-1 bg-emerald-50 rounded-full inline-block border border-emerald-100 shadow-sm backdrop-blur-md">Our Collection</h3>
            <h2 className="text-lg md:text-xl font-black tracking-tight text-shine mt-4">New Arrivals.</h2>
          </div>
          <button onClick={() => navigate('/all-products')} className="text-[10px] font-bold uppercase tracking-widest bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-2.5 rounded-full hover:bg-emerald-500 dark:hover:bg-emerald-500 hover:text-white dark:hover:text-white transition-colors flex items-center shadow-lg active:scale-95 group hover-tilt">
            View All <Icon name="arrow-right" className="ml-2 text-[8px] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
          {products.length === 0 ? (
            Array(12).fill(0).map((_, i) => <ProductSkeleton key={i} />)
          ) : (
            products.filter(p => activeCategory === 'All' || p.category === activeCategory).map((product) => (
              <motion.div 
                layout
                key={product.id} 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, type: 'spring' }}
              >
                <div className="block group relative hover-tilt bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 p-2 rounded-[1.5rem] md:rounded-[2rem] mb-2 shadow-sm hover:shadow-md transition-shadow">
                  <Link to={`/product/${product.id}`} className="block relative">
                  <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl md:rounded-2xl mb-4 overflow-hidden relative border border-zinc-100 dark:border-zinc-800/50 transition-all duration-300 aspect-[4/5] flex items-center justify-center">
                    <img 
                      src={product.image} 
                      loading="lazy"
                      className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-105 ${product.stock <= 0 ? 'grayscale opacity-60' : ''}`} 
                      alt={product.name} 
                      style={{ opacity: 0 }}
                      onLoad={(e) => { e.currentTarget.style.opacity = product.stock <= 0 ? '0.6' : '1'; e.currentTarget.style.transition = 'opacity 0.4s ease, transform 0.7s ease'; }}
                    />
                    
                    {product.stock <= 0 ? (
                      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                         <div className="bg-zinc-900/80 backdrop-blur text-white px-3 py-1.5 rounded-full border border-zinc-700 shadow-xl flex items-center space-x-1.5 animate-pulse">
                           <Icon name="clock" className="text-[8px] text-zinc-400" />
                           <span className="text-[8px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Restocking</span>
                         </div>
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2 md:top-3 md:right-3 z-10 transition-transform duration-300 group-hover:-translate-y-0.5">
                        <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-3 py-1.5 rounded-full text-[9px] font-black shadow-sm tracking-widest uppercase">
                          ৳ {product.price}
                        </div>
                      </div>
                    )}
                  </div>
                </Link>
                
                <button 
                  onClick={(e) => { e.preventDefault(); setQuickViewImg(product.image); }}
                  className="absolute top-4 left-4 w-10 h-10 bg-zinc-50 dark:bg-zinc-900/90 backdrop-blur-md rounded-full opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-[#06331e] hover:text-white shadow-lg border border-zinc-100 dark:border-zinc-800/50"
                >
                   <Icon name="expand-alt" className="text-xs" />
                </button>
                
                <div className="px-2 pb-2">
                  <div className="flex items-center text-[9px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                    <Icon name="star" className="text-emerald-500 mr-1 text-[10px]" />{product.rating} • {product.category}
                  </div>
                  <Link to={`/product/${product.id}`}>
                    <h4 className="font-bold text-xs md:text-sm truncate mb-0.5 tracking-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h4>
                  </Link>
                </div>
              </div>
            </motion.div>
            ))
          )}
        </div>
      </div>

      {gifBanners.length > 1 && <ThinBanner banner={gifBanners[1]} navigate={navigate} />}

      <AnimatePresence>
        {quickViewImg && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#06331e]/50 backdrop-blur-xl z-[1000] flex items-center justify-center p-6"
            onClick={() => setQuickViewImg(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-xl aspect-square bg-zinc-50 dark:bg-zinc-800 rounded-3xl shadow-2xl p-10 flex items-center justify-center border border-zinc-100 dark:border-zinc-800"
              onClick={e => e.stopPropagation()}
            >
              <button onClick={() => setQuickViewImg(null)} className="absolute top-6 right-6 w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center hover:bg-[#06331e] hover:text-white transition-all">
                 <Icon name="times" className="text-xs" />
              </button>
              <img src={quickViewImg} className="max-w-full max-h-full object-contain" alt="Preview" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Social Proof Popup */}
      <AnimatePresence>
         {showProof && (
            <motion.div 
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              className="fixed bottom-24 left-6 z-[100] bg-zinc-50 dark:bg-zinc-900/95 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 shadow-2xl rounded-2xl p-4 max-w-[280px]"
            >
               <button 
                  onClick={() => setShowProof(false)}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-400 hover:text-black dark:text-white hover:bg-zinc-200 transition-all"
               >
                  <Icon name="times" className="text-[10px]" />
               </button>
               <div className="flex items-center space-x-4 mb-2 pr-4">
                  <div className="bg-emerald-100 text-emerald-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-inner">
                     <Icon name="check-circle" className="text-sm" />
                  </div>
                  <div>
                     <p className="text-[11px] text-zinc-500 font-medium leading-tight mb-1">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">{proofData.name}</span> from <span className="font-bold text-zinc-900 dark:text-zinc-100">{proofData.location}</span> just bought
                     </p>
                     <p className="text-xs font-black text-emerald-600 truncate tracking-tight">{proofData.item}</p>
                     <p className="text-[9px] text-zinc-400 mt-0.5 uppercase tracking-widest font-bold">Just now</p>
                  </div>
               </div>
               <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 mt-1">
                  <label className="flex items-center space-x-2 cursor-pointer group">
                     <input 
                        type="checkbox" 
                        className="w-3 h-3 text-emerald-600 rounded focus:ring-emerald-500 border-zinc-300"
                        onChange={(e) => {
                           if (e.target.checked) {
                              localStorage.setItem('hide_mock_purchases', 'true');
                              setShowProof(false);
                           }
                        }}
                     />
                     <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest group-hover:text-zinc-600 dark:text-zinc-400 transition-colors">Do not show again</span>
                  </label>
               </div>
            </motion.div>
         )}
      </AnimatePresence>
      
      {/* Brands Marquee (Social Proof) */}
      {gifBanners.length > 2 && <ThinBanner banner={gifBanners[2]} navigate={navigate} />}
      
      <div className="mb-2 md:mb-4 border-t border-b border-zinc-200 dark:border-zinc-800 py-4 overflow-hidden flex relative bg-zinc-50 dark:bg-[#121212]">
         <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-zinc-50 dark:from-[#121212] to-transparent z-10 pointer-events-none"></div>
         <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-zinc-50 dark:from-[#121212] to-transparent z-10 pointer-events-none"></div>
         <div className="animate-marquee whitespace-nowrap flex items-center shrink-0 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            {['Apple', 'Samsung', 'Sony', 'DJI', 'Bose', 'Logitech', 'Anker', 'Xiaomi'].map((brand, idx) => (
               <span key={idx} className="text-xl md:text-3xl font-black uppercase tracking-widest text-[#06331e] dark:text-zinc-500 px-8 md:px-16">{brand}</span>
            ))}
            {['Apple', 'Samsung', 'Sony', 'DJI', 'Bose', 'Logitech', 'Anker', 'Xiaomi'].map((brand, idx) => (
               <span key={idx + 10} className="text-xl md:text-3xl font-black uppercase tracking-widest text-[#06331e] dark:text-zinc-500 px-8 md:px-16">{brand}</span>
            ))}
         </div>
      </div>

      {gifBanners.length > 3 && <ThinBanner banner={gifBanners[3]} navigate={navigate} />}
      {gifBanners.length > 4 && <ThinBanner banner={gifBanners[4]} navigate={navigate} />}

      {/* Floating Action Button */}
      <a href="https://wa.me/8801747708843" target="_blank" rel="noreferrer" className="fixed bottom-24 right-5 md:bottom-10 md:right-10 z-[80] w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:scale-110 active:scale-95 transition-transform group">
         <div className="absolute inset-0 bg-[#25D366] rounded-full animate-ping opacity-30"></div>
         <Icon name="whatsapp" className=" text-2xl drop-shadow-md z-10" />
      </a>

      {/* Dynamic Fullscreen Story Viewer */}
      <AnimatePresence>
         {activeStoryIndex !== null && stories[activeStoryIndex] && (
             <FullScreenStory 
                stories={stories}
                activeIndex={activeStoryIndex}
                onClose={() => setActiveStoryIndex(null)}
                onPrev={() => { if (activeStoryIndex > 0) setActiveStoryIndex(activeStoryIndex - 1); }}
                onNext={() => { if (activeStoryIndex < stories.length - 1) setActiveStoryIndex(activeStoryIndex + 1); else setActiveStoryIndex(null); }}
             />
         )}
      </AnimatePresence>
      <CustomSectionEmbed location="home_bottom" />
    </div>
  );
};

export default Home;
