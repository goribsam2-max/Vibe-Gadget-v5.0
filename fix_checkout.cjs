const fs = require('fs');

let content = fs.readFileSync('pages/Checkout.tsx', 'utf8');

// Modifying the useEffect to automatically apply affiliate discount
content = content.replace(
  "    const ref = localStorage.getItem('affiliateRef');",
  "    const ref = localStorage.getItem('affiliateRef');\n    if (ref && !appliedCoupon) {\n      setAppliedCoupon({ id: 'affiliate', type: 'percent', discount: 5, code: 'REF-LINK' });\n    }"
);

// Modifying applyCoupon function
let applyCouponNew = `
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
`;

content = content.replace(
  /const applyCoupon = async \(\) => {[\s\S]*?setLoading\(false\);\n  };/,
  applyCouponNew.trim()
);

// Prevent crashing if appliedCoupon is affiliate
content = content.replace(
  "if (appliedCoupon) {",
  "if (appliedCoupon && appliedCoupon.id !== 'affiliate' && appliedCoupon.id !== 'affiliate_link') {"
);

fs.writeFileSync('pages/Checkout.tsx', content);
console.log("Done");
