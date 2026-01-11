"use client";
import { useState, useEffect } from "react";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import { Trash2, Upload, CheckCircle, Loader2, QrCode, ArrowLeft, Plus, Minus, CreditCard, MapPin, Home, Briefcase, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// Address Type Definition
type Address = {
  id: number;
  label: string;
  house_no: string;
  landmark: string;
  district: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export default function CartPage() {
  const { cart, addToCart, decreaseQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [userRemarks, setUserRemarks] = useState("");
  
  // Address State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    house_no: "",
    landmark: "",
    district: "",
    city: "",
    state: "",
    pincode: "",
    phone: ""
  });

  const router = useRouter();

  // Load Addresses on Mount
  useEffect(() => {
    const fetchAddresses = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('addresses').select('*').eq('user_id', user.id);
        if (data) {
          setAddresses(data);
          if (data.length > 0) setSelectedAddressId(data[0].id);
        }
      }
    };
    fetchAddresses();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSaveAddress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Please login.");

    if (!newAddress.house_no || !newAddress.city || !newAddress.pincode || !newAddress.phone) {
      return alert("Please fill in required fields (House No, City, Pincode, Phone).");
    }

    const { data, error } = await supabase.from('addresses').insert([{
      user_id: user.id,
      ...newAddress
    }]).select();

    if (error) {
      alert("Error saving address: " + error.message);
    } else if (data) {
      setAddresses([...addresses, data[0]]);
      setSelectedAddressId(data[0].id);
      setShowAddressForm(false);
      setNewAddress({ label: "Home", house_no: "", landmark: "", district: "", city: "", state: "", pincode: "", phone: "" });
    }
  };

  const handleDeleteAddress = async (id: number) => {
    if (!confirm("Delete this address?")) return;
    const { error } = await supabase.from('addresses').delete().eq('id', id);
    if (!error) {
      setAddresses(prev => prev.filter(a => a.id !== id));
      if (selectedAddressId === id) setSelectedAddressId(null);
    }
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty!");
    if (!selectedAddressId) return alert("Please select a delivery address.");
    if (!paymentProof) return alert("Please upload a payment screenshot first.");

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to place an order.");
        router.push("/login");
        return;
      }

      const addressSnapshot = addresses.find(a => a.id === selectedAddressId);
      const userName = user.user_metadata?.full_name || "Royal Guest";

      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `order_${Date.now()}_${user.id}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage.from('orders').upload(filePath, paymentProof);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('orders').getPublicUrl(filePath);

      const { error: orderError } = await supabase.from('orders').insert([{
        user_id: user.id,
        total_amount: cartTotal,
        status: 'pending',
        payment_screenshot_url: publicUrl,
        user_remarks: userRemarks,
        customer_phone: addressSnapshot?.phone || "",
        customer_name: userName,
        delivery_address: addressSnapshot,
        items: cart
      }]);

      if (orderError) throw orderError;

      clearCart();
      alert("Order placed successfully! We will verify your payment shortly.");
      router.push('/profile'); 

    } catch (error: any) {
      alert("Checkout failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2a0a12] to-[#0f0505] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-2xl font-heading text-[#c5a059] mb-4">Your Treasury is Empty</h2>
        <p className="text-[#fbf5e9]/60 mb-8 font-body max-w-xs mx-auto text-sm">The royal wardrobe awaits. Add items to your collection.</p>
        <Link href="/shop" className="bg-gradient-to-r from-[#2a0a12] to-[#3d0a15] border border-[#c5a059] text-[#c5a059] px-8 py-3 font-heading uppercase tracking-widest text-xs hover:bg-[#c5a059] hover:text-[#1a0f0f] transition-all rounded-sm shadow-lg">
          Browse Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a0a12] to-[#0f0505] pb-24 pt-4 px-4 md:px-8 relative overflow-x-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-[#c5a059] rounded-full blur-[150px] opacity-10 pointer-events-none"></div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* --- LEFT COLUMN: ITEMS & ADDRESS (Span 7) --- */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-2">
             <Link href="/shop" className="text-[#c5a059]/80 hover:text-[#c5a059] transition"><ArrowLeft size={24} /></Link>
             <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#fbf5e9] tracking-wide">Shopping Cart</h1>
          </div>
          
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex gap-3 md:gap-4 bg-[#1a0f0f]/80 backdrop-blur-sm border border-[#c5a059]/20 p-3 rounded-xl shadow-lg relative group">
                {/* Image */}
                <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden border border-[#c5a059]/10 bg-black">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover opacity-90" />
                </div>
                
                {/* Details */}
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <div>
                    <h3 className="font-heading font-bold text-[#fbf5e9] text-sm leading-tight mb-1 pr-6">{item.name}</h3>
                    <p className="text-[#c5a059]/70 text-[10px] md:text-xs uppercase tracking-wider mb-2">Unit: ₹{item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-3 bg-[#0f0505] p-1 rounded-lg border border-[#c5a059]/20 w-fit">
                      <button onClick={() => decreaseQuantity(item.id)} className="w-6 h-6 rounded bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center hover:bg-[#c5a059] hover:text-[#0f0505] active:scale-95 transition-all"><Minus size={12} /></button>
                      <span className="text-[#fbf5e9] font-bold w-4 text-center text-xs">{item.quantity}</span>
                      <button onClick={() => addToCart(item)} className="w-6 h-6 rounded bg-[#c5a059]/10 text-[#c5a059] flex items-center justify-center hover:bg-[#c5a059] hover:text-[#0f0505] active:scale-95 transition-all"><Plus size={12} /></button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-[#c5a059] text-base">₹{(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 text-red-500/50 hover:text-red-400 p-2 active:scale-90 transition">
                   <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* --- ADDRESS SECTION --- */}
          <div className="pt-4 border-t border-[#c5a059]/10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-heading font-bold text-[#fbf5e9] flex items-center gap-2"><MapPin size={18} className="text-[#c5a059]" /> Delivery Address</h2>
              <button onClick={() => setShowAddressForm(!showAddressForm)} className="text-[10px] font-bold text-[#c5a059] border border-[#c5a059] px-3 py-1.5 rounded hover:bg-[#c5a059] hover:text-black transition uppercase tracking-wider flex items-center gap-1">
                {showAddressForm ? <X size={12}/> : <Plus size={12}/>} {showAddressForm ? "Cancel" : "Add New"}
              </button>
            </div>

            {/* Add Address Form */}
            {showAddressForm && (
              <div className="bg-[#1a0f0f] p-4 rounded-xl border border-[#c5a059]/30 mb-4 animate-in slide-in-from-top-4">
                <div className="grid grid-cols-1 gap-3 mb-4">
                  <div className="flex gap-2">
                    {['Home', 'Office', 'Other'].map(lbl => (
                      <button 
                        key={lbl}
                        onClick={() => setNewAddress({...newAddress, label: lbl})}
                        className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded border transition-colors ${newAddress.label === lbl ? 'bg-[#c5a059] text-black border-[#c5a059]' : 'text-[#c5a059] border-[#c5a059]/30'}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <input placeholder="House No / Flat *" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.house_no} onChange={e => setNewAddress({...newAddress, house_no: e.target.value})} />
                  <input placeholder="Landmark" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.landmark} onChange={e => setNewAddress({...newAddress, landmark: e.target.value})} />
                  <div className="grid grid-cols-2 gap-3">
                     <input placeholder="City *" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.city} onChange={e => setNewAddress({...newAddress, city: e.target.value})} />
                     <input placeholder="State" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.state} onChange={e => setNewAddress({...newAddress, state: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <input placeholder="Pincode *" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.pincode} onChange={e => setNewAddress({...newAddress, pincode: e.target.value})} />
                     <input placeholder="Phone *" className="bg-black/40 border border-[#c5a059]/20 p-3 rounded text-sm text-[#fbf5e9] outline-none focus:border-[#c5a059]" value={newAddress.phone} onChange={e => setNewAddress({...newAddress, phone: e.target.value})} />
                  </div>
                </div>
                <button onClick={handleSaveAddress} className="w-full bg-[#c5a059] text-black font-bold py-3 rounded hover:bg-white transition uppercase tracking-widest text-xs">Save Address</button>
              </div>
            )}

            {/* Address List */}
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div 
                  key={addr.id} 
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all relative flex flex-col gap-1 active:scale-[0.99]
                    ${selectedAddressId === addr.id ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#c5a059]/10 bg-[#1a0f0f] hover:border-[#c5a059]/40'}`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#c5a059] flex items-center gap-1">
                      {addr.label === 'Home' ? <Home size={12}/> : addr.label === 'Office' ? <Briefcase size={12}/> : <MapPin size={12}/>} 
                      {addr.label}
                    </span>
                    {selectedAddressId === addr.id && <CheckCircle size={16} className="text-[#c5a059]" />}
                  </div>
                  <p className="text-[#fbf5e9] text-sm font-bold mt-1 line-clamp-1">{addr.house_no}, {addr.landmark}</p>
                  <p className="text-[#fbf5e9]/60 text-xs">{addr.city}, {addr.state} - {addr.pincode}</p>
                  <p className="text-[#fbf5e9]/60 text-xs mt-1">Ph: {addr.phone}</p>
                  
                  <button onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }} className="absolute bottom-3 right-3 text-red-500/40 hover:text-red-500 p-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {addresses.length === 0 && !showAddressForm && (
                <div className="text-center py-6 border border-dashed border-[#c5a059]/20 rounded-xl">
                   <p className="text-[#fbf5e9]/40 text-sm italic">No addresses saved.</p>
                   <button onClick={() => setShowAddressForm(true)} className="text-[#c5a059] text-xs font-bold mt-2 underline">Add Address</button>
                </div>
              )}
            </div>
          </div>
          
          {/* User Remarks */}
          <div className="mt-4">
             <label className="block text-xs uppercase tracking-widest text-[#c5a059]/70 mb-2 font-bold ml-1">Instructions (Optional)</label>
             <textarea
               placeholder="Tailoring notes, gift message..."
               className="w-full p-3 border border-[#c5a059]/30 rounded-xl focus:border-[#c5a059] outline-none bg-[#1a0f0f]/50 font-body placeholder:text-[#c5a059]/20 text-[#fbf5e9] text-sm min-h-[80px]"
               value={userRemarks}
               onChange={(e) => setUserRemarks(e.target.value)}
             />
          </div>

        </div>

        {/* --- RIGHT COLUMN: CHECKOUT (Sticky) --- */}
        <div className="lg:col-span-5 h-fit pb-10">
          <div className="bg-[#1a0f0f] border border-[#c5a059]/30 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2a0a12] via-[#c5a059] to-[#2a0a12]" />
            
            <h2 className="text-lg font-heading font-bold text-[#fbf5e9] mb-4 flex items-center gap-2">
              <CreditCard className="text-[#c5a059]" size={18}/> Payment
            </h2>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm text-[#fbf5e9]/60"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm text-[#fbf5e9]/60"><span>Shipping</span><span className="text-green-400 text-xs">FREE</span></div>
              <div className="w-full h-px bg-[#c5a059]/20 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-[#c5a059] uppercase tracking-widest text-xs font-bold">Total Amount</span>
                <span className="text-xl font-bold text-[#fbf5e9]">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-[#0f0505] p-4 rounded-xl border border-[#c5a059]/20 text-center mb-6">
              <p className="text-[10px] text-[#c5a059] uppercase tracking-widest mb-3">Scan UPI to Pay</p>
              <div className="bg-white p-2 w-32 h-32 mx-auto rounded-lg shadow-inner flex items-center justify-center"><QrCode size={120} className="text-black" /></div>
              <p className="text-xs text-[#fbf5e9]/40 font-mono mt-3 bg-[#c5a059]/5 py-1 px-2 rounded inline-block">shadesofpunjab@upi</p>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-2">Payment Proof *</label>
              <div className="relative group cursor-pointer active:scale-[0.99] transition-transform">
                <input type="file" accept="image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"/>
                <div className={`border-2 border-dashed rounded-xl p-4 flex items-center justify-center gap-2 transition-all duration-300 ${paymentProof ? 'border-green-500/50 bg-green-900/10' : 'border-[#c5a059]/30 bg-[#0f0505]'}`}>
                  {paymentProof ? <><CheckCircle className="text-green-500" size={18} /><span className="text-xs text-green-400 font-bold truncate max-w-[150px]">{paymentProof.name}</span></> : <><Upload className="text-[#c5a059]" size={18} /><span className="text-xs text-[#c5a059]/80 uppercase tracking-wide">Tap to Upload</span></>}
                </div>
              </div>
            </div>

            <button onClick={handleCheckout} disabled={loading} className="w-full bg-gradient-to-r from-[#c5a059] to-[#8c6d36] text-[#1a0f0f] py-3.5 rounded-lg font-heading font-bold uppercase tracking-[0.2em] shadow-lg flex justify-center items-center gap-2 disabled:opacity-70 active:scale-[0.98] transition-all text-sm">
              {loading ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle size={18} />} {loading ? "Verifying..." : "Confirm Order"}
            </button>
            
            <div className="flex justify-center mt-4"><span className="text-[10px] text-[#fbf5e9]/30 uppercase tracking-widest flex items-center gap-1"><CheckCircle size={10} /> Secure Transaction</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}