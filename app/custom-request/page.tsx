"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Upload, Loader2, Camera, ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CustomRequest() {
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const router = useRouter();

  // Check Authentication on Load
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Please login to submit a royal request.");
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  const handleSubmit = async () => {
    if (!image) return alert("Please upload a screenshot of the design.");
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      // 1. Upload Image to 'orders' Bucket
      const fileExt = image.name.split('.').pop();
      const fileName = `request_${Date.now()}_${user.id}.${fileExt}`;
      const filePath = `${fileName}`; 

      const { error: uploadError } = await supabase.storage
        .from('orders')
        .upload(filePath, image);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('orders')
        .getPublicUrl(filePath);

      // 3. Save Request to DB
      const { error: dbError } = await supabase
        .from('custom_requests')
        .insert([{ 
          user_id: user.id,
          reference_image_url: publicUrl, 
          user_note: note,
          status: 'pending_quote' // Initial status
        }]);

      if (dbError) throw dbError;

      alert("Request sent to the Royal Court! Check your profile for the price quote.");
      router.push("/profile"); 

    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a0a12] via-[#1a0505] to-[#0f0505] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Decorative Glows - Adjusted for Mobile Visibility */}
      <div className="absolute top-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#c5a059] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#2a0a12] rounded-full blur-[120px] opacity-30 pointer-events-none"></div>

      <div className="w-full max-w-xl bg-[#1a1510] border border-[#c5a059]/30 rounded-2xl shadow-2xl p-6 md:p-8 relative z-10 backdrop-blur-sm">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 border-b border-[#c5a059]/30 pb-4">
           <Link href="/" className="text-[#c5a059]/80 hover:text-[#c5a059] transition hover:scale-110">
             <ArrowLeft size={24} />
           </Link>
           <div>
             <p className="text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold">Bespoke Service</p>
             <h1 className="text-2xl font-heading font-bold text-[#fbf5e9]">Custom Order Request</h1>
           </div>
        </div>

        <div className="space-y-6">
          
          {/* Note Input */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#c5a059]/70 mb-2 font-bold ml-1">Your Vision</label>
            <div className="bg-[#0f0505]/50 border border-[#c5a059]/30 rounded-xl p-3 focus-within:border-[#c5a059] transition-colors">
              <textarea 
                className="w-full bg-transparent outline-none font-body text-[#fbf5e9] placeholder:text-[#c5a059]/30 resize-none h-32 text-sm"
                placeholder="Describe the fabric, color, size, or any specific details..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs uppercase tracking-widest text-[#c5a059]/70 mb-2 font-bold ml-1">Reference Image</label>
            <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer relative group flex flex-col items-center justify-center bg-[#0f0505]/30
              ${image ? 'border-[#c5a059] bg-[#c5a059]/10' : 'border-[#c5a059]/40 hover:bg-[#c5a059]/5 hover:border-[#c5a059]'}`}>
              
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={loading}
              />
              
              {image ? (
                <div className="w-full">
                  <div className="w-32 h-32 bg-black rounded-lg overflow-hidden mx-auto mb-3 border border-[#c5a059]/50 shadow-lg">
                    <img src={URL.createObjectURL(image)} alt="Preview" className="w-full h-full object-cover opacity-90" />
                  </div>
                  <span className="text-[#c5a059] text-xs font-bold truncate max-w-full block px-4">{image.name}</span>
                  <p className="text-[10px] text-[#fbf5e9]/50 mt-1 uppercase tracking-wider">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-[#c5a059]/60 group-hover:text-[#c5a059] transition-colors">
                  <Camera className="w-10 h-10 mb-3" />
                  <span className="text-xs uppercase tracking-widest font-bold">Tap to Upload Screenshot</span>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#c5a059] to-[#8c6d36] text-[#1a0f0f] py-4 rounded-lg font-heading font-bold uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(197,160,89,0.4)] hover:scale-[1.02] transition-all duration-300 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:scale-100 shadow-lg mt-6"
          >
            <span className="relative z-10 flex items-center gap-2 text-sm">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Request"} {!loading && <Send size={16} />}
            </span>
          </button>

          <p className="text-[10px] text-[#c5a059]/40 text-center mt-4 uppercase tracking-widest">
            We will review and provide a price quote shortly.
          </p>

        </div>
      </div>
    </div>
  );
}