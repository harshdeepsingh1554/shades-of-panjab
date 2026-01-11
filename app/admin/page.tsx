"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, PlusCircle, LogOut, Loader2, Crown, Shirt, Camera, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // SECURITY CHECK: Run this when page loads
  useEffect(() => {
    const protectRoute = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const allowed = await isAdminEmail(user?.email);

      // Check if user is logged in AND their email is in the allowed list
      if (!user || !allowed) {
        alert("Restricted Area: You are not authorized to access the Royal Court.");
        router.push("/"); 
      } else {
        setLoading(false);
      }
    };
    protectRoute();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-dark flex items-center justify-center text-royal-gold">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-12 h-12" />
          <p className="font-heading tracking-widest text-sm uppercase">Entering the Durbar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-dark text-royal-cream p-6 flex flex-col items-center relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-royal-gold rounded-full blur-[150px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-royal-maroon rounded-full blur-[150px] opacity-20 pointer-events-none"></div>

      {/* Header Section */}
      <div className="text-center mt-12 mb-16 relative z-10">
        <div className="flex justify-center mb-4">
          <Crown size={48} className="text-royal-gold drop-shadow-lg" />
        </div>
        <p className="text-royal-gold uppercase tracking-[0.4em] text-xs font-bold mb-2">Shades of Punjab</p>
        <h1 className="text-5xl font-heading font-bold text-white tracking-wide">
          The Royal Durbar
        </h1>
        <div className="w-32 h-1 bg-gradient-to-r from-transparent via-royal-gold to-transparent mx-auto mt-6" />
      </div>

      {/* Dashboard Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl w-full relative z-10">
        
        {/* BUTTON 1: Add Cloth (Add Product) */}
        <Link href="/admin/add-product" className="group relative bg-[#1a1510] border border-royal-gold/30 p-10 rounded-xl hover:border-royal-gold hover:bg-[#251d16] transition-all duration-500 shadow-lg hover:shadow-royal-gold/20 text-center overflow-hidden">
          {/* Hover Effect Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-royal-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          
          <div className="relative z-10">
            <div className="bg-royal-gold/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-royal-gold group-hover:text-[#1a1510] transition-colors duration-500 border border-royal-gold/20">
              <Shirt size={40} className="text-royal-gold group-hover:text-[#1a1510]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-royal-gold transition-colors">Add Cloth</h2>
            <p className="text-gray-400 font-body text-sm leading-relaxed max-w-xs mx-auto">
              Expand the royal treasury. Upload new suits, fabrics, and pricing details.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-royal-gold text-xs font-bold uppercase tracking-widest border-b border-royal-gold pb-1 group-hover:gap-4 transition-all">
              Add New Treasure <PlusCircle size={14} />
            </div>
          </div>
        </Link>

        {/* BUTTON 2: Manage Orders */}
        <Link href="/admin/orders" className="group relative bg-[#1a1510] border border-royal-gold/30 p-10 rounded-xl hover:border-royal-gold hover:bg-[#251d16] transition-all duration-500 shadow-lg hover:shadow-royal-gold/20 text-center overflow-hidden">
          {/* Hover Effect Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-royal-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          
          <div className="relative z-10">
            <div className="bg-royal-gold/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-royal-gold group-hover:text-[#1a1510] transition-colors duration-500 border border-royal-gold/20">
              <Package size={40} className="text-royal-gold group-hover:text-[#1a1510]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-royal-gold transition-colors">Manage Orders</h2>
            <p className="text-gray-400 font-body text-sm leading-relaxed max-w-xs mx-auto">
              Review pending requests, verify payment screenshots, and update status.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-royal-gold text-xs font-bold uppercase tracking-widest border-b border-royal-gold pb-1 group-hover:gap-4 transition-all">
              View Requests <PlusCircle size={14} />
            </div>
          </div>
        </Link>

        {/* BUTTON 3: Custom Requests */}
        <Link href="/admin/orders" className="group relative bg-[#1a1510] border border-royal-gold/30 p-10 rounded-xl hover:border-royal-gold hover:bg-[#251d16] transition-all duration-500 shadow-lg hover:shadow-royal-gold/20 text-center overflow-hidden">
          {/* Hover Effect Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-royal-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          
          <div className="relative z-10">
            <div className="bg-royal-gold/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-royal-gold group-hover:text-[#1a1510] transition-colors duration-500 border border-royal-gold/20">
              <Camera size={40} className="text-royal-gold group-hover:text-[#1a1510]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-royal-gold transition-colors">Custom Requests</h2>
            <p className="text-gray-400 font-body text-sm leading-relaxed max-w-xs mx-auto">
              Set prices for custom designs and verify special order payments.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-royal-gold text-xs font-bold uppercase tracking-widest border-b border-royal-gold pb-1 group-hover:gap-4 transition-all">
              Handle Bespoke <PlusCircle size={14} />
            </div>
          </div>
        </Link>

        {/* BUTTON 4: Manage Admins */}
        <Link href="/admin/admins" className="group relative bg-[#1a1510] border border-royal-gold/30 p-10 rounded-xl hover:border-royal-gold hover:bg-[#251d16] transition-all duration-500 shadow-lg hover:shadow-royal-gold/20 text-center overflow-hidden">
          {/* Hover Effect Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-royal-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"/>
          
          <div className="relative z-10">
            <div className="bg-royal-gold/10 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-royal-gold group-hover:text-[#1a1510] transition-colors duration-500 border border-royal-gold/20">
              <Shield size={40} className="text-royal-gold group-hover:text-[#1a1510]" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-white mb-3 group-hover:text-royal-gold transition-colors">Manage Admins</h2>
            <p className="text-gray-400 font-body text-sm leading-relaxed max-w-xs mx-auto">
              Add or remove royal court members in one secure place.
            </p>
            <div className="mt-8 inline-flex items-center gap-2 text-royal-gold text-xs font-bold uppercase tracking-widest border-b border-royal-gold pb-1 group-hover:gap-4 transition-all">
              Open Registry <PlusCircle size={14} />
            </div>
          </div>
        </Link>

      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="mt-20 group flex items-center gap-3 text-royal-gold/60 hover:text-royal-gold transition-all duration-300 uppercase tracking-widest text-xs font-bold py-3 px-8 rounded-full border border-royal-gold/20 hover:border-royal-gold hover:bg-royal-gold/5"
      >
        <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> 
        Leave Chambers
      </button>

      {/* Footer Decoration */}
      <div className="absolute bottom-1 text-[10px] text-royal-gold/30 uppercase tracking-[0.5em]">
        Restricted Access • Admin Only
      </div>
    </div>
  );
}
