"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Package, Clock, CheckCircle, Truck, Gift, MessageSquare, LogOut, Loader2, Camera, IndianRupee, Trash2, ShoppingCart, MapPin, Phone, User, ExternalLink } from "lucide-react";
import { useCart } from "@/context/CartContext";

// Types
type Order = {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  admin_remarks: string;
  payment_screenshot_url: string;
  customer_phone?: string;
  delivery_address?: {
    house_no: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  items?: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }[];
  type: 'standard';
};

type CustomRequest = {
  id: number;
  reference_image_url: string;
  admin_price_quote: number | null;
  payment_proof_url: string | null;
  status: string;
  user_note: string;
  created_at: string;
  type: 'custom';
};

export default function ProfilePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const { addToCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
    } else {
      setUserEmail(user.email || "");
      fetchData(user.id);
    }
  };

  const fetchData = async (userId: string) => {
    setLoading(true);
    // 1. Fetch Normal Orders
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    // 2. Fetch Custom Requests
    const { data: requestsData } = await supabase
      .from('custom_requests')
      .select('*')
      .eq('user_id', userId)
      .neq('status', 'converted_to_order')
      .order('created_at', { ascending: false });

    if (ordersData) setOrders(ordersData.map(o => ({...o, type: 'standard'})));
    if (requestsData) setCustomRequests(requestsData.map(r => ({...r, type: 'custom'})));
    setLoading(false);
  };

  const handleDeleteRequest = async (id: number) => {
    if (!confirm("Are you sure you want to decline this quote and delete the request?")) return;
    const { error } = await supabase.from('custom_requests').delete().eq('id', id);
    if (error) {
        alert("Error deleting: " + error.message);
    } else {
        alert("Request removed.");
        setCustomRequests(prev => prev.filter(r => r.id !== id));
    }
  };

  const handleAddToCart = async (req: CustomRequest) => {
      if (!req.admin_price_quote) return;
      
      const customItem = {
          id: 900000 + req.id, 
          name: `Bespoke Design #${req.id}`,
          price: req.admin_price_quote,
          image_url: req.reference_image_url,
          quantity: 1,
          category: 'Custom Request' 
      };
      
      addToCart(customItem);
      
      await supabase.from('custom_requests').update({ status: 'converted_to_order' }).eq('id', req.id);
      setCustomRequests(prev => prev.filter(r => r.id !== req.id));
      
      alert("Added to Cart! Proceed to checkout.");
      router.push('/cart'); 
  };

  const handlePaymentUpload = async (e: React.ChangeEvent<HTMLInputElement>, requestId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploadingId(requestId);
    
    try {
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `custom_pay_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from('orders').upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('orders').getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from('custom_requests')
        .update({ 
          payment_proof_url: publicUrl,
          status: 'payment_uploaded'
        })
        .eq('id', requestId);

      if (dbError) throw dbError;
      alert("Payment proof uploaded! The Royal Court will verify shortly.");
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) fetchData(user.id);

    } catch (error: any) {
      alert("Upload failed: " + error.message);
    } finally {
      setUploadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'verified': case 'verified_processing': return { icon: <CheckCircle size={16} />, color: 'text-green-400 bg-green-900/30 border-green-500/50' };
      case 'packed': return { icon: <Gift size={16} />, color: 'text-purple-400 bg-purple-900/30 border-purple-500/50' };
      case 'shipped': return { icon: <Truck size={16} />, color: 'text-blue-400 bg-blue-900/30 border-blue-500/50' };
      case 'delivered': return { icon: <Package size={16} />, color: 'text-[#c5a059] bg-[#c5a059]/20 border-[#c5a059]/50' };
      case 'rejected': return { icon: <Clock size={16} />, color: 'text-red-400 bg-red-900/30 border-red-500/50' };
      case 'payment_uploaded': return { icon: <Clock size={16} />, color: 'text-blue-400 bg-blue-900/30 border-blue-500/50' };
      case 'quote_sent': return { icon: <MessageSquare size={16} />, color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50' };
      default: return { icon: <Clock size={16} />, color: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/50' };
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0b0b0c] flex items-center justify-center text-[#c5a059]">
      <Loader2 className="animate-spin w-10 h-10" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-[#f8f2e7] pb-20 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-28 right-[-140px] h-72 w-72 rounded-full bg-[#c5a059]/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-120px] h-96 w-96 rounded-full bg-[#3a2715]/40 blur-3xl" />
      <div className="max-w-6xl mx-auto px-4 py-10 relative">
        
        {/* Profile Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="flex-1 w-full bg-[#141210]/80 p-6 rounded-2xl border border-[#c5a059]/20 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center gap-5">
              <div className="h-14 w-14 rounded-full bg-[#c5a059]/15 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] font-bold text-lg">
                {userEmail ? userEmail.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="flex-1">
                <p className="text-[#c5a059]/70 uppercase tracking-[0.2em] text-[10px] font-bold mb-1 flex items-center gap-2">
                  <User size={12} /> Signed in
                </p>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-[#fbf5e9] break-all">{userEmail}</h1>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full md:w-auto">
                <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#c5a059]/70">Orders</p>
                  <p className="text-lg font-bold text-[#fbf5e9]">{orders.length}</p>
                </div>
                <div className="bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#c5a059]/70">Requests</p>
                  <p className="text-lg font-bold text-[#fbf5e9]">{customRequests.length}</p>
                </div>
                <div className="hidden sm:block bg-black/40 border border-white/5 rounded-xl px-4 py-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#c5a059]/70">Status</p>
                  <p className="text-lg font-bold text-green-400">Active</p>
                </div>
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="flex items-center gap-2 text-red-300 border border-red-500/30 px-6 py-2.5 hover:bg-red-900/20 rounded-xl text-xs uppercase tracking-widest font-bold transition">
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* --- SECTION 1: CUSTOM REQUESTS --- */}
        {customRequests.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-6">
              <div className="flex items-center gap-3">
                <Camera className="text-[#c5a059]" />
                <h2 className="text-xl font-heading text-white">Bespoke Requests</h2>
              </div>
              <span className="text-[10px] uppercase tracking-widest text-[#c5a059]/70">{customRequests.length} active</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customRequests.map((req) => {
                const statusStyle = getStatusStyle(req.status);
                return (
                  <div key={req.id} className="bg-[#15130f] border border-[#c5a059]/20 rounded-2xl overflow-hidden shadow-[0_24px_60px_-40px_rgba(0,0,0,0.8)] p-5 flex flex-col gap-5">
                    {/* Image */}
                    <div className="w-full aspect-[16/9] sm:aspect-square bg-black rounded-xl border border-[#c5a059]/15 overflow-hidden">
                      <img src={req.reference_image_url} className="w-full h-full object-cover opacity-80" alt="Request" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-[#fbf5e9] text-base">Custom Design #{req.id}</h3>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusStyle.color}`}>
                            {statusStyle.icon} {req.status.replace('_', ' ')}
                          </div>
                        </div>
                        <p className="text-[#fbf5e9]/60 text-sm mb-4 italic">"{req.user_note}"</p>
                      </div>

                      {/* Action Area */}
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        {req.admin_price_quote ? (
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-[#c5a059] uppercase tracking-widest">Quote</p>
                              <p className="text-2xl font-bold text-green-400 flex items-center gap-1">
                                <IndianRupee size={18} />{req.admin_price_quote}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                               <button 
                                 onClick={() => handleAddToCart(req)}
                                 className="bg-[#c5a059] text-[#1a1510] font-bold px-6 py-2.5 rounded-lg shadow-lg hover:bg-white transition-all flex items-center gap-2 uppercase text-xs tracking-wider border border-[#c5a059]"
                               >
                                 <ShoppingCart size={16} /> Add to Cart
                               </button>
                               
                               <button 
                                 onClick={() => handleDeleteRequest(req.id)}
                                 className="text-red-400 hover:text-red-300 border border-red-500/30 p-2.5 rounded-lg hover:bg-red-900/20 transition"
                                 title="Decline Quote & Delete"
                               >
                                 <Trash2 size={18} />
                               </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-yellow-500 text-sm italic">Waiting for a price quote.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- SECTION 2: ORDER HISTORY --- */}
        <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 mb-6">
          <div className="flex items-center gap-3">
            <Package className="text-[#c5a059]" />
            <h2 className="text-xl font-heading text-white">Order History</h2>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-[#c5a059]/70">{orders.length} total</span>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-[#15130f] border border-white/10 rounded-2xl shadow-lg">
            <p className="text-[#fbf5e9]/40 font-body mb-4">No orders yet.</p>
            <button onClick={() => router.push('/shop')} className="text-[#c5a059] font-bold hover:underline uppercase tracking-widest text-xs">Browse Collection</button>
          </div>
        ) : (
          <div className="space-y-8">
            {orders.map((order) => {
              const statusStyle = getStatusStyle(order.status);
              return (
                <div key={order.id} className="bg-[#15130f] border border-white/10 rounded-2xl shadow-[0_22px_60px_-40px_rgba(0,0,0,0.85)] hover:border-[#c5a059]/40 transition-all duration-300 overflow-hidden">
                  
                  {/* Order Header */}
                  <div className="bg-black/40 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10">
                    <div>
                      <span className="text-[#c5a059] font-bold uppercase tracking-widest text-xs block mb-1">Order #{order.id}</span>
                      <span className="text-[10px] text-[#fbf5e9]/40 font-mono">
                        {new Date(order.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusStyle.color}`}>
                      {statusStyle.icon} {order.status.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="p-5">
                    {/* Delivery & Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                       {/* Address */}
                       <div className="flex-1">
                          <p className="text-[10px] text-[#c5a059] uppercase tracking-widest mb-2 flex items-center gap-1"><MapPin size={10}/> Delivery Address</p>
                          {order.delivery_address ? (
                             <div className="text-xs text-[#fbf5e9]/80 leading-relaxed">
                               <p className="font-bold">{order.delivery_address.house_no}, {order.delivery_address.landmark}</p>
                               <p>{order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}</p>
                               <p className="flex items-center gap-1 mt-1 text-[#c5a059]/80"><Phone size={10}/> {order.delivery_address.phone}</p>
                             </div>
                          ) : <p className="text-xs text-white/30 italic">Address not recorded.</p>}
                       </div>

                       {/* Admin Message */}
                       {order.admin_remarks && (
                          <div className="flex-1 bg-white/5 border border-white/10 p-4 rounded-xl">
                            <p className="text-[10px] text-[#c5a059] uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                              <MessageSquare size={10} /> Note from support
                            </p>
                            <p className="text-[#fbf5e9] text-sm italic">"{order.admin_remarks}"</p>
                          </div>
                       )}
                    </div>

                    {/* Item List */}
                    <div className="border-t border-white/10 pt-4">
                      <p className="text-[10px] text-[#c5a059] uppercase tracking-widest mb-3">Items</p>
                      <div className="space-y-3">
                        {order.items && order.items.length > 0 ? (
                           order.items.map((item, idx) => (
                             <div key={idx} className="flex items-center gap-4 bg-black/30 p-3 rounded-xl border border-white/5">
                                <div className="w-12 h-12 bg-black rounded-lg border border-white/10 overflow-hidden shrink-0">
                                   <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                                </div>
                                <div className="flex-1 flex justify-between items-center gap-4">
                                   <div>
                                     <p className="text-sm text-[#fbf5e9] font-bold">{item.name}</p>
                                     <p className="text-[10px] text-[#c5a059]">Qty: {item.quantity} | INR {item.price}</p>
                                   </div>
                                   <p className="text-sm text-[#fbf5e9] font-bold">INR {item.price * item.quantity}</p>
                                </div>
                             </div>
                           ))
                        ) : <p className="text-xs text-white/30 italic">Items details unavailable.</p>}
                      </div>
                    </div>

                    {/* Footer Total */}
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                       {order.payment_screenshot_url ? (
                         <a href={order.payment_screenshot_url} target="_blank" className="text-xs text-blue-400 underline flex items-center gap-1">
                           <ExternalLink size={10} /> Payment Proof
                         </a>
                       ) : <span className="text-xs text-red-500">No proof</span>}
                       <p className="text-lg text-[#c5a059] font-bold flex items-center gap-1">
                         <IndianRupee size={16} />{order.total_amount}
                       </p>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
