"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ShoppingBag, User, Menu, Camera, X, Search, PhoneCall, MapPin } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useState, useEffect, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";

const quickLinks = [
  { label: "New Arrivals", href: "/shop" },
  { label: "Hazuriya", href: "/shop?category=Hazuriya" },
  { label: "Kurta Sets", href: "/shop?category=Kurta" },
  { label: "Turbans", href: "/shop?category=Turban" },
  { label: "Accessories", href: "/shop?category=Accessories" },
  { label: "Custom Order", href: "/custom-request" },
];

export default function Navbar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { cart } = useCart();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // 1. Check if the current user is an Admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = await isAdminEmail(user?.email);
      setIsAdmin(allowed);
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdmin();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. Scroll Effect Logic
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const currentSearch = searchParams.get("search") ?? "";
    setSearchTerm(currentSearch);
  }, [searchParams]);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchTerm.trim();
    const params = new URLSearchParams();
    const activeCategory = searchParams.get("category");

    if (activeCategory) {
      params.set("category", activeCategory);
    }
    if (trimmed) {
      params.set("search", trimmed);
    }

    const query = params.toString();
    router.push(query ? `/shop?${query}` : "/shop");
    setIsMobileOpen(false);
  };

  return (
    <nav
      className={`sticky top-0 z-[100] transition-all duration-500 ease-in-out border-b ${
        isScrolled
          ? "bg-[#0f0505]/95 backdrop-blur-md border-[#c5a059]/40 shadow-2xl"
          : "bg-[#0f0505] border-[#c5a059]/20 shadow-lg"
      }`}
    >
      {/* Utility Bar */}
      <div className="hidden md:block border-b border-[#c5a059]/10 bg-[#120708]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 text-[11px] uppercase tracking-widest text-[#fbf5e9]/70 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline">Free shipping over INR 1999</span>
            <span className="hidden sm:inline">Easy returns within 7 days</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><PhoneCall size={12} /> Support: 10am - 8pm</span>
            <span className="flex items-center gap-1"><MapPin size={12} /> Punjab/JSR , India</span>
          </div>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 md:h-20 items-center gap-4">
          {/* Logo */}
          <Link href="/" className="text-lg md:text-2xl lg:text-3xl font-heading font-bold text-[#c5a059] tracking-widest hover:text-white transition-colors truncate">
            SHADES OF PUNJAB
          </Link>

          {/* Desktop Search */}
          <div className="hidden md:flex flex-1 justify-center">
            <form
              onSubmit={handleSearchSubmit}
              className="w-full max-w-2xl flex items-stretch bg-[#1a0f0f] border border-[#c5a059]/30 rounded-full overflow-hidden shadow-inner"
            >
              <div className="hidden sm:flex items-center px-4 text-[11px] uppercase tracking-widest text-[#fbf5e9]/60 border-r border-[#c5a059]/20">All</div>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search products, categories, artisans"
                className="flex-1 bg-transparent px-4 py-2 text-sm text-[#fbf5e9] placeholder:text-[#fbf5e9]/40 outline-none"
              />
              <button
                type="submit"
                className="px-5 bg-[#c5a059] text-[#0f0505] hover:bg-[#d6b068] transition"
                aria-label="Search"
              >
                <Search size={18} />
              </button>
            </form>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4 md:space-x-6 text-[#c5a059]">
            <Link href="/cart" className="relative hover:text-white transition">
              <ShoppingBag size={22} className="md:w-6 md:h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#c5a059] text-[#0f0505] text-[10px] font-bold rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </Link>

            <Link href="/profile" className="hover:text-white transition">
              <User size={22} className="md:w-6 md:h-6" />
            </Link>

            {/* Mobile Menu Button - Toggles between Menu and X icon */}
            <button onClick={() => setIsMobileOpen(!isMobileOpen)} className="md:hidden text-[#c5a059] hover:text-white transition p-1">
              {isMobileOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden pb-4">
          <form
            onSubmit={handleSearchSubmit}
            className="w-full flex items-stretch bg-[#1a0f0f] border border-[#c5a059]/30 rounded-full overflow-hidden"
          >
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search products and categories"
              className="flex-1 bg-transparent px-4 py-2 text-sm text-[#fbf5e9] placeholder:text-[#fbf5e9]/40 outline-none"
            />
            <button type="submit" className="px-4 bg-[#c5a059] text-[#0f0505]" aria-label="Search">
              <Search size={18} />
            </button>
          </form>
        </div>
      </div>

      {/* Category Strip */}
      <div className="hidden md:block border-t border-[#c5a059]/10 bg-[#120708]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 overflow-x-auto">
          {quickLinks.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-xs uppercase tracking-widest text-[#fbf5e9]/80 hover:text-[#c5a059] border border-[#c5a059]/20 px-3 py-1.5 rounded-full transition"
            >
              {item.label}
            </Link>
          ))}

          {/* Admin Link - Only visible if isAdmin is true */}
          {isAdmin && (
            <Link href="/admin" className="ml-auto text-[#c5a059] text-xs font-bold border border-[#c5a059] px-3 py-1.5 uppercase tracking-widest rounded-full hover:bg-[#c5a059] hover:text-[#0f0505] transition">
              Admin Panel
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileOpen && (
        <div className="md:hidden bg-[#0f0505] border-t border-[#c5a059]/20 fixed w-full left-0 top-[64px] h-[calc(100vh-64px)] z-50 p-6 flex flex-col gap-6 overflow-y-auto shadow-2xl animate-in slide-in-from-top-5 duration-300">
          <Link href="/shop" className="text-[#fbf5e9] text-lg uppercase tracking-widest font-bold border-b border-[#c5a059]/10 pb-4 hover:text-[#c5a059] transition" onClick={() => setIsMobileOpen(false)}>
            The Collection
          </Link>
          <Link href="/custom-request" className="text-[#fbf5e9] text-lg uppercase tracking-widest font-bold border-b border-[#c5a059]/10 pb-4 hover:text-[#c5a059] transition flex items-center gap-2" onClick={() => setIsMobileOpen(false)}>
            <Camera size={20} className="text-[#c5a059]" /> Custom Order
          </Link>

          {isAdmin && (
            <Link href="/admin" className="text-[#c5a059] text-lg uppercase tracking-widest font-bold border border-[#c5a059] p-3 text-center rounded hover:bg-[#c5a059] hover:text-[#0f0505] transition" onClick={() => setIsMobileOpen(false)}>
              Admin Panel
            </Link>
          )}

          {/* Added Cart/Profile Links to Menu for easier access */}
          <div className="mt-auto border-t border-[#c5a059]/20 pt-6 flex justify-around">
            <Link href="/cart" onClick={() => setIsMobileOpen(false)} className="flex flex-col items-center gap-1 text-[#fbf5e9] hover:text-[#c5a059]">
              <ShoppingBag size={24} /> <span className="text-xs uppercase tracking-widest">Cart ({cart.length})</span>
            </Link>
            <Link href="/profile" onClick={() => setIsMobileOpen(false)} className="flex flex-col items-center gap-1 text-[#fbf5e9] hover:text-[#c5a059]">
              <User size={24} /> <span className="text-xs uppercase tracking-widest">Profile</span>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
