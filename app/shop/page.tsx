import { Suspense } from "react";
import ShopPageClient from "./ShopPageClient";
import { Loader2 } from "lucide-react";

export default function ShopPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f0505] text-[#c5a059]">
          <Loader2 className="animate-spin w-12 h-12 mb-4" />
          <p className="font-heading tracking-[0.3em] uppercase text-sm">Opening ...</p>
        </div>
      }
    >
      <ShopPageClient />
    </Suspense>
  );
}
