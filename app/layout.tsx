import type { Metadata } from "next";
import { Cinzel, Lato } from "next/font/google"; // Import regal fonts
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import { Suspense } from "react";
import { CartProvider } from "@/context/CartContext";

// 1. Configure the Fonts
const cinzel = Cinzel({ 
  subsets: ["latin"], 
  variable: '--font-cinzel',
  display: 'swap',
});

const lato = Lato({ 
  weight: ['400', '700'],
  subsets: ["latin"], 
  variable: '--font-lato',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Shades of Punjab | Royal Attire",
  description: "Traditional Elegance inspired by the Golden Era",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${cinzel.variable} ${lato.variable} bg-royal-cream text-royal-dark font-body`}>
        <CartProvider>
          {/* We wrap the Navbar to ensure it sits on top of the texture */}
          <div className="relative min-h-screen bg-royal-pattern">
             <Suspense fallback={null}>
               <Navbar /> 
             </Suspense>
             <main className="min-h-screen">
               {children}
             </main>
             
             {/* Ornamental Footer Strip */}
             <footer className="bg-royal-maroon text-royal-gold py-6 text-center border-t-4 border-royal-gold">
               <p className="font-heading tracking-widest text-sm">EST. 2024 • SHADES OF PUNJAB</p>
             </footer>
          </div>
        </CartProvider>
      </body>
    </html>
  );
}
