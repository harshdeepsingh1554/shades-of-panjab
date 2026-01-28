"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/context/CartContext";
import { Loader2, Crown, ShoppingCart, X, Info, Star, MessageSquare } from "lucide-react";

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

type Review = {
  id: number;
  product_id: number;
  name: string | null;
  rating: number;
  comment: string;
  created_at: string;
};

function ShopPageContent() {
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null); // For Modal
  const [reviews, setReviews] = useState<Review[]>([]);
  const [ratingSummary, setRatingSummary] = useState({ value: 0, count: 0 });
  const [reviewForm, setReviewForm] = useState({ name: "", rating: 0, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewAllowed, setReviewAllowed] = useState(false);
  const [reviewGateMessage, setReviewGateMessage] = useState("");
  const [userName, setUserName] = useState<string | null>(null);
  const reviewTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const { addToCart } = useCart();

  const fetchReviews = async (productId: number) => {
    const { data, error } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const total = data.reduce((sum, review) => sum + review.rating, 0);
      const count = data.length;
      const value = count ? Math.round((total / count) * 10) / 10 : 0;
      setReviews(data as Review[]);
      setRatingSummary({ value, count });
    } else {
      setReviews([]);
      setRatingSummary({ value: 0, count: 0 });
    }
  };

  const fetchReviewAccess = async (productId: number) => {
    const { data: authData } = await supabase.auth.getUser();
    const user = authData?.user;
    if (!user) {
      setUserName(null);
      setReviewAllowed(false);
      setReviewGateMessage("Sign in to review this product.");
      return;
    }

    const displayName = user.user_metadata?.full_name || user.email || "Verified Buyer";
    setUserName(displayName);
    setReviewForm((prev) => ({ ...prev, name: displayName }));

    const { data, error } = await supabase
      .from("orders")
      .select("status, items")
      .eq("user_id", user.id);

    if (error || !data) {
      setReviewAllowed(false);
      setReviewGateMessage("Unable to verify purchase history.");
      return;
    }

    const hasPurchase = data.some((order: any) => {
      if (!order || order.status === "rejected") return false;
      if (!Array.isArray(order.items)) return false;
      return order.items.some((item: any) => item?.id === productId);
    });

    setReviewAllowed(hasPurchase);
    setReviewGateMessage(hasPurchase ? "" : "Reviews are available after purchase.");
  };

  const handleReviewSubmit = async () => {
    if (!selectedProduct) return;
    if (!reviewAllowed) {
      alert("Only verified buyers can leave a review.");
      return;
    }
    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      alert("Please add a rating and comment.");
      return;
    }

    setReviewLoading(true);
    const payload = {
      product_id: selectedProduct.id,
      name: reviewForm.name.trim() || userName || null,
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    };

    const { error } = await supabase.from("product_reviews").insert(payload);
    if (error) {
      alert("Unable to submit review: " + error.message);
    } else {
      setReviewForm({ name: "", rating: 0, comment: "" });
      await fetchReviews(selectedProduct.id);
    }

    setReviewLoading(false);
  };

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
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      fetchReviews(selectedProduct.id);
      fetchReviewAccess(selectedProduct.id);
      setReviewForm((prev) => ({ ...prev, rating: 0, comment: "" }));
    } else {
      setReviews([]);
      setRatingSummary({ value: 0, count: 0 });
      setReviewAllowed(false);
      setReviewGateMessage("");
      setUserName(null);
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

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-10 sm:py-12 md:py-16 relative z-10">
        
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12 md:mb-20 relative">
          <div className="flex justify-center mb-4">
             <Crown size={40} className="text-[#c5a059] drop-shadow-lg" />
          </div>
          <span className="text-[#c5a059]/80 text-xs tracking-[0.4em] font-bold uppercase block mb-2">Collections</span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold text-[#fbf5e9] tracking-wide drop-shadow-md">
            Shades of Punjab
          </h1>
          <div className="w-24 md:w-32 h-1 bg-gradient-to-r from-transparent via-[#c5a059] to-transparent mx-auto mt-6" />
        </div>
        
        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="group relative bg-[#1a1510] border border-[#c5a059]/30 p-2.5 sm:p-3 md:p-4 rounded-xl shadow-lg hover:shadow-[#c5a059]/20 hover:border-[#c5a059] transition-all duration-500 flex flex-col cursor-pointer"
              onClick={() => setSelectedProduct(product)}
            >
              
              {/* Image Container - Shorter on Mobile */}
              <div className="relative w-full h-32 sm:h-40 md:h-auto md:aspect-[3/4] overflow-hidden rounded-lg bg-black mb-4 border border-[#c5a059]/10 group-hover:border-[#c5a059]/30 transition-colors">
                <img 
                  src={product.image_url || "/placeholder.jpg"} 
                  alt={product.name} 
                  className={`w-full h-full object-cover transform group-hover:scale-110 transition duration-1000 ease-in-out ${product.stock === 0 ? "opacity-50 grayscale" : ""}`}
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
                <p className="text-[9px] sm:text-[10px] md:text-[11px] text-[#c5a059]/70 uppercase tracking-[0.2em] mb-1 md:mb-2 truncate">{product.category}</p>
                <h3 className="text-[13px] sm:text-sm md:text-lg font-heading font-bold leading-snug text-[#fbf5e9] mb-1 md:mb-2 truncate px-1 group-hover:text-[#c5a059] transition-colors">{product.name}</h3>
                <p className="text-sm sm:text-base md:text-lg text-[#c5a059] font-bold mb-2 sm:mb-3 md:mb-5">â‚¹{product.price.toLocaleString()}</p>
                
                {/* Add to Cart (Stop Propagation to prevent modal opening when clicking button) */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(product);
                  }}
                  disabled={product.stock === 0}
                  className={`mt-auto w-full py-2.5 sm:py-3 md:py-4 font-heading uppercase tracking-[0.1em] md:tracking-[0.2em] text-[10px] sm:text-[11px] md:text-xs font-bold transition-all duration-500 flex items-center justify-center gap-2 border rounded-md
                    ${product.stock === 0 
                      ? "bg-gray-800 border-gray-700 text-gray-500 cursor-not-allowed" 
                      : "bg-gradient-to-r from-[#2a0a12] to-[#3d0a15] border-[#c5a059]/50 text-[#c5a059] hover:from-[#c5a059] hover:to-[#8c6d36] hover:text-[#1a1510] hover:border-[#c5a059]"
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
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-3 sm:p-4 md:p-6">
          
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
            <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-10 flex flex-col overflow-y-auto">
              <div>
                <span className="text-[#c5a059]/60 text-xs font-bold uppercase tracking-widest">{selectedProduct.category}</span>
                <h2 className="text-2xl md:text-4xl font-heading font-bold text-[#fbf5e9] mt-2 mb-2">{selectedProduct.name}</h2>
                <p className="text-xl md:text-2xl text-[#c5a059] font-bold mb-6">â‚¹{selectedProduct.price.toLocaleString()}</p>
                
                <div className="w-full h-px bg-[#c5a059]/20 mb-6" />
                
                <h3 className="text-sm font-bold text-[#c5a059] uppercase tracking-widest mb-3">Description</h3>
                <p className="text-[#fbf5e9]/80 font-body leading-relaxed text-sm md:text-base mb-8">
                  {selectedProduct.description || "No specific description available for this royal attire. Please contact us for fabric details or customization requests."}
                </p>
              </div>

              <div className="bg-black/30 border border-white/10 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const filled = index + 1 <= Math.round(ratingSummary.value);
                          return (
                            <Star
                              key={index}
                              size={14}
                              className={filled ? "text-[#c5a059]" : "text-white/20"}
                              fill={filled ? "currentColor" : "none"}
                            />
                          );
                        })}
                      </div>
                      <span className="text-sm font-semibold text-[#fbf5e9]">{ratingSummary.value}</span>
                      <span className="text-xs text-[#fbf5e9]/50">({ratingSummary.count} ratings)</span>
                    </div>
                    <p className="text-[11px] text-[#fbf5e9]/50 mt-1">Based on recent purchases.</p>
                  </div>
                  <button
                    className="text-[10px] sm:text-xs uppercase tracking-widest text-[#c5a059] border border-[#c5a059]/40 px-3 py-2 rounded-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    onClick={() => reviewTextareaRef.current?.focus()}
                    disabled={!reviewAllowed}
                  >
                    Write a review
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {reviews.length ? (
                    reviews.map((review) => (
                      <div key={review.id} className="rounded-lg border border-white/10 bg-black/20 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[#fbf5e9]">{review.name || "Guest"}</p>
                          <span className="text-[10px] text-[#fbf5e9]/40">
                            {new Date(review.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {Array.from({ length: 5 }).map((_, index) => {
                            const filled = index + 1 <= review.rating;
                            return (
                              <Star
                                key={index}
                                size={12}
                                className={filled ? "text-[#c5a059]" : "text-white/20"}
                                fill={filled ? "currentColor" : "none"}
                              />
                            );
                          })}
                        </div>
                        <p className="text-xs text-[#fbf5e9]/70 mt-2">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-[#fbf5e9]/40 italic">No reviews yet. Be the first to leave one.</p>
                  )}
                </div>

                <div className="mt-4">
                  <label className="text-[10px] uppercase tracking-widest text-[#c5a059]/70 flex items-center gap-2">
                    <MessageSquare size={12} /> Add a comment
                  </label>
                  <p className="mt-2 text-xs text-[#fbf5e9]/70">
                    Reviewing as <span className="text-[#fbf5e9] font-semibold">{userName || "Guest"}</span>
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1;
                      const filled = value <= reviewForm.rating;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setReviewForm((prev) => ({ ...prev, rating: value }))}
                          className="p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!reviewAllowed}
                        >
                          <Star
                            size={16}
                            className={filled ? "text-[#c5a059]" : "text-white/20"}
                            fill={filled ? "currentColor" : "none"}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs text-[#fbf5e9]/50">
                      {reviewForm.rating ? `${reviewForm.rating} / 5` : "Tap to rate"}
                    </span>
                  </div>
                  <textarea
                    ref={reviewTextareaRef}
                    className="mt-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-[#fbf5e9] placeholder:text-[#fbf5e9]/40 focus:outline-none focus:ring-2 focus:ring-[#c5a059]/40"
                    placeholder={reviewAllowed ? "Share your experience" : "Purchase required to review"}
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                    disabled={!reviewAllowed}
                  />
                  <button
                    className="mt-2 w-full rounded-lg border border-[#c5a059]/30 text-[#c5a059] text-[10px] uppercase tracking-widest py-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={reviewLoading || !reviewAllowed}
                    onClick={handleReviewSubmit}
                  >
                    {reviewLoading ? "Submitting..." : "Submit Review"}
                  </button>
                  {!reviewAllowed && reviewGateMessage && (
                    <p className="mt-2 text-[11px] text-red-300">{reviewGateMessage}</p>
                  )}
                </div>
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
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed" 
                        : "bg-[#c5a059] text-[#1a1510] hover:bg-white hover:text-black shadow-lg hover:shadow-[#c5a059]/50"
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

export default function ShopPageClient() {
  return <ShopPageContent />;
}
