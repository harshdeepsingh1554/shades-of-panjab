"use client";
import Link from "next/link";
import {
  ArrowRight,
  Star,
  Loader2,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RefreshCcw,
  BadgeCheck,
  Tag,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// Define Product Type
type Product = {
  id: number;
  name: string;
  price: number;
  image_url: string;
  category: string;
  description?: string;
};

const serviceHighlights = [
  {
    icon: Truck,
    title: "Fast Delivery",
    detail: "Dispatch in 24-48 hours for ready items",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    detail: "Pay and Share Screen Shot safely",
  },
  {
    icon: RefreshCcw,
    title: "Easy Querry",
    detail: "Contact us on Instagram or WhatsApp",
  },
  {
    icon: BadgeCheck,
    title: "Trending Styles",
    detail: "Curated collections for modern tastes",
  },
];

const categoryTiles = [
  {
    title: "hazuriya",
    image:
      "https://xplbznfkpfxumynuoltl.supabase.co/storage/v1/object/public/banners/sherwani.png",
    category: "Hazuriya ",
  },
  {
    title: "Festive Kurta Sets",
    image:
      "https://xplbznfkpfxumynuoltl.supabase.co/storage/v1/object/public/banners/kurta.png",
    category: "Kurta",
  },
  {
    title: "Turbans",
    image:
      "https://xplbznfkpfxumynuoltl.supabase.co/storage/v1/object/public/banners/turban.png",
    category: "Turban",
  },
];

export default function Home() {
  const [latestProducts, setLatestProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dealProduct, setDealProduct] = useState<Product | null>(null);
  const [dealLoading, setDealLoading] = useState(true);

  // Fetch the 3 newest products and the current deal
  useEffect(() => {
    async function fetchHomeData() {
      const [
        { data: latestData, error: latestError },
        { data: dealRow, error: dealError },
      ] = await Promise.all([
        supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase
          .from("products")
          .select("id,name,price,image_url,category,description")
          .eq("is_deal_of_day", true)
          .maybeSingle(),
      ]);

      if (!latestError && latestData) {
        setLatestProducts(latestData);
      }

      if (!dealError && dealRow) {
        setDealProduct(dealRow as Product);
      }

      setLoading(false);
      setDealLoading(false);
    }
    fetchHomeData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#13060b] via-[#1a0f0f] to-[#0f0505]">
      {/* HERO SECTION */}
      <section className="relative h-[70vh] sm:h-[75vh] md:h-[85vh] min-h-[460px] sm:min-h-[520px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://xplbznfkpfxumynuoltl.supabase.co/storage/v1/object/public/banners/banner.png')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-black/35 md:bg-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#13060b]/60 via-transparent to-black/40" />
        </div>

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto flex flex-col items-center justify-center h-full pt-16">
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-[#fbf5e9] mb-6 tracking-wide drop-shadow-2xl">
                                            
          </h1>
          <p className="text-[#fbf5e9]/80 max-w-2xl mb-8 text-sm sm:text-base md:text-lg">
                                              
          </p>

          <div className="mt-15 flex flex-col sm:flex-row items-center gap-4">
            <Link 
              href="/shop"
              className="group relative inline-flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 border-2 border-[#c5a059] text-[#c5a059] font-heading uppercase tracking-widest text-xs md:text-sm hover:bg-[#c5a059] hover:text-[#2a0a12] transition-all duration-300 bg-black/30 backdrop-blur-sm shadow-lg"
            >
              Shop the Collection
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/custom-request"
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3 md:px-10 md:py-4 border border-[#fbf5e9]/40 text-[#fbf5e9] uppercase tracking-widest text-xs md:text-sm hover:border-[#c5a059] hover:text-[#c5a059] transition"
            >
              Custom Order
            </Link>
          </div>

          <div className="mt-4 sm:mt-1 flex flex-wrap justify-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] uppercase tracking-widest text-[#fbf5e9]/70">
            <span className="px-4 py-2 border border-[#fbf5e9]/20 rounded-full w-full sm:w-auto text-center">2,000+ customers</span>
            <span className="px-4 py-2 border border-[#fbf5e9]/20 rounded-full w-full sm:w-auto text-center">Made in Punjab</span>
            <span className="px-4 py-2 border border-[#fbf5e9]/20 rounded-full w-full sm:w-auto text-center">Trusted by wedding stylists</span>
          </div>
        </div>
      </section>

      {/* SERVICE HIGHLIGHTS */}
      <section className="py-8 sm:py-10 md:py-14 px-4 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {serviceHighlights.map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-[#1a0f0f] border border-[#c5a059]/20 rounded-xl px-5 py-6 shadow-lg"
            >
              <item.icon className="w-7 h-7 text-[#c5a059]" />
              <div>
                <p className="text-[#fbf5e9] font-heading text-sm uppercase tracking-widest">{item.title}</p>
                <p className="text-[#fbf5e9]/60 text-xs mt-1">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED COLLECTIONS */}
      <section className="py-8 sm:py-8 sm:py-10 md:py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 text-[#c5a059] uppercase tracking-[0.35em] text-xs">
              <Star className="w-4 h-4" fill="currentColor" /> New royal arrivals
            </div>
            <h2 className="text-3xl md:text-4xl font-heading text-[#fbf5e9] mt-2">Handpicked for the season</h2>
            <p className="text-[#fbf5e9]/70 text-sm md:text-base mt-2">
              Fresh releases curated for modern weddings and festive gatherings.
            </p>
          </div>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 text-[#c5a059] uppercase tracking-widest text-xs md:text-sm border border-[#c5a059]/50 px-4 py-2 rounded-full hover:bg-[#c5a059] hover:text-[#0f0505] transition"
          >
            View all
            <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin w-8 h-8 text-[#c5a059]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 md:gap-10">
            {latestProducts.map((product) => (
              <Link
                href="/shop"
                key={product.id}
                className="group block bg-[#1a0f0f] border border-[#c5a059]/30 rounded-2xl overflow-hidden shadow-lg hover:shadow-[#c5a059]/20 transition-all duration-300"
              >
                <div className="relative aspect-[4/3] sm:aspect-[4/5] overflow-hidden bg-black">
                  <img
                    src={product.image_url || "/placeholder.jpg"}
                    alt={product.name}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700 ease-in-out opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f0f] to-transparent opacity-60" />

                  <div className="absolute top-4 left-4 bg-[#c5a059] text-[#1a0f0f] px-3 py-1 text-[10px] uppercase tracking-widest rounded-full">
                    Limited
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[#c5a059] text-[#1a0f0f] p-2.5 rounded-full shadow-lg">
                    <ShoppingBag size={20} />
                  </div>
                </div>

                <div className="p-4 sm:p-6 text-center">
                  <div className="inline-block bg-[#2a0a12] border border-[#c5a059]/30 px-3 py-1 text-[10px] uppercase tracking-widest text-[#c5a059] mb-3 rounded">
                    {product.category}
                  </div>

                  <h3 className="text-lg font-heading font-bold text-[#fbf5e9] mb-2 truncate px-2">
                    {product.name}
                  </h3>
                  <p className="text-[#c5a059] font-body font-bold text-lg">
                    INR {product.price.toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* DEAL OF THE DAY */}
      <section className="py-8 sm:py-10 md:py-16 px-4">
        <div className="max-w-7xl mx-auto w-full bg-[#1a0f0f] border border-[#c5a059]/30 rounded-3xl overflow-hidden shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-0">
            <div className="relative min-h-[240px] sm:min-h-[320px]">
              <img
                src={dealProduct?.image_url || "https://xplbznfkpfxumynuoltl.supabase.co/storage/v1/object/public/banners/deal.png"}
                alt={dealProduct?.name || "Deal of the day"}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0f0505] via-transparent to-transparent" />
            </div>
            <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
              <div className="flex items-center gap-2 text-[#c5a059] uppercase tracking-[0.35em] text-xs">
                <Tag className="w-4 h-4" /> Deal of the day
              </div>
              <h3 className="text-2xl md:text-3xl font-heading text-[#fbf5e9] mt-3">
                {dealProduct?.name || "Royal Maroon Sherwani Set"}
              </h3>
              <p className="text-[#fbf5e9]/70 text-sm md:text-base mt-3">
                {dealProduct?.description || "Tailored for wedding evenings with premium brocade detailing."}
              </p>
              <div className="flex items-center gap-4 mt-6">
                {dealProduct ? (
                  <span className="text-[#c5a059] text-xl font-bold">
                    INR {dealProduct.price.toLocaleString()}
                  </span>
                ) : (
                  <>
                    <span className="text-[#c5a059] text-xl font-bold">INR 18,499</span>
                    <span className="text-[#fbf5e9]/50 line-through text-sm">INR 22,999</span>
                  </>
                )}
              </div>
              <Link
                href="/shop"
                className="mt-6 inline-flex items-center gap-2 w-fit px-6 py-3 bg-[#c5a059] text-[#0f0505] uppercase tracking-widest text-xs font-bold rounded-full hover:bg-[#d6b068] transition"
              >
                {dealLoading && !dealProduct ? "Loading deal..." : "Shop the deal"}
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY CATEGORY */}
      <section className="py-8 sm:py-8 sm:py-10 md:py-16 px-4 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-heading text-[#fbf5e9]">Shop by category</h2>
          <Link
            href="/shop"
            className="text-[#c5a059] uppercase tracking-widest text-xs border-b border-[#c5a059]/50 hover:text-[#d6b068]"
          >
            Browse all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {categoryTiles.map((category) => (
            <Link
              key={category.title}
              href={`/shop?category=${encodeURIComponent(category.category)}`}
              className="group relative min-h-[220px] sm:min-h-[260px] rounded-2xl overflow-hidden border border-[#c5a059]/30 shadow-lg"
            >
              <img
                src={category.image}
                alt={category.title}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0505] via-black/30 to-transparent" />
              <div className="absolute bottom-5 left-5">
                <p className="text-xs uppercase tracking-[0.3em] text-[#c5a059]">Featured</p>
                <h3 className="text-xl font-heading text-[#fbf5e9] mt-2">{category.title}</h3>
                <span className="mt-3 inline-flex items-center gap-2 text-[#fbf5e9] text-xs uppercase tracking-widest">
                  Explore
                  <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* BRAND PROMISE */}
      <section className="bg-[#1a0f0f] text-[#c5a059] py-16 px-6 text-center border-t border-[#c5a059]/10">
        <div className="max-w-3xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-heading mb-6">Shades of Punjab Promise</h3>
          <p className="font-body text-sm sm:text-base md:text-lg leading-relaxed text-[#fbf5e9]/80">
            Every outfit is hand-finished to honor Punjab's royal legacy. Expect precision tailoring, premium fabrics, and service that feels personal.
          </p>
          <div className="mt-8 flex justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
          </div>
        </div>
      </section>
    </div>
  );
}
