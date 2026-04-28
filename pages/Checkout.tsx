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
    <div className="max-w-4xl mx-auto px-6 py-10 pb-24 bg-zinc-50 dark:bg-zinc-800 min-h-screen font-inter animate-fade-in relative">
      <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-6">
            <button onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-[#06331e] hover:text-white transition-all active:scale-95 group">
               <Icon name="arrow-left" className="text-xs group-hover:-translate-x-1 transition-transform" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Checkout</h1>
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Step {step} of {paymentType === 'cod' ? '2' : '4'}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="hidden sm:flex items-center space-x-2">
             {[1, 2, 3, 4].map(s => (
               <div key={s} className={`w-8 h-1.5 rounded-full ${s <= step ? 'bg-[#06331e]' : 'bg-zinc-100 dark:bg-zinc-800'} transition-colors duration-500`}></div>
             ))}
          </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
             <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-6 bg-emerald-50 inline-block px-3 py-1 rounded-full border border-emerald-100">Delivery Address</h2>
                
                {savedAddresses.length > 0 && !isAddingNewAddress && (
                   <div className="space-y-4 mb-6">
                      {savedAddresses.map(addr => (
                         <div 
                           key={addr.id} 
                           onClick={() => setSelectedAddressId(addr.id)}
                           className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start space-x-4 ${selectedAddressId === addr.id ? 'border-[#06331e] bg-emerald-50/30' : 'border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300'}`}
                         >
                            <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedAddressId === addr.id ? 'border-[#06331e]' : 'border-zinc-300'}`}>
                               {selectedAddressId === addr.id && <div className="w-2.5 h-2.5 bg-[#06331e] rounded-full"></div>}
                            </div>
                            <div>
                               <p className="font-bold text-sm tracking-tight">{addr.name}</p>
                               <p className="text-xs text-zinc-500 font-medium mt-1">{addr.phone} {addr.altPhone && `• ${addr.altPhone}`}</p>
                               <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed bg-zinc-50 dark:bg-zinc-800 p-2 rounded-lg border border-zinc-100 dark:border-zinc-800">{addr.address}</p>
                            </div>
                         </div>
                      ))}
                      <button onClick={() => setIsAddingNewAddress(true)} className="w-full py-4 border-2 border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-[10px] font-bold text-zinc-500 uppercase tracking-widest hover:bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300 transition-colors">
                         + Add New Address
                      </button>
                   </div>
                )}

                {isAddingNewAddress && (
                   <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 space-y-5 animate-fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-700 dark:text-zinc-300">New Address</h3>
                        {savedAddresses.length > 0 && (
                          <button onClick={() => setIsAddingNewAddress(false)} className="text-[10px] font-bold text-zinc-400 hover:text-red-500 uppercase">Cancel</button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                         <Input label="Name" placeholder="Full name" value={newAddress.name} onChange={(v: string) => setNewAddress({...newAddress, name: v})} />
                         <Input label="Phone (Required)" placeholder="01XXXXXXXXX" value={newAddress.phone} onChange={(v: string) => setNewAddress({...newAddress, phone: v})} />
                         <Input label="Alt Phone (Optional)" placeholder="Alternative number" value={newAddress.altPhone} onChange={(v: string) => setNewAddress({...newAddress, altPhone: v})} />
                      </div>
                      <div>
                         <label className="text-[9px] font-bold text-zinc-400 uppercase mb-3 block tracking-widest px-1">Detailed Address (House, Road, Area)</label>
                         <textarea placeholder="Full address..." className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl text-sm font-medium h-24 outline-none border border-zinc-200 dark:border-zinc-700 focus:border-[#06331e] transition-all" value={newAddress.address} onChange={e => setNewAddress({...newAddress, address: e.target.value})} />
                      </div>
                      <button onClick={handleSaveAddress} className="w-full py-3.5 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-sm">Save Address to Account</button>
                   </div>
                )}
             </div>

             <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-700 relative overflow-hidden">
                 <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 dark:text-zinc-400 mb-6 flex items-center"><Icon name="percent" className="mr-2" />Promo / Coupon</h2>
                 {appliedCoupon ? (
                    <div className="flex items-center justify-between p-4 bg-emerald-100 rounded-xl border border-emerald-200">
                       <span className="font-bold text-emerald-800 text-sm">{appliedCoupon.code} <span className="opacity-50 text-xs ml-2">Applied</span></span>
                       <button onClick={() => {setAppliedCoupon(null); setCouponCode('');}} className="text-red-500 text-sm group"><Icon name="times" className="group-hover:rotate-90 transition-transform" /></button>
                    </div>
                 ) : (
                    <div className="flex w-full space-x-2">
                       <input type="text" value={couponCode} onChange={e=>setCouponCode(e.target.value)} placeholder="ENTER PROMO CODE" className="flex-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl uppercase text-xs font-bold outline-none focus:border-[#06331e]" />
                       <button onClick={applyCoupon} className="px-6 bg-zinc-900 dark:bg-zinc-50 dark:text-black text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all whitespace-nowrap">Apply</button>
                    </div>
                 )}
                 {couponError && <p className="text-red-500 text-[10px] mt-2 font-bold uppercase pl-1">{couponError}</p>}
             </div>

             <div className="bg-pink-50 p-6 rounded-3xl border border-pink-200 relative overflow-hidden transition-all">
                 <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsGift(!isGift)}>
                   <h2 className="text-[10px] font-bold uppercase tracking-widest text-pink-700 flex items-center"><Icon name="gift" className="mr-2 text-lg" />Send as a Gift</h2>
                   <div className={`w-12 h-6 rounded-full p-1 transition-colors ${isGift ? 'bg-pink-500' : 'bg-pink-200'}`}>
                      <div className={`w-4 h-4 bg-zinc-50 dark:bg-zinc-800 rounded-full shadow-sm transition-transform ${isGift ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </div>
                 </div>
                 {isGift && (
                     <div className="mt-5 animate-fade-in space-y-4">
                        <p className="text-pink-800 text-xs font-semibold leading-relaxed">Invoice will hide product price. <span className="underline font-bold text-pink-900">COD disabled for gifts.</span></p>
                        <div>
                          <label className="text-[9px] font-bold text-pink-600 uppercase mb-2 block tracking-widest">Custom Note Card (Optional)</label>
                          <textarea value={giftNote} onChange={e => setGiftNote(e.target.value)} placeholder="Type a lovely note for the recipient..." className="w-full bg-zinc-50 dark:bg-zinc-800 px-4 py-3 rounded-xl border border-pink-200 outline-none text-sm focus:border-pink-500 h-20 transition-colors" />
                        </div>
                     </div>
                 )}
             </div>

             <button onClick={handleNextStep1} disabled={!selectedAddressId && !isAddingNewAddress} className="w-full py-5 bg-[#06331e] text-white rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95">Continue to Payment</button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
             <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-10 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">Select Payment Mode</h2>
                <div className="flex flex-col md:flex-row gap-6 justify-center">
                   {!isGift && (
                   <button 
                     onClick={() => setPaymentType('cod')}
                     className={`flex-1 p-8 rounded-[2rem] border-2 transition-all group ${paymentType === 'cod' ? 'border-[#06331e] bg-[#06331e] text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300'}`}
                   >
                      <Icon name="truck" className={`text-4xl mb-4 ${paymentType === 'cod' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400'}`} />
                      <h3 className="text-xl font-black tracking-tight mb-2">Cash on Delivery</h3>
                      <p className={`text-xs font-medium px-4 leading-relaxed ${paymentType === 'cod' ? 'text-zinc-300' : 'text-zinc-500'}`}>Pay directly to the courier when you receive your package.</p>
                   </button>
                   )}

                   <button 
                     onClick={() => setPaymentType('advance')}
                     className={`flex-1 p-8 rounded-[2rem] border-2 transition-all group ${paymentType === 'advance' ? 'border-[#06331e] bg-[#06331e] text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300'}`}
                   >
                      <Icon name="credit-card-front" className={`text-4xl mb-4 ${paymentType === 'advance' ? 'text-emerald-400' : 'text-zinc-400 group-hover:text-zinc-600 dark:text-zinc-400'}`} />
                      <h3 className="text-xl font-black tracking-tight mb-2">Advance Payment</h3>
                      <p className={`text-xs font-medium px-4 leading-relaxed ${paymentType === 'advance' ? 'text-zinc-300' : 'text-zinc-500'}`}>Securely pay beforehand via bKash or Nagad.</p>
                   </button>
                </div>
             </div>
             <button onClick={handleNextStep2} className="w-full py-5 bg-[#06331e] text-white rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 disabled:opacity-50 flex items-center justify-center">
               {loading ? <Icon name="spinner-third" className="animate-spin text-lg" /> : <>{paymentType === 'cod' ? 'Confirm Order (COD)' : 'Next Step'} <Icon name="arrow-right" className="ml-2" /></>}
             </button>
          </motion.div>
        )}

        {step === 3 && paymentType === 'advance' && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
             <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-[2rem] border border-zinc-200 dark:border-zinc-700 shadow-sm text-center">
                <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#06331e] mb-10 bg-emerald-50 inline-block px-4 py-1.5 rounded-full border border-emerald-100">Advance Options</h2>
                <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
                   <button 
                     onClick={() => setAdvanceType('delivery')}
                     className={`flex-1 px-6 py-4 rounded-full border-2 transition-all flex items-center justify-between group ${advanceType === 'delivery' ? 'border-[#06331e] bg-[#06331e] text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300'}`}
                   >
                      <div className="text-left">
                         <p className={`font-black text-xs uppercase tracking-widest mb-0.5 ${advanceType === 'delivery' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Delivery Fee</p>
                         <p className={`text-[9px] font-bold tracking-wide ${advanceType === 'delivery' ? 'text-emerald-300' : 'text-zinc-400'}`}>Advance delivery charge</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full border ${advanceType === 'delivery' ? 'bg-white/10 border-white/20' : 'bg-emerald-50 dark:bg-zinc-800 border-emerald-100 dark:border-zinc-700'}`}>
                         <span className={`font-black text-sm tracking-tight ${advanceType === 'delivery' ? 'text-white' : 'text-[#06331e] dark:text-emerald-400'}`}>৳{deliveryFee}</span>
                      </div>
                   </button>

                   <button 
                     onClick={() => setAdvanceType('full')}
                     className={`flex-1 px-6 py-4 rounded-full border-2 transition-all flex items-center justify-between group ${advanceType === 'full' ? 'border-[#06331e] bg-[#06331e] text-white shadow-xl shadow-emerald-900/20' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:border-zinc-300'}`}
                   >
                      <div className="text-left">
                         <p className={`font-black text-xs uppercase tracking-widest mb-0.5 ${advanceType === 'full' ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>Full Payment</p>
                         <p className={`text-[9px] font-bold tracking-wide ${advanceType === 'full' ? 'text-emerald-300' : 'text-zinc-400'}`}>Pay total securely</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full border ${advanceType === 'full' ? 'bg-white/10 border-white/20' : 'bg-emerald-50 dark:bg-zinc-800 border-emerald-100 dark:border-zinc-700'}`}>
                         <span className={`font-black text-sm tracking-tight ${advanceType === 'full' ? 'text-white' : 'text-[#06331e] dark:text-emerald-400'}`}>৳{totalAmount}</span>
                      </div>
                   </button>
                </div>
             </div>
             <button onClick={handleNextStep3} className="w-full py-5 bg-[#06331e] text-white rounded-full font-bold text-[11px] uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center">
               Continue <Icon name="arrow-right" className="ml-2" />
             </button>
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
