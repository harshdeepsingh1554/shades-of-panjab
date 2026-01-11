"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { Loader2, Crown, ShoppingCart, X, Info } from "lucide-react";

// Define Product Type
type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  description?: string; // Added description
};

export default function ShopPage() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // For Modal
  const { addToCart } = useCart();

  useEffect(() => {
    async function loadProducts() {
      const category = searchParams.get("category")?.trim();
      const search = searchParams.get("search")?.trim();
      let query = supabase.from("products").select("*");

      if (category) {
        query = query.ilike("category", `%${category}%`);
      }

      if (search) {
        const terms = search
          .replace(/,/g, " ")
          .split(/\s+/)
          .map((term) => term.trim())
          .filter(Boolean);

        if (terms.length > 0) {
          const orClauses = terms.flatMap((term) => [
            `name.ilike.%${term}%`,
            `category.ilike.%${term}%`,
          ]);
          query = query.or(orClauses.join(","));
        }
      }

      const { data, error } = await query;
      if (!error && data) setProducts(data);
      setLoading(false);
    }
    setLoading(true);
    loadProducts();
  }, [searchParams]);

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (selectedProduct) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [selectedProduct]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0505] text-[#c5a059]">
      <Loader2 className="animate-spin w-12 h-12 mb-4" />
      <p className="font-heading tracking-[0.3em] uppercase text-sm">Opening ...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2a0a12] to-[#0f0505] relative overflow-hidden">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-[#c5a059] rounded-full blur-[180px] opacity-10 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-[#2a0a12] rounded-full blur-[180px] opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 py-16 relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-12 md:mb-20 relative">
          <div className="flex justify-center mb-4">
             <Crown size={48} className="text-[#c5a059] drop-shadow-lg" />
          </div>
          <span className="text-[#c5a059]/80 text-xs tracking-[0.4em] font-bold uppercase block mb-2">Collections</span>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#fbf5e9] tracking-wide drop-shadow-md">
            Shades of Punjab
          </h1>
          <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mx-auto mt-6" />
        </div>
        
        {/* Product Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group relative bg-[#1a1510] border border-[#c5a059]/30 p-3 md:p-4 rounded-xl shadow-lg hover:shadow-[#c5a059]/20 hover:border-[#c5a059] transition-all duration-500 flex flex-col cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              
              {/* Image Container - Shorter on Mobile */}
              <div className="relative aspect-square md:aspect-[3/4] overflow-hidden rounded-lg bg-black mb-4 border border-[#c5a059]/10 group-hover:border-[#c5a059]/30 transition-colors">
                <img 
                  src={product.image_url || "/placeholder.jpg"} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transform group-hover:scale-110 transition duration-1000 ease-in-out ${product.stock === 0 ? 'opacity-50 grayscale' : ''}`}
                />
                
                {product.stock === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-red-800/90 text-white border border-red-500 px-2 py-1 md:px-4 md:py-2 font-heading tracking-widest uppercase text-[10px] md:text-sm">
                      Sold Out
                    </span>
                  </div>
                )}

                {/* Info Icon Overlay */}
                <div className="absolute top-2 right-2 bg-black/50 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <Info size={16} />
                </div>
              </div>

              {/* Details Section */}
              <div className="text-center flex-1 flex flex-col">
                <p className="text-[9px] md:text-[10px] text-[#c5a059]/70 uppercase tracking-[0.2em] mb-1 md:mb-2 truncate">{product.category}</p>
                <h3 className="text-sm md:text-xl font-heading font-bold text-[#fbf5e9] mb-1 md:mb-2 truncate px-1 group-hover:text-[#c5a059] transition-colors">{product.name}</h3>
                <p className="text-sm md:text-lg text-[#c5a059] font-bold mb-3 md:mb-6">₹{product.price.toLocaleString()}</p>
                
                {/* Add to Cart (Stop Propagation to prevent modal opening when clicking button) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  disabled={product.stock === 0}
                  className={`mt-auto w-full py-2 md:py-4 font-heading uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] md:text-xs font-bold transition-all duration-500 flex items-center justify-center gap-2 border rounded-md
                    ${product.stock === 0 
                      ? 'bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-[#2a0a12] to-[#3d0a15] border-[#c5a059]/50 text-[#c5a059] hover:from-[#c5a059] hover:to-[#8c6d36] hover:text-[#1a1510] hover:border-[#c5a059]'
                    }`}
                >
                  {product.stock === 0 ? "Unavailable" : (
                    <>
                      <span className="hidden md:inline">Add to Cart</span> <span className="md:hidden">Add</span> <ShoppingCart size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 sm:p-6">
          
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-sm transition-opacity" 
            onClick={() => setSelectedProduct(null)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-4xl bg-[#1a1510] border border-[#c5a059] rounded-t-2xl md:rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-10 fade-in duration-300 max-h-[85vh] md:max-h-[80vh]">
            
            {/* Close Button */}
            <button 
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-red-900/80 transition"
            >
              <X size={20} />
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-1/2 bg-black h-64 md:h-auto relative shrink-0">
              <img 
                src={selectedProduct.image_url} 
                alt={selectedProduct.name} 
                className="w-full h-full object-contain md:object-cover"
              />
            </div>

            {/* Right: Info */}
            <div className="w-full md:w-1/2 p-6 md:p-10 flex flex-col overflow-y-auto">
              <div>
                <span className="text-[#c5a059]/60 text-xs font-bold uppercase tracking-widest">{selectedProduct.category}</span>
                <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#fbf5e9] mt-2 mb-2">{selectedProduct.name}</h2>
                <p className="text-xl md:text-2xl text-[#c5a059] font-bold mb-6">₹{selectedProduct.price.toLocaleString()}</p>
                
                <div className="w-full h-px bg-[#c5a059]/20 mb-6" />
                
                <h3 className="text-sm font-bold text-[#c5a059] uppercase tracking-widest mb-3">Description</h3>
                <p className="text-[#fbf5e9]/80 font-body leading-relaxed text-sm md:text-base mb-8">
                  {selectedProduct.description || "No specific description available for this royal attire. Please contact us for fabric details or customization requests."}
                </p>
              </div>

              <div className="mt-auto pt-6 border-t border-[#c5a059]/20">
                 <button 
                    onClick={() => {
                      addToCart(selectedProduct);
                      setSelectedProduct(null);
                    }}
                    disabled={selectedProduct.stock === 0}
                    className={`w-full py-4 font-heading uppercase tracking-[0.2em] text-sm font-bold transition-all duration-300 flex items-center justify-center gap-3 rounded-lg
                      ${selectedProduct.stock === 0 
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                        : 'bg-[#c5a059] text-[#1a1510] hover:bg-white hover:text-black shadow-lg hover:shadow-[#c5a059]/50'
                      }`}
                  >
                    {selectedProduct.stock === 0 ? "Sold Out" : (
                      <>Add to Cart <ShoppingCart size={18} /></>
                    )}
                  </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
