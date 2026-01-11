"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Loader2, Crown, Phone, Lock, User, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    // 1. Sanitize Phone: Remove spaces, dashes, or brackets to prevent errors
    const cleanPhone = phone.replace(/\D/g, '');

    if (!fullName || !cleanPhone || !password) {
      alert("Please fill in all fields properly.");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    // ZERO-BUDGET TRICK:
    // We convert the phone number to a pseudo-email to use Supabase's free authentication
    const pseudoEmail = `${cleanPhone}@shades.local`;

    const { data, error } = await supabase.auth.signUp({ 
      email: pseudoEmail, 
      password,
      options: {
        data: {
          full_name: fullName, 
          phone_number: cleanPhone,
        }
      }
    });
    
    if (error) {
      alert("Signup Failed: " + error.message);
      setLoading(false);
    } else {
      // Check if Auto-Login worked
      if (data.session) {
        alert("Account created successfully!");
        router.push("/profile"); 
      } else {
        alert("Account created! Please log in.");
        router.push("/login"); 
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0505] p-4 relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-[#c5a059] rounded-full blur-[180px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#2a0a12] rounded-full blur-[180px] opacity-30 pointer-events-none"></div>

      {/* Signup Card */}
      <div className="w-full max-w-md bg-[#1a1510] border border-[#c5a059]/30 rounded-2xl shadow-2xl p-8 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
             <Crown size={40} className="text-[#c5a059] drop-shadow-lg" />
          </div>
          <p className="text-[#c5a059]/60 uppercase tracking-[0.3em] text-xs font-bold mb-2">Sign up to get started</p>
          <h1 className="text-3xl font-heading font-bold text-[#fbf5e9] tracking-wide">
            Create Account
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mx-auto mt-4" />
        </div>
        
        {/* Input Fields */}
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-2 ml-1">Full Name</label>
            <div className="flex items-center bg-black/40 border border-[#c5a059]/30 rounded-lg px-4 py-3 focus-within:border-[#c5a059] transition-colors">
              <User size={18} className="text-[#c5a059]/50 mr-3" />
              <input 
                type="text" 
                placeholder="e.g. Manpreet " 
                className="w-full bg-transparent outline-none text-[#fbf5e9] placeholder:text-[#fbf5e9]/20 font-body"
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-2 ml-1">Phone Number</label>
            <div className="flex items-center bg-black/40 border border-[#c5a059]/30 rounded-lg px-4 py-3 focus-within:border-[#c5a059] transition-colors">
              <Phone size={18} className="text-[#c5a059]/50 mr-3" />
              <input 
                type="tel" 
                placeholder="e.g. 9876543210" 
                className="w-full bg-transparent outline-none text-[#fbf5e9] placeholder:text-[#fbf5e9]/20 font-body"
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>
          
          {/* Password Input */}
          <div>
            <label className="block text-xs font-bold text-[#c5a059] uppercase tracking-widest mb-2 ml-1">Password</label>
            <div className="flex items-center bg-black/40 border border-[#c5a059]/30 rounded-lg px-4 py-3 focus-within:border-[#c5a059] transition-colors">
              <Lock size={18} className="text-[#c5a059]/50 mr-3" />
              <input 
                type="password" 
                placeholder="Min 6 characters" 
                className="w-full bg-transparent outline-none text-[#fbf5e9] placeholder:text-[#fbf5e9]/20 font-body"
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={handleSignup}
          disabled={loading}
          className="w-full mt-10 bg-gradient-to-r from-[#c5a059] to-[#8c6d36] text-[#1a0f0f] py-4 rounded-lg font-heading font-bold uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] hover:scale-[1.02] transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-70 shadow-lg group"
        >
          {loading ? <Loader2 className="animate-spin" /> : "Sign Up"}
          {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
        </button>

        <div className="text-center mt-8 pt-6 border-t border-[#c5a059]/10">
          <p className="text-xs text-[#fbf5e9]/40 mb-2">Already a member?</p>
          <Link href="/login" className="text-[#c5a059] font-bold uppercase tracking-widest text-xs hover:text-white transition border-b border-[#c5a059] pb-0.5">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}