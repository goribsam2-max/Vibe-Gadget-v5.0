import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, addDoc, doc, getDoc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { useNotify } from '../components/Notifications';
import { OrderStatus, UserProfile } from '../types';
import { sendOrderToTelegram } from '../services/telegram';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../components/Icon';
import { CustomSectionEmbed } from '../components/CustomSectionEmbed';
import { useTheme } from '../components/ThemeContext';

interface Address {
  id: string;
  name: string;
  phone: string;
  altPhone?: string;
  address: string;
}

const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userIp, setUserIp] = useState<string>('');
  const [settings, setSettings] = useState<any>(null);

  // Step 1: Addresses
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({ name: '', phone: '', altPhone: '', address: '' });

  // Step 2 & 3: Payment Type
  const [paymentType, setPaymentType] = useState<'cod' | 'advance' | null>(null);
  const [advanceType, setAdvanceType] = useState<'full' | 'delivery' | null>(null);

  // Step 4: Mobile Banking
  const [bankingMethod, setBankingMethod] = useState<'bkash' | 'nagad' | null>(null);
  const [bankingAccountName, setBankingAccountName] = useState('');
  const [bankingTrxId, setBankingTrxId] = useState('');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');

  const [isGift, setIsGift] = useState(false);
  const [giftNote, setGiftNote] = useState('');
  const [affiliateRef, setAffiliateRef] = useState<string | null>(null);

  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark, toggleTheme } = useTheme();

  const getWalletNumber = () => {
    if (bankingMethod === 'bkash') return settings?.bkashNumber || "01778953114";
    if (bankingMethod === 'nagad') return settings?.nagadNumber || "01778953114";
    return "01778953114";
  };

  useEffect(() => {
    const ref = localStorage.getItem('affiliateRef');
    if (ref && !appliedCoupon) {
      setAppliedCoupon({ id: 'affiliate', type: 'percent', discount: 5, code: 'REF-LINK' });
    }
    if (ref) {
       setAffiliateRef(ref);
       setCouponCode(ref);
    }

    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setUserIp(data.ip))
      .catch(() => setUserIp('Unavailable'));

    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });

    const cart = JSON.parse(localStorage.getItem('f_cart') || '[]');
    if (cart.length === 0) { navigate('/'); return; }
    setItems(cart);

    if (auth.currentUser) {
      getDoc(doc(db, 'users', auth.currentUser.uid)).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id);
          } else {
             // fallback from old format
             if (data.displayName && data.phoneNumber) {
                setNewAddress(prev => ({ ...prev, name: data.displayName, phone: data.phoneNumber! }));
             }
             setIsAddingNewAddress(true);
          }
        }
      });
    } else {
      setIsAddingNewAddress(true); // guest
    }

    return () => unsubSettings();
  }, [navigate]);

  const subTotal = items.reduce((a,c)=>a+(c.price*c.quantity), 0);
  const deliveryFee = settings?.deliveryCharge || 120;
  
  let discountAmount = 0;
  if(appliedCoupon) {
      if(appliedCoupon.type === 'percent') discountAmount = Math.round(subTotal * (appliedCoupon.discount / 100));
      else discountAmount = appliedCoupon.discount;
  }
  
  const totalAmount = subTotal + deliveryFee - discountAmount;

  const handleSaveAddress = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.address) {
       return notify("Please complete all required fields.", "error");
    }
    const newAddrObj: Address = {
       id: Math.random().toString(36).substring(7),
       ...newAddress
    };
    
    if (auth.currentUser) {
       try {
         await updateDoc(doc(db, 'users', auth.currentUser.uid), {
           addresses: arrayUnion(newAddrObj)
         });
         setSavedAddresses([...savedAddresses, newAddrObj]);
         setSelectedAddressId(newAddrObj.id);
         setIsAddingNewAddress(false);
         notify("Address saved securely.", "success");
       } catch (e) { notify("Error saving address.", "error"); }
    } else {
       setSavedAddresses([newAddrObj]);
       setSelectedAddressId(newAddrObj.id);
       setIsAddingNewAddress(false);
    }
  };

  const applyCoupon = async () => {
     setCouponError('');
     if(!couponCode.trim()) return;
     setLoading(true);
     try {
       const { query, where, getDocs, collection } = await import('firebase/firestore');
       
       // Try Affiliate code first
       const affQ = query(collection(db, 'users'), where('affiliateCode', '==', couponCode.trim()));
       const affSnap = await getDocs(affQ);
       if (!affSnap.empty) {
          const userDoc = affSnap.docs[0];
          if (userDoc.id !== auth.currentUser?.uid) {
             setAppliedCoupon({ id: 'affiliate', type: 'percent', discount: 5, code: couponCode.trim() });
             setAffiliateRef(userDoc.id);
             localStorage.setItem('affiliateRef', userDoc.id);
             notify("Affiliate applied! 5% discount.", "success");
             setCouponError('');
             setLoading(false);
             return;
          } else {
             setCouponError("You cannot use your own affiliate code");
             setLoading(false);
             return;
          }
       }

       const q = query(collection(db, 'coupons'), where('code', '==', couponCode.trim().toUpperCase()));
       const snap = await getDocs(q);
       if(snap.empty) setCouponError('Invalid coupon');
       else {
          const c = snap.docs[0].data();
          if(!c.isActive) setCouponError('Coupon inactive');
          else if (c.usedCount >= c.maxUses) setCouponError('Limit reached');
          else if (c.usedIPs && c.usedIPs.includes(userIp)) setCouponError('Code already used from this IP');
          else { setAppliedCoupon({ id: snap.docs[0].id, ...c }); notify("Coupon applied!", "success"); setCouponError(''); }
       }
     } catch (e) { setCouponError('Error verifying coupon'); }
     setLoading(false);
  };

  const placeOrder = async () => {
    const activeAddress = savedAddresses.find(a => a.id === selectedAddressId);
    if (!activeAddress) return notify("Address required", "error");
    
    setLoading(true);
    try {
      let paymentStr = "Cash on Delivery";
      let paymentOptStr = "N/A";
      let trxStr = "";

      if (paymentType === 'advance') {
         paymentStr = bankingMethod === 'bkash' ? 'bKash Mobile Banking' : 'Nagad Mobile Banking';
         paymentOptStr = advanceType === 'full' ? 'Full Payment' : 'Delivery Fee Advanced';
         trxStr = bankingTrxId.trim();
      }

      const orderData = {
        userId: auth.currentUser?.uid || 'guest',
        customerName: activeAddress.name,
        items: items.map(i => ({ productId: i.id, quantity: i.quantity, priceAtPurchase: i.price, name: i.name, image: i.image })),
        total: totalAmount,
        subTotal: subTotal,
        discount: discountAmount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        status: OrderStatus.PENDING,
        paymentMethod: paymentStr,
        paymentOption: paymentOptStr,
        accountNameSender: bankingAccountName.trim(), // Added for sender name log
        transactionId: trxStr,
        shippingAddress: activeAddress.address,
        contactNumber: activeAddress.phone,
        altNumber: activeAddress.altPhone || '',
        ipAddress: userIp,
        createdAt: Date.now(),
        isSuspicious: false,
        riskReason: '',
        isGift: isGift,
        giftNote: isGift ? giftNote : null,
        affiliateRef: affiliateRef || null
      };
      
      const docRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Pay affiliate if applicable
      if (orderData.affiliateRef) {
         try {
            const { increment } = await import('firebase/firestore');
            const affRef = doc(db, 'users', orderData.affiliateRef);
            await updateDoc(affRef, {
               walletBalance: increment(50)
            });
            await addDoc(collection(db, 'affiliates_log'), {
               affiliateId: orderData.affiliateRef,
               orderId: docRef.id,
               customerName: activeAddress.name,
               commission: 50,
               createdAt: Date.now()
            });
         } catch (e) {
            console.error("Error paying affiliate:", e);
         }
      }

      if (appliedCoupon && appliedCoupon.id !== 'affiliate' && appliedCoupon.id !== 'affiliate_link') {
         try {
            const { increment, arrayUnion } = await import('firebase/firestore');
            await updateDoc(doc(db, 'coupons', appliedCoupon.id), { 
               usedCount: increment(1),
               usedIPs: arrayUnion(userIp)
            });
         } catch(e) {}
      }
      await sendOrderToTelegram({ ...orderData, id: docRef.id });
      if (typeof (window as any).fbq === 'function') {
          (window as any).fbq('track', 'Purchase', { value: totalAmount, currency: 'BDT', content_ids: items.map(i => i.id), content_type: 'product', num_items: items.length });
      }
      
      localStorage.removeItem('f_cart');
      notify("Order Placed Successfully!", "success");
      navigate(`/success?orderId=${docRef.id}`);
    } catch (err: any) { 
        notify("Order failed! Please try again or contact support.", "error"); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleNextStep1 = () => {
      if (!selectedAddressId) return notify("Please select or add an address.", "error");
      if (isGift) setPaymentType('advance');
      setStep(2);
  };

  const handleNextStep2 = () => {
      if (!paymentType) return notify("Please select a payment mode.", "error");
      if (paymentType === 'cod') placeOrder();
      else setStep(3);
  };

  const handleNextStep3 = () => {
      if (!advanceType) return notify("Please select advance payment option.", "error");
      setStep(4);
  };

  const handleNextStep4 = () => {
      if (!bankingMethod) return notify("Please select bKash or Nagad.", "error");
      if (!bankingAccountName.trim()) return notify("Please enter the sender's account name.", "error");
      if (!bankingTrxId.trim() || bankingTrxId.length < 5) return notify("Please enter a valid TrxID.", "error");
      placeOrder();
  };

  if (settings && !settings.storeOpen) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 p-6">
              <div className="text-center bg-zinc-50 dark:bg-zinc-800 p-10 rounded-3xl max-w-md border border-zinc-100 dark:border-zinc-800">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl"><Icon name="store-slash" /></div>
                  <h2 className="text-xl font-black tracking-tight mb-2">Store is Currently Closed</h2>
                  <button onClick={() => navigate('/')} className="px-8 py-3 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest mt-6">Return Home</button>
              </div>
          </div>
      );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 pb-24 bg-zinc-50 dark:bg-zinc-800 min-h-screen font-inter animate-fade-in relative z-10 transition-colors">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-[#06331e] hover:text-white transition-all active:scale-95 group">
               <Icon name="arrow-left" className="text-xs group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
               <h1 className="text-2xl md:text-xl lg:text-base xl:text-sm font-black tracking-tighter uppercase text-shine">Checkout.</h1>
               <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-[0.4em] mt-1 pl-1">Secure Drop</p>
            </div>
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

      {/* Progress bar */}
      <div className="hidden sm:flex items-center justify-center space-x-2 mb-10">
         {[1, 2, 3, 4].map(s => (
            <div key={s} className={`w-12 h-1.5 rounded-full ${s <= step ? 'bg-[#06331e] dark:bg-emerald-500 shadow-sm shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-800'} transition-all duration-500`}></div>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, scale: 0.98, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98, y: -10 }} className="space-y-6 md:space-y-8">
             <div className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-700/50 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex items-center space-x-3 mb-8 relative z-10">
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                     <Icon name="map-marker-alt" className="text-lg" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">Delivery Address</h2>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Where should we secure your drop?</p>
                  </div>
                </div>
                
                {savedAddresses.length > 0 && !isAddingNewAddress && (
                   <div className="space-y-4 mb-6 relative z-10">
                      {savedAddresses.map(addr => (
                         <div 
                           key={addr.id} 
                           onClick={() => setSelectedAddressId(addr.id)}
                           className={`p-6 rounded-[2rem] border-2 cursor-pointer transition-all flex items-start space-x-5 group ${selectedAddressId === addr.id ? 'border-[#06331e] dark:border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-md' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600'}`}
                         >
                            <div className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${selectedAddressId === addr.id ? 'border-[#06331e] dark:border-emerald-500' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400 dark:group-hover:border-zinc-500'}`}>
                               {selectedAddressId === addr.id && <motion.div layoutId="addr-select" className="w-3 h-3 bg-[#06331e] dark:bg-emerald-500 rounded-full"></motion.div>}
                            </div>
                            <div className="flex-1">
                               <div className="flex items-center justify-between mb-1.5">
                                 <p className="font-black text-base text-zinc-900 dark:text-zinc-100 tracking-tight">{addr.name}</p>
                                 {selectedAddressId === addr.id && <span className="bg-[#06331e] text-emerald-300 dark:bg-emerald-500/20 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full">Selected</span>}
                               </div>
                               <p className="text-xs text-zinc-500 font-semibold mb-3 flex items-center gap-2">
                                  <Icon name="phone" className="text-[10px]" />
                                  <span>{addr.phone} {addr.altPhone && `• ${addr.altPhone}`}</span>
                               </p>
                               <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed bg-white dark:bg-zinc-900 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">{addr.address}</p>
                            </div>
                         </div>
                      ))}
                      <button onClick={() => setIsAddingNewAddress(true)} className="w-full py-5 border-2 border-dashed border-zinc-200 dark:border-zinc-700/50 rounded-[2rem] text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:border-[#06331e] transition-all flex items-center justify-center gap-2 group">
                         <Icon name="plus" className="group-hover:rotate-90 transition-transform" />
                         <span>Add New Address</span>
                      </button>
                   </div>
                )}

                {isAddingNewAddress && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-100 dark:border-zinc-700 shadow-inner space-y-6 relative z-10">
                      <div className="flex justify-between items-center bg-white dark:bg-zinc-900 px-5 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-[#06331e] dark:text-emerald-400 flex items-center gap-2"><Icon name="layer-plus" /> New Address</h3>
                        {savedAddresses.length > 0 && (
                          <button onClick={() => setIsAddingNewAddress(false)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Icon name="times" className="text-xs" />
                          </button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Full Name</label><Input placeholder="E.g. Tanvir Ahmed" value={newAddress.name} onChange={(v: string) => setNewAddress({...newAddress, name: v})} /></div>
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Primary Phone <span className="text-red-400">*</span></label><Input placeholder="01XXXXXXXXX" value={newAddress.phone} onChange={(v: string) => setNewAddress({...newAddress, phone: v})} /></div>
                         <div className="space-y-1.5"><label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Alternate Phone</label><Input placeholder="01XXXXXXXXX (Optional)" value={newAddress.altPhone} onChange={(v: string) => setNewAddress({...newAddress, altPhone: v})} /></div>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pl-2">Detailed Address <span className="text-red-400">*</span></label>
                         <textarea placeholder="House, Road, Block, Sector, Area, Courier Name..." className="w-full bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl text-sm font-medium h-32 outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] dark:focus:border-emerald-500 transition-all shadow-inner resize-none" value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} />
                      </div>
                      <button onClick={handleSaveAddress} className="w-full py-4 bg-[#06331e] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 hover:-translate-y-0.5 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2">
                        <Icon name="save" /> Save Address to Account
                      </button>
                   </motion.div>
                )}
             </div>

             <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-700/50 shadow-xl shadow-zinc-200/20 dark:shadow-none relative overflow-hidden group">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
                 <div className="flex items-center space-x-3 mb-6 relative z-10">
                   <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                      <Icon name="percent" className="text-lg" />
                   </div>
                   <div>
                     <h2 className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">Promo & Discounts</h2>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Apply code for extra savings</p>
                   </div>
                 </div>
                 
                 {appliedCoupon ? (
                    <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="flex items-center justify-between p-5 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 relative z-10 shadow-inner">
                       <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-xl flex items-center justify-center text-emerald-500 shadow-sm"><Icon name="check" /></div>
                         <div>
                           <span className="font-black text-emerald-800 dark:text-emerald-400 block tracking-wider uppercase">{appliedCoupon.code}</span>
                           <span className="text-[9px] text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest mt-0.5 block">Applied Successfully</span>
                         </div>
                       </div>
                       <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="w-10 h-10 bg-white/50 dark:bg-black/20 hover:bg-white text-zinc-500 hover:text-red-500 rounded-xl transition-all shadow-sm flex items-center justify-center"><Icon name="trash" className="text-sm" /></button>
                    </motion.div>
                 ) : (
                    <div className="flex flex-col sm:flex-row w-full gap-3 relative z-10">
                       <div className="flex-1 relative">
                         <Icon name="tag" className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
                         <input type="text" value={couponCode} onChange={e=>setCouponCode(e.target.value.toUpperCase())} placeholder="ENTER PROMO CODE" className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 pl-11 pr-4 py-4 rounded-2xl uppercase text-sm font-black tracking-widest outline-none focus:border-[#06331e] dark:focus:border-emerald-500 transition-colors shadow-inner" />
                       </div>
                       <button onClick={applyCoupon} className="px-8 py-4 bg-[#06331e] text-white font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-zinc-900 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all whitespace-nowrap">Apply Code</button>
                    </div>
                 )}
                 {couponError && <p className="text-red-500 text-[10px] mt-3 font-black uppercase tracking-widest pl-2 flex items-center gap-1.5"><Icon name="exclamation-circle" /> {couponError}</p>}
             </div>

             <div className="bg-gradient-to-br from-pink-50 to-pink-100/50 dark:from-pink-900/10 dark:to-pink-900/5 border border-pink-200 dark:border-pink-900/30 p-6 md:p-8 rounded-[2.5rem] relative overflow-hidden transition-all">
                 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setIsGift(!isGift)}>
                   <div className="flex items-center space-x-3">
                     <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors ${isGift ? 'bg-pink-500 border-pink-400 text-white shadow-lg shadow-pink-500/30' : 'bg-white dark:bg-zinc-900 border-pink-200 text-pink-400'}`}>
                        <Icon name="gift" className="text-lg" />
                     </div>
                     <div>
                       <h2 className="text-sm font-black tracking-tight text-pink-900 dark:text-pink-300">Send as a Gift</h2>
                       <p className="text-[10px] font-bold text-pink-600/70 uppercase tracking-widest">Surprise someone special</p>
                     </div>
                   </div>
                   
                   <div className={`w-14 h-8 rounded-full p-1 transition-all flex items-center shrink-0 ${isGift ? 'bg-pink-500 shadow-inner' : 'bg-pink-200 dark:bg-pink-900/50 shadow-inner'}`}>
                      <div className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform ${isGift ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </div>
                 </div>
                 
                 <AnimatePresence>
                   {isGift && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-6 space-y-4">
                          <div className="flex items-start gap-3 bg-white/60 dark:bg-black/20 p-4 rounded-xl border border-pink-100 dark:border-pink-900/20">
                            <Icon name="info-circle" className="text-pink-500 mt-0.5" />
                            <p className="text-pink-800 dark:text-pink-300 text-xs font-semibold leading-relaxed">The printed invoice will hide all product prices. <br/><span className="underline font-bold text-pink-900 dark:text-pink-200">Cash on Delivery (COD) is strictly disabled for gifted orders.</span></p>
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-pink-700 uppercase mb-2 block tracking-widest pl-1">Custom Note Card <span className="text-pink-400">(Optional)</span></label>
                            <textarea value={giftNote} onChange={e => setGiftNote(e.target.value)} placeholder="E.g. Happy Birthday! Love, Sakib..." className="w-full bg-white dark:bg-zinc-900 px-5 py-4 rounded-2xl border border-pink-200 dark:border-zinc-800 outline-none text-sm font-medium focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 h-28 transition-all shadow-inner resize-none placeholder:text-zinc-400" />
                          </div>
                       </motion.div>
                   )}
                 </AnimatePresence>
             </div>

             <div className="pt-2">
                <button onClick={handleNextStep1} disabled={!selectedAddressId && !isAddingNewAddress} className="w-full py-5 bg-[#06331e] text-emerald-300 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-zinc-900 hover:-translate-y-1 transition-all shadow-2xl shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none group">
                  <span>Continue to Payment</span>
                  <Icon name="arrow-right" className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, scale: 0.98, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: -20 }} className="space-y-6 md:space-y-8">
             <div className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-700/50 shadow-xl shadow-zinc-200/20 dark:shadow-none text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col items-center mb-8 relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 mb-4 shadow-sm">
                     <Icon name="credit-card" className="text-xl" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Payment Method</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">How would you like to pay?</p>
                </div>

                <div className="flex flex-col md:flex-row gap-4 justify-center relative z-10">
                   {!isGift && (
                   <button 
                     onClick={() => setPaymentType('cod')}
                     className={`flex-1 p-6 md:p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 ${paymentType === 'cod' ? 'border-[#06331e] bg-[#06331e] dark:border-emerald-500 dark:bg-emerald-900/10 shadow-xl shadow-emerald-900/20' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                   >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${paymentType === 'cod' ? 'border-emerald-300 bg-white/10 text-emerald-300 dark:border-emerald-500 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                        <Icon name="truck" className="text-2xl" />
                      </div>
                      <div>
                        <h3 className={`text-base font-black tracking-tight mb-1 ${paymentType === 'cod' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Cash on Delivery</h3>
                        <p className={`text-[10px] font-bold tracking-wide uppercase px-2 ${paymentType === 'cod' ? 'text-emerald-200 flex items-center justify-center gap-1' : 'text-zinc-400'}`}>{paymentType === 'cod' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>} Pay upon receipt</p>
                      </div>
                   </button>
                   )}

                   <button 
                     onClick={() => setPaymentType('advance')}
                     className={`flex-1 p-6 md:p-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-4 ${paymentType === 'advance' ? 'border-[#06331e] bg-[#06331e] dark:border-emerald-500 dark:bg-emerald-900/10 shadow-xl shadow-emerald-900/20' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                   >
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 transition-colors ${paymentType === 'advance' ? 'border-emerald-300 bg-white/10 text-emerald-300 dark:border-emerald-500 dark:text-emerald-400' : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-400'}`}>
                        <Icon name="credit-card-front" className="text-2xl" />
                      </div>
                      <div>
                        <h3 className={`text-base font-black tracking-tight mb-1 ${paymentType === 'advance' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Mobile Banking</h3>
                        <p className={`text-[10px] font-bold tracking-wide uppercase px-2 ${paymentType === 'advance' ? 'text-emerald-200 flex items-center justify-center gap-1' : 'text-zinc-400'}`}>{paymentType === 'advance' && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>} bKash / Nagad</p>
                      </div>
                   </button>
                </div>
             </div>
             
             <div className="pt-2">
               <button onClick={handleNextStep2} disabled={loading} className="w-full py-5 bg-[#06331e] text-emerald-300 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-zinc-900 hover:-translate-y-1 transition-all shadow-2xl shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:translate-y-0 disabled:shadow-none group">
                 {loading ? <Icon name="spinner-third" className="animate-spin text-lg text-emerald-400" /> : (
                   <>
                     <span>{paymentType === 'cod' ? 'Confirm Order' : 'Continue to Payment'}</span>
                     <Icon name={paymentType === 'cod' ? 'check' : 'arrow-right'} className={`transition-transform ${paymentType === 'cod' ? 'scale-110 drop-shadow-md text-emerald-400' : 'group-hover:translate-x-1'}`} />
                   </>
                 )}
               </button>
             </div>
          </motion.div>
        )}

        {step === 3 && paymentType === 'advance' && (
          <motion.div key="step3" initial={{ opacity: 0, scale: 0.98, x: 20 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.98, x: -20 }} className="space-y-6 md:space-y-8">
             <div className="bg-white dark:bg-zinc-900 p-6 md:p-10 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-700/50 shadow-xl shadow-zinc-200/20 dark:shadow-none text-center relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                
                <div className="flex flex-col items-center mb-10 relative z-10">
                  <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/10 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 mb-4 shadow-sm">
                     <Icon name="coins" className="text-xl" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">Advance Amount</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Select your payment type</p>
                </div>

                <div className="flex flex-col gap-4 max-w-lg mx-auto relative z-10">
                   <button 
                     onClick={() => setAdvanceType('delivery')}
                     className={`w-full p-4 md:p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${advanceType === 'delivery' ? 'border-[#06331e] bg-[#06331e] dark:border-emerald-500 dark:bg-emerald-900/10 text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                   >
                      <div className="flex items-center gap-4 text-left">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${advanceType === 'delivery' ? 'border-emerald-300' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400'}`}>
                            {advanceType === 'delivery' && <div className="w-3 h-3 bg-emerald-300 rounded-full"></div>}
                         </div>
                         <div>
                            <p className={`font-black text-xs mb-0.5 tracking-tight ${advanceType === 'delivery' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Delivery Fee Only</p>
                            <p className={`text-[8px] font-bold uppercase tracking-widest ${advanceType === 'delivery' ? 'text-emerald-300/80' : 'text-zinc-500'}`}>Pay delivery now, rest on arrival</p>
                         </div>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-1 ${advanceType === 'delivery' ? 'bg-white/10 border-white/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm'}`}>
                         <span className={`text-[10px] uppercase font-bold tracking-wider ${advanceType === 'delivery' ? 'text-emerald-200' : 'text-zinc-400'}`}>bdt</span>
                         <span className={`font-black tracking-tight ${advanceType === 'delivery' ? 'text-white text-lg' : 'text-emerald-600 dark:text-emerald-400 text-base'}`}>{deliveryFee}</span>
                      </div>
                   </button>

                   <button 
                     onClick={() => setAdvanceType('full')}
                     className={`w-full p-4 md:p-5 rounded-3xl border-2 transition-all flex items-center justify-between group ${advanceType === 'full' ? 'border-[#06331e] bg-[#06331e] dark:border-emerald-500 dark:bg-emerald-900/10 text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'}`}
                   >
                      <div className="flex items-center gap-4 text-left">
                         <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${advanceType === 'full' ? 'border-emerald-300' : 'border-zinc-300 dark:border-zinc-600 group-hover:border-zinc-400'}`}>
                            {advanceType === 'full' && <div className="w-3 h-3 bg-emerald-300 rounded-full"></div>}
                         </div>
                         <div>
                            <p className={`font-black text-[11px] mb-0.5 tracking-tight flex items-center gap-2 ${advanceType === 'full' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Full Payment <span className={`text-[6.5px] uppercase tracking-[0.1em] px-2 py-0.5 rounded-full border leading-tight ${advanceType === 'full' ? 'border-emerald-300/30 bg-emerald-500/20 text-emerald-100' : 'border-zinc-200 bg-white text-emerald-600 dark:border-zinc-700 dark:bg-zinc-900'}`}>Recommended</span></p>
                            <p className={`text-[8.5px] font-bold uppercase tracking-widest ${advanceType === 'full' ? 'text-emerald-300/80' : 'text-zinc-500'}`}>Secure entire order</p>
                         </div>
                      </div>
                      <div className={`px-4 py-2.5 rounded-2xl border flex items-center gap-1 ${advanceType === 'full' ? 'bg-white/10 border-white/20' : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 shadow-sm'}`}>
                         <span className={`text-[10px] uppercase font-bold tracking-wider ${advanceType === 'full' ? 'text-emerald-200' : 'text-zinc-400'}`}>bdt</span>
                         <span className={`font-black tracking-tight ${advanceType === 'full' ? 'text-white text-lg' : 'text-emerald-600 dark:text-emerald-400 text-base'}`}>{totalAmount}</span>
                      </div>
                   </button>
                </div>
             </div>
             
             <div className="pt-2">
               <button onClick={handleNextStep3} className="w-full py-5 bg-[#06331e] text-emerald-300 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-zinc-900 hover:-translate-y-1 transition-all shadow-2xl shadow-emerald-900/30 active:scale-95 flex items-center justify-center gap-3">
                 <span>Continue to MFS</span>
                 <Icon name="arrow-right" className="group-hover:translate-x-1 transition-transform" />
               </button>
             </div>
          </motion.div>
        )}

        {step === 4 && paymentType === 'advance' && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
             <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-8 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">Make Payment</h2>
                
                <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
                   <button onClick={() => setBankingMethod('bkash')} className={`flex-1 px-6 py-4 rounded-full border-2 transition-all font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 ${bankingMethod === 'bkash' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-md shadow-pink-500/10' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-pink-300'}`}>
                      <img src={settings?.bkashIcon || "https://i.ibb.co.com/8m5LntYV/b-Kash-app-logo.png"} alt="bKash" className="w-5 h-5 object-contain" />
                      bKash
                   </button>
                   <button onClick={() => setBankingMethod('nagad')} className={`flex-1 px-6 py-4 rounded-full border-2 transition-all font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 ${bankingMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md shadow-orange-500/10' : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:border-orange-300'}`}>
                      <img src={settings?.nagadIcon || "https://i.ibb.co.com/RkG7cbs0/Nagad-Logo-wine.png"} alt="Nagad" className="w-5 h-5 object-contain" />
                      Nagad
                   </button>
                </div>

                {bankingMethod && (
                   <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 text-left space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm gap-4">
                         <div className="flex-1">
                            <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1 flex items-center"><Icon name="mobile" className="mr-1.5" /> {bankingMethod} Personal Number</p>
                            <p className="font-black text-xl md:text-2xl tracking-[0.1em] md:tracking-[0.2em] text-[#06331e] dark:text-emerald-400">{getWalletNumber()}</p>
                         </div>
                         <button onClick={() => { navigator.clipboard.writeText(getWalletNumber()); notify("Number copied!", "success"); }} className="w-full sm:w-auto px-5 py-3 shrink-0 flex items-center justify-center gap-2 bg-[#06331e] text-white rounded-xl hover:bg-emerald-900 active:scale-95 transition-all font-bold text-[10px] uppercase tracking-widest shadow-md">
                           <Icon name="copy" /> Copy
                         </button>
                      </div>

                      <div className="flex items-start p-4 bg-yellow-50 text-yellow-800 rounded-xl border border-yellow-200 text-xs font-bold leading-relaxed">
                         <Icon name="exclamation-triangle" className="text-lg mr-3 mt-0.5 basis-auto shrink-0" />
                         <p>Please open your {bankingMethod === 'bkash' ? 'bKash' : 'Nagad'} app and "Send Money" exactly ৳{advanceType === 'full' ? totalAmount : deliveryFee} to the number above. Then enter the sender name and TrxID below to verify your payment.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <Input label="Account Name (Sender)" placeholder="Name attached to wallet" value={bankingAccountName} onChange={setBankingAccountName} />
                         <Input label="Transaction ID (TrxID)" placeholder="e.g. 9BKS1P3..." value={bankingTrxId} onChange={setBankingTrxId} />
                      </div>
                   </motion.div>
                )}
             </div>
             
             <button disabled={loading || !bankingMethod} onClick={handleNextStep4} className="w-full py-5 bg-[#06331e] text-white rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center">
               {loading ? <Icon name="spinner-third" className="animate-spin text-lg" /> : <>Verify & Complete Order <Icon name="check-circle" className="ml-2" /></>}
             </button>
          </motion.div>
        )}
      </AnimatePresence>
      <CustomSectionEmbed location="checkout_bottom" />
    </div>
  );
};

const Input = ({ label, value, onChange, placeholder }: any) => (
  <div className="w-full text-left">
    <label className="text-[9px] font-bold uppercase mb-2 block px-1 tracking-widest text-zinc-500">{label}</label>
    <input type="text" placeholder={placeholder} className="w-full bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl text-sm font-medium outline-none border transition-all shadow-sm border-zinc-200 dark:border-zinc-700 focus:border-black focus:ring-4 focus:ring-black/5" value={value || ""} onChange={e => onChange(e.target.value)} />
  </div>
);

export default CheckoutPage;
