"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";
import { ExternalLink, CheckCircle, Trash2, ArrowLeft, Phone, Send, Box, Truck, Package, IndianRupee, Loader2, Camera, AlertCircle, MapPin, ShoppingBag, User, Bell, History, Save, XCircle, MinusCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Unified Types
type Order = {
  id: number;
  total_amount: number;
  status: string;
  payment_screenshot_url: string;
  user_remarks: string;
  admin_remarks: string;
  created_at: string;
  customer_phone?: string;
  customer_name?: string;
  delivery_address?: {
    house_no: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
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
  user_id: string;
  reference_image_url: string;
  user_note: string;
  admin_price_quote: number | null;
  payment_proof_url: string | null;
  status: string;
  created_at: string;
  admin_remarks?: string;
  customer_name?: string;
  customer_phone?: string;
  type: 'custom';
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [customRequests, setCustomRequests] = useState<CustomRequest[]>([]);
  const [priceInputs, setPriceInputs] = useState<{[key: number]: string}>({});
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'action' | 'history'>('action');
  const router = useRouter();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = await isAdminEmail(user?.email);

      if (!user || !allowed) {
        alert("Access Denied: Admins Only.");
        router.push("/");
        return;
      }
      
      await fetchAllData();
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchAllData = async () => {
    const { data: ordersData } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    const { data: requestsData } = await supabase.from('custom_requests').select('*').order('created_at', { ascending: false });
    
    if (ordersData) setOrders(ordersData.map(o => ({...o, type: 'standard'})));
    if (requestsData) setCustomRequests(requestsData.map(r => ({...r, type: 'custom'})));
  };

  // --- FILTER LOGIC ---
  const getFilteredData = () => {
    if (activeTab === 'action') {
      return {
        orders: orders.filter(o => !['delivered', 'rejected'].includes(o.status)),
        requests: customRequests.filter(r => 
          !r.admin_price_quote || (r.payment_proof_url && r.status !== 'verified_processing' && r.status !== 'converted_to_order' && r.status !== 'rejected')
        )
      };
    } else {
      return {
        orders: orders.filter(o => ['delivered', 'rejected'].includes(o.status)),
        requests: customRequests.filter(r => 
          (r.admin_price_quote && !r.payment_proof_url) || r.status === 'verified_processing' || r.status === 'converted_to_order' || r.status === 'rejected'
        )
      };
    }
  };

  const { orders: visibleOrders, requests: visibleRequests } = getFilteredData();

  // --- Handlers ---
  const handleOpenActionPanel = (id: number, currentNote: string) => {
    if (editingId === id) {
      setEditingId(null);
      setAdminNote("");
    } else {
      setEditingId(id);
      setAdminNote(currentNote || "");
    }
  };

  const updateOrderStatus = async (id: number, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (adminNote && adminNote.trim() !== "") updates.admin_remarks = adminNote;
    
    await supabase.from('orders').update(updates).eq('id', id);
    alert(`Order #${id} updated to ${newStatus}`);
    setEditingId(null); setAdminNote(""); fetchAllData();
  };

  const saveNoteOnly = async (id: number) => {
    if (!adminNote.trim()) return alert("Note cannot be empty");
    await supabase.from('orders').update({ admin_remarks: adminNote }).eq('id', id);
    alert("Note Saved!");
    setEditingId(null); setAdminNote(""); fetchAllData();
  };

  // NEW: Reject Qty Wise
  const rejectItemQty = async (orderId: number, itemIndex: number) => {
    const order = orders.find(o => o.id === orderId);
    if (!order || !order.items) return;

    const item = order.items[itemIndex];
    const isRemoval = item.quantity === 1;
    
    if (!confirm(isRemoval ? "Remove this item from order?" : `Reject 1 unit of ${item.name}? New Qty will be ${item.quantity - 1}.`)) return;

    // Create deep copy
    const updatedItems = order.items.map(i => ({...i}));
    
    if (isRemoval) {
        updatedItems.splice(itemIndex, 1);
    } else {
        updatedItems[itemIndex].quantity -= 1;
    }
    
    // Recalculate total
    const newTotal = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const { error } = await supabase
      .from('orders')
      .update({ 
        items: updatedItems, 
        total_amount: newTotal,
        admin_remarks: `Item Qty Adjusted. New Total: ${newTotal}`
      })
      .eq('id', orderId);

    if (error) alert("Error: " + error.message);
    else fetchAllData();
  };

  const deleteOrderProof = async (orderId: number, url: string) => {
    if (!confirm("Delete payment proof?")) return;
    try {
        const path = url.split('/').pop(); 
        if (path) await supabase.storage.from('orders').remove([path]);
        await supabase.from('orders').update({ payment_screenshot_url: null }).eq('id', orderId);
        fetchAllData();
    } catch (e: any) {
        alert("Error: " + e.message);
    }
  };

  // NEW: Permanently Delete Order (For Rejected/Junk)
  const deleteOrder = async (id: number) => {
    if (!confirm("PERMANENTLY DELETE this order? This cannot be undone.")) return;
    const { error } = await supabase.from('orders').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else {
      alert("Order deleted.");
      fetchAllData();
    }
  };

  const sendQuote = async (id: number) => {
    const price = priceInputs[id];
    if (!price) return alert("Enter price");
    await supabase.from('custom_requests').update({ admin_price_quote: parseFloat(price), status: 'quote_sent' }).eq('id', id);
    alert("Quote sent!"); fetchAllData();
  };

  const verifyCustomPayment = async (id: number) => {
    await supabase.from('custom_requests').update({ status: 'verified_processing' }).eq('id', id);
    alert("Verified!"); fetchAllData();
  };

  const rejectCustomRequest = async (id: number) => {
    if (!confirm("Mark this request as Rejected?")) return;
    const { error } = await supabase
      .from('custom_requests')
      .update({ status: 'rejected' })
      .eq('id', id);
      
    if (error) alert("Error: " + error.message);
    else {
      alert("Request Rejected.");
      fetchAllData();
    }
  };

  const deleteCustomRequest = async (id: number) => {
    if (!confirm("PERMANENTLY DELETE this request?")) return;
    const { error } = await supabase.from('custom_requests').delete().eq('id', id);
    if (error) alert("Error deleting: " + error.message);
    else {
      alert("Request deleted.");
      fetchAllData();
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0f0505] flex items-center justify-center text-[#c5a059]"><Loader2 className="animate-spin w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-[#0f0505] pb-20 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex items-center gap-4 mb-8 border-b border-[#c5a059]/30 pb-4">
           <Link href="/admin"><ArrowLeft className="text-[#c5a059] hover:scale-110 transition" /></Link>
           <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#c5a059] tracking-wide">Orders & Requests</h1>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-10 sticky top-4 z-20 bg-[#0f0505]/90 p-2 rounded-xl border border-[#c5a059]/20 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('action')}
            className={`flex-1 py-4 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
              ${activeTab === 'action' ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20' : 'bg-[#1a1510] text-[#c5a059]/50 hover:text-[#c5a059]'}`}
          >
            <Bell size={18} /> Pending Action
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 rounded-lg text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all
              ${activeTab === 'history' ? 'bg-[#c5a059] text-black shadow-lg shadow-[#c5a059]/20' : 'bg-[#1a1510] text-[#c5a059]/50 hover:text-[#c5a059]'}`}
          >
            <History size={18} /> History / Sent
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* === LEFT: STANDARD ORDERS === */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-[#c5a059]/20 pb-3">
              <Package className="text-[#c5a059]" />
              <h2 className="text-xl font-heading text-white">Standard Orders ({visibleOrders.length})</h2>
            </div>

            {visibleOrders.map((order) => (
              <div key={order.id} className="bg-[#1a1510] border border-[#c5a059]/30 rounded-xl overflow-hidden shadow-lg flex flex-col relative">
                
                {/* Delete Rejected Order Button */}
                {order.status === 'rejected' && (
                   <button 
                     onClick={() => deleteOrder(order.id)}
                     className="absolute top-3 right-3 text-red-500 hover:text-red-400 z-10 p-1 bg-black/50 rounded-full"
                     title="Delete Rejected Order"
                   >
                     <Trash2 size={16} />
                   </button>
                )}

                {/* Header */}
                <div className={`w-full py-2 px-4 flex justify-between items-center text-xs font-bold uppercase tracking-widest
                  ${order.status === 'delivered' ? 'bg-green-900/50 text-green-400' : 
                    order.status === 'rejected' ? 'bg-red-900/50 text-red-400' :
                    'bg-[#c5a059]/20 text-[#c5a059]'}`}>
                  <span>Order #{order.id}</span>
                  <span>{order.status}</span>
                </div>
                
                <div className="p-5 flex flex-col gap-5">
                  
                  {/* 1. Customer Info & Address */}
                  <div className="bg-black/40 rounded-lg p-4 border border-[#c5a059]/10 space-y-3">
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-white font-bold flex items-center gap-2">
                             <User size={14} className="text-[#c5a059]"/> {order.customer_name || "Guest"}
                          </p>
                          <p className="text-xs text-white/60 flex items-center gap-2 mt-1">
                             <Phone size={14} className="text-[#c5a059]"/> {order.customer_phone || "No Phone"}
                          </p>
                        </div>
                        <p className="text-[#c5a059] font-bold text-lg">₹{order.total_amount}</p>
                     </div>

                     {order.delivery_address ? (
                       <div className="mt-2 pt-2 border-t border-white/10">
                         <p className="text-[10px] text-[#c5a059] uppercase tracking-widest mb-1 flex items-center gap-1"><MapPin size={10}/> Shipping Address</p>
                         <p className="text-xs text-white/80 leading-relaxed">
                           {order.delivery_address.house_no}, {order.delivery_address.landmark}<br/>
                           {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.pincode}
                         </p>
                       </div>
                     ) : <p className="text-xs text-red-400 italic">No address info saved.</p>}
                  </div>

                  {/* 2. Ordered Items (The Dress) */}
                  <div className="space-y-2">
                    <p className="text-[10px] text-[#c5a059] uppercase tracking-widest flex items-center gap-1"><ShoppingBag size={12}/> Ordered Items</p>
                    {order.items && order.items.length > 0 ? (
                      <div className="grid gap-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex gap-3 bg-black/20 p-2 rounded border border-[#c5a059]/10 relative group/item">
                             <div className="w-12 h-12 bg-black rounded overflow-hidden border border-[#c5a059]/20 shrink-0 relative group">
                               <img src={item.image_url} className="w-full h-full object-cover" alt={item.name} />
                               <a href={item.image_url} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                                 <ExternalLink size={12} className="text-[#c5a059]"/>
                               </a>
                             </div>
                             <div className="flex-1">
                               <p className="text-xs text-white font-bold">{item.name}</p>
                               <p className="text-[10px] text-white/60">Qty: {item.quantity} x ₹{item.price}</p>
                             </div>
                             
                             {/* Reject 1 Unit / Remove Item Button */}
                             <button 
                               onClick={() => rejectItemQty(order.id, idx)}
                               className="absolute top-1 right-1 text-red-500/50 hover:text-red-500 p-1 rounded hover:bg-white/10 transition"
                               title={item.quantity > 1 ? "Reject 1 Unit" : "Remove Item"}
                             >
                               {item.quantity > 1 ? <MinusCircle size={16} /> : <XCircle size={16} />}
                             </button>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-white/40 italic">Items not recorded for this order.</p>}
                  </div>

                  {/* 3. Payment Proof & Note */}
                  <div className="flex items-center justify-between bg-[#c5a059]/5 p-2 rounded border border-[#c5a059]/10">
                     <div className="text-xs text-white/70">
                        <span className="text-[#c5a059]">Note:</span> "{order.user_remarks || "None"}"
                     </div>
                     {order.payment_screenshot_url ? (
                        <a href={order.payment_screenshot_url} target="_blank" className="text-xs text-blue-400 underline flex items-center gap-1">
                          <ExternalLink size={10} /> Check Payment
                        </a>
                     ) : <span className="text-xs text-red-500">No Payment</span>}
                  </div>

                  {/* 4. Actions / Notes */}
                  <div className="pt-2 border-t border-[#c5a059]/10">
                     {/* Toggle Action Panel */}
                     <button 
                       onClick={() => handleOpenActionPanel(order.id, order.admin_remarks)} 
                       className="w-full text-center text-xs text-[#c5a059] border border-[#c5a059]/30 rounded py-2 hover:bg-[#c5a059]/10 transition mb-2"
                     >
                       {editingId === order.id ? "Close Actions" : "Update Status / Add Note"}
                     </button>

                     {/* Action Panel */}
                     {editingId === order.id && (
                        <div className="bg-black/40 p-3 rounded-lg animate-in fade-in border border-white/10">
                           
                           {/* Note Input */}
                           <div className="flex gap-2 mb-3">
                             <input 
                               type="text" 
                               placeholder="Admin Note..." 
                               className="flex-1 bg-[#1a1510] border border-white/20 text-white text-sm p-2 rounded outline-none focus:border-[#c5a059]"
                               value={adminNote} 
                               onChange={(e) => setAdminNote(e.target.value)} 
                             />
                             <button onClick={() => saveNoteOnly(order.id)} className="bg-white/10 text-white px-3 rounded hover:bg-white/20" title="Save Note Only">
                               <Save size={16} />
                             </button>
                           </div>

                           {/* Status Buttons */}
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <button onClick={() => updateOrderStatus(order.id, 'verified')} className="bg-green-900/30 text-green-400 border border-green-500/30 py-2 rounded text-[10px] font-bold hover:bg-green-900/50">VERIFY</button>
                              <button onClick={() => updateOrderStatus(order.id, 'packed')} className="bg-purple-900/30 text-purple-400 border border-purple-500/30 py-2 rounded text-[10px] font-bold hover:bg-purple-900/50">PACK</button>
                              <button onClick={() => updateOrderStatus(order.id, 'shipped')} className="bg-blue-900/30 text-blue-400 border border-blue-500/30 py-2 rounded text-[10px] font-bold hover:bg-blue-900/50">SHIP</button>
                              <button onClick={() => updateOrderStatus(order.id, 'rejected')} className="bg-red-900/30 text-red-400 border border-red-500/30 py-2 rounded text-[10px] font-bold hover:bg-red-900/50">REJECT</button>
                           </div>
                           
                           {/* Delivered Button */}
                           <button onClick={() => updateOrderStatus(order.id, 'delivered')} className="w-full mt-2 bg-[#c5a059] text-black border border-[#c5a059] py-2 rounded text-[10px] font-bold hover:bg-white transition">
                              MARK DELIVERED
                           </button>
                        </div>
                     )}
                     
                     {/* Display existing admin note if panel closed */}
                     {order.admin_remarks && editingId !== order.id && (
                       <p className="text-xs text-[#c5a059] italic mt-2 text-center">Admin Note: {order.admin_remarks}</p>
                     )}
                  </div>

                </div>
              </div>
            ))}
          </div>

          {/* === RIGHT: CUSTOM REQUESTS === */}
          <div className="space-y-8">
            <div className="flex items-center gap-3 border-b border-[#c5a059]/20 pb-3">
              <Camera className="text-[#c5a059]" />
              <h2 className="text-xl font-heading text-white">Custom Requests ({visibleRequests.length})</h2>
            </div>

            {visibleRequests.map((req) => (
              <div key={req.id} className="bg-[#1a1510] border border-[#c5a059]/30 rounded-xl overflow-hidden shadow-lg p-5 flex flex-col gap-4 relative">
                
                {/* Delete/Reject Buttons (Top Right) */}
                <div className="absolute top-4 right-4 flex gap-2">
                   <button 
                    onClick={() => rejectCustomRequest(req.id)} 
                    className="text-yellow-500/50 hover:text-yellow-500 transition p-1"
                    title="Reject Request"
                  >
                    <XCircle size={16} />
                  </button>
                  <button 
                    onClick={() => deleteCustomRequest(req.id)} 
                    className="text-red-500/50 hover:text-red-500 transition p-1"
                    title="Permanently Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="flex justify-between items-start border-b border-white/5 pb-3 pr-16">
                  <p className="font-bold text-white text-sm">Request #{req.id}</p>
                  <span className="text-[10px] uppercase px-2 py-1 rounded font-bold border text-[#c5a059] border-[#c5a059]/20 bg-[#c5a059]/5">
                    {req.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-5">
                  <div className="w-full sm:w-32 aspect-square bg-black rounded-lg border border-[#c5a059]/20 overflow-hidden relative group">
                    <img src={req.reference_image_url} className="w-full h-full object-cover" />
                    <a href={req.reference_image_url} target="_blank" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[#c5a059]">
                      <ExternalLink size={20} />
                    </a>
                  </div>
                  <div className="flex-1">
                     <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                        <User size={12} className="text-[#c5a059]"/> <span className="font-bold">{req.customer_name || "Guest"}</span>
                     </div>
                     <div className="flex items-center gap-2 text-xs text-white/80 mb-1">
                        <Phone size={12} className="text-[#c5a059]"/> <span>{req.customer_phone || "No Phone"}</span>
                     </div>
                     <p className="text-xs text-white/60 italic bg-black/20 p-2 rounded">"{req.user_note}"</p>
                     
                     <div className="mt-3">
                       {!req.admin_price_quote ? (
                         <div className="flex gap-2">
                           <input type="number" placeholder="Quote ₹" className="w-24 bg-black/40 border border-[#c5a059]/30 text-white text-xs p-1 rounded" onChange={(e) => setPriceInputs({...priceInputs, [req.id]: e.target.value})} />
                           <button onClick={() => sendQuote(req.id)} className="bg-[#c5a059] text-black text-xs font-bold px-3 rounded hover:bg-white transition">Send</button>
                         </div>
                       ) : (
                         <div className="bg-[#c5a059]/10 p-2 rounded border border-[#c5a059]/20">
                            <p className="text-xs font-bold text-[#c5a059]">Price: ₹{req.admin_price_quote}</p>
                            {req.payment_proof_url && activeTab === 'action' && (
                              <div className="mt-2 flex items-center justify-between">
                                <a href={req.payment_proof_url} target="_blank" className="text-xs text-blue-400 underline flex gap-1 items-center"><ExternalLink size={10}/> Proof</a>
                                <button onClick={() => verifyCustomPayment(req.id)} className="text-[10px] bg-green-600 text-white px-3 py-1 rounded font-bold hover:bg-green-500">Verify</button>
                              </div>
                            )}
                         </div>
                       )}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
