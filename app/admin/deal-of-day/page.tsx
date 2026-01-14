"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";
import { ArrowLeft, Loader2, Tag } from "lucide-react";

type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description?: string;
};

export default function DealOfDayAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = await isAdminEmail(user?.email);

      if (!user || !allowed) {
        alert("Restricted Area: You are not authorized to access the Royal Court.");
        router.push("/");
        return;
      }

      const { data: productRows } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,description")
        .order("created_at", { ascending: false });

      if (productRows) setProducts(productRows as Product[]);

      const { data: dealRow } = await supabase
        .from("products")
        .select("id")
        .eq("is_deal_of_day", true)
        .limit(1)
        .maybeSingle();

      if (dealRow?.id) setSelectedId(String(dealRow.id));
      setLoading(false);
    };

    initPage();
  }, [router]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === Number(selectedId)),
    [products, selectedId]
  );

  const handleSave = async () => {
    if (!selectedId) {
      alert("Please select a product first.");
      return;
    }

    setSaving(true);
    try {
      const clearResult = await supabase
        .from("products")
        .update({ is_deal_of_day: false })
        .eq("is_deal_of_day", true);

      if (clearResult.error) throw clearResult.error;

      const setResult = await supabase
        .from("products")
        .update({ is_deal_of_day: true })
        .eq("id", Number(selectedId));

      if (setResult.error) throw setResult.error;

      alert("Deal of the day updated.");
    } catch (error: any) {
      alert("Unable to update deal: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    setSaving(true);
    try {
      const clearResult = await supabase
        .from("products")
        .update({ is_deal_of_day: false })
        .eq("is_deal_of_day", true);

      if (clearResult.error) throw clearResult.error;

      setSelectedId("");
      alert("Deal of the day cleared.");
    } catch (error: any) {
      alert("Unable to clear deal: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-dark flex items-center justify-center text-royal-gold">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin w-12 h-12" />
          <p className="font-heading tracking-widest text-sm uppercase">Preparing the showcase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-maroon bg-[url('/royal-pattern-dark.png')] bg-blend-multiply p-6 flex justify-center items-center relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-royal-gold rounded-full blur-[180px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-royal-maroon rounded-full blur-[180px] opacity-30 pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-[#1a1510] p-10 rounded-2xl shadow-2xl border-2 border-royal-gold relative z-10">
        <div className="flex items-center gap-4 mb-10 border-b-2 border-royal-gold/50 pb-6">
          <Link href="/admin" className="text-royal-gold/70 hover:text-royal-gold transition-all duration-300 hover:scale-110">
            <ArrowLeft size={28} />
          </Link>
          <h1 className="text-3xl font-heading font-bold text-royal-gold tracking-wider drop-shadow-md">Deal of the Day</h1>
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-royal-gold mb-3 font-bold ml-1">Select Product</label>
            <div className="flex items-center border-2 border-royal-gold/50 rounded-lg px-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
              <Tag size={20} className="text-royal-gold/70 mr-3" />
              <select
                className="w-full p-4 bg-transparent outline-none font-body text-royal-cream appearance-none cursor-pointer"
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c5a059' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`}}
              >
                <option value="" className="bg-[#1a1510] text-royal-gold">Select a product...</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id} className="bg-[#1a1510] text-royal-gold">
                    {product.name} • INR {product.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedProduct && (
            <div className="border border-royal-gold/30 rounded-2xl overflow-hidden bg-black/40">
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
                <div className="relative min-h-[240px] bg-black">
                  <img
                    src={selectedProduct.image_url || "/placeholder.jpg"}
                    alt={selectedProduct.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-transparent to-transparent" />
                </div>
                <div className="p-6 md:p-8">
                  <p className="text-royal-gold uppercase tracking-[0.35em] text-[10px] mb-2">Preview</p>
                  <h2 className="text-2xl font-heading text-white mb-2">{selectedProduct.name}</h2>
                  <p className="text-royal-gold text-lg font-bold mb-4">INR {selectedProduct.price.toLocaleString()}</p>
                  <p className="text-royal-cream/70 text-sm leading-relaxed">
                    {selectedProduct.description || "No description provided. Add details to enrich the deal banner."}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-4">
            <button
              onClick={handleSave}
              disabled={saving || !selectedId}
              className="flex-1 bg-gradient-to-r from-royal-maroon to-[#3d0a15] text-royal-gold py-4 font-heading font-bold uppercase tracking-[0.3em] hover:from-royal-gold hover:to-[#8c6d36] hover:text-[#1a1510] transition-all duration-500 rounded-xl shadow-lg hover:shadow-royal-gold/30 disabled:opacity-70 border border-royal-gold/50"
            >
              {saving ? "Saving..." : "Set Deal of the Day"}
            </button>
            <button
              onClick={handleClear}
              disabled={saving}
              className="flex-1 bg-[#2a1010] text-red-300 py-4 font-heading font-bold uppercase tracking-[0.3em] hover:bg-red-900 hover:text-white transition-all duration-500 rounded-xl border border-red-700/50 disabled:opacity-70"
            >
              Clear Deal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
