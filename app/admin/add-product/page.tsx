"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { isAdminEmail } from "@/lib/admin";
import { useRouter } from "next/navigation";
import { Loader2, Upload, IndianRupee, Tag, FileText, ArrowLeft, Plus, Trash2, X, Layers, Palette, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

// Define Variant Structure
type ProductVariant = {
  id: string;
  color: string;
  stock: number;
  images: File[];
};

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Basic Info
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  
  // Category Management
  const [categories, setCategories] = useState<string[]>(["Bridal Wear", "Phulkari Suits", "Modern Fusion", "Accessories"]);
  const [category, setCategory] = useState("Bridal Wear");
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState("");

  // Variants Management (Colors, Stock, Multiple Images)
  const [variants, setVariants] = useState<ProductVariant[]>([
    { id: 'default', color: '', stock: 1, images: [] }
  ]);

  // SECURITY CHECK & FETCH CATEGORIES
  useEffect(() => {
    const initPage = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const allowed = await isAdminEmail(user?.email);

      if (!user || !allowed) {
        alert("Restricted Area: You are not authorized to access the Royal Court.");
        router.push("/"); 
        return;
      }

      const { data: products } = await supabase.from('products').select('category');
      if (products) {
        const uniqueCategories = Array.from(new Set(products.map(p => p.category))).filter(Boolean) as string[];
        setCategories(prev => Array.from(new Set([...prev, ...uniqueCategories])));
      }
    };
    initPage();
  }, [router]);

  // --- Category Handlers ---
  const handleAddCategory = () => {
    if (!newCategoryInput.trim()) return;
    const formattedCat = newCategoryInput.trim();
    setCategories(prev => [...prev, formattedCat]);
    setCategory(formattedCat); 
    setNewCategoryInput("");
    setIsAddingNewCategory(false);
  };

  const handleDeleteCategory = () => {
    if (confirm(`Are you sure you want to remove "${category}" from the list?`)) {
      const newList = categories.filter(c => c !== category);
      setCategories(newList);
      setCategory(newList[0] || "");
    }
  };

  // --- Variant Handlers ---
  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), color: '', stock: 1, images: [] }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length === 1) {
      alert("You must have at least one product option.");
      return;
    }
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    setVariants(newVariants);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    // @ts-ignore
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const handleImageUpload = (index: number, files: FileList | null) => {
    if (!files) return;
    const newImages = Array.from(files);
    const currentVariant = variants[index];
    // Append new images to existing ones
    updateVariant(index, 'images', [...currentVariant.images, ...newImages]);
  };

  const removeImage = (variantIndex: number, imageIndex: number) => {
    const newVariants = [...variants];
    newVariants[variantIndex].images.splice(imageIndex, 1);
    setVariants(newVariants);
  };

  // --- Main Submission ---
  const handleAddItem = async () => {
    // Basic Validation
    if (!name || !price || !category) {
      alert("Please fill in basic product details.");
      return;
    }
    // Variant Validation
    for (const v of variants) {
      if (variants.length > 1 && !v.color) {
        alert("Please specify a color name for all options.");
        return;
      }
      if (v.images.length === 0) {
        alert(`Please upload at least one image for ${v.color || 'the product'}.`);
        return;
      }
    }

    setLoading(true);

    try {
      const uploadedVariants = [];
      let mainImageUrl = "";
      let totalStock = 0;

      // 1. Upload Images for each variant
      for (const variant of variants) {
        const uploadedUrls = [];
        
        for (const file of variant.images) {
          const fileExt = file.name.split('.').pop();
          const fileName = `product_${Date.now()}_${Math.random()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from('products')
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('products')
            .getPublicUrl(fileName);
          
          uploadedUrls.push(publicUrl);
        }

        // Set main image (Thumbnail) to the first image of the first variant
        if (!mainImageUrl && uploadedUrls.length > 0) {
          mainImageUrl = uploadedUrls[0];
        }

        totalStock += Number(variant.stock);

        uploadedVariants.push({
          color: variant.color || "Standard",
          stock: Number(variant.stock),
          images: uploadedUrls
        });
      }

      // 2. Insert into Database
      const { error: dbError } = await supabase
        .from('products')
        .insert([{
          name,
          price: parseFloat(price),
          category,
          description,
          // Legacy fields for backward compatibility
          stock: totalStock,
          image_url: mainImageUrl,
          // New Advanced Field (Requires 'variants' column in DB)
          variants: uploadedVariants 
        }]);

      if (dbError) throw dbError;

      alert("Treasure added successfully!");
      router.push("/shop");

    } catch (error: any) {
      alert("Error adding product: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-royal-maroon bg-[url('/royal-pattern-dark.png')] bg-blend-multiply p-6 flex justify-center items-center relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] bg-royal-gold rounded-full blur-[180px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[600px] h-[600px] bg-royal-maroon rounded-full blur-[180px] opacity-30 pointer-events-none"></div>

      <div className="max-w-4xl w-full bg-[#1a1510] p-10 rounded-2xl shadow-2xl border-2 border-royal-gold relative z-10">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-10 border-b-2 border-royal-gold/50 pb-6">
          <Link href="/admin" className="text-royal-gold/70 hover:text-royal-gold transition-all duration-300 hover:scale-110">
            <ArrowLeft size={28} />
          </Link>
          <h1 className="text-3xl font-heading font-bold text-royal-gold tracking-wider drop-shadow-md">Add New Treasure</h1>
        </div>

        <div className="space-y-8">
          
          {/* --- SECTION 1: BASIC INFO --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Name */}
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-royal-gold mb-3 font-bold ml-1">Product Name</label>
              <div className="flex items-center border-2 border-royal-gold/50 rounded-lg px-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
                <Tag size={20} className="text-royal-gold/70 mr-3" />
                <input 
                  type="text" 
                  placeholder="e.g. Maharani Velvet Shawl" 
                  className="w-full p-4 bg-transparent outline-none font-body text-royal-cream placeholder:text-royal-gold/40"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs uppercase tracking-[0.2em] text-royal-gold mb-3 font-bold ml-1">Price (INR)</label>
              <div className="flex items-center border-2 border-royal-gold/50 rounded-lg px-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
                <IndianRupee size={20} className="text-royal-gold/70 mr-3" />
                <input 
                  type="number" 
                  placeholder="15000" 
                  className="w-full p-4 bg-transparent outline-none font-body text-royal-cream placeholder:text-royal-gold/40"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-royal-gold mb-3 font-bold ml-1">Category</label>
            {isAddingNewCategory ? (
              <div className="flex gap-2">
                <div className="flex-1 border-2 border-royal-gold/50 rounded-lg px-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
                  <input 
                    type="text" 
                    placeholder="Enter new category..." 
                    className="w-full p-4 bg-transparent outline-none font-body text-royal-cream placeholder:text-royal-gold/40"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    autoFocus
                  />
                </div>
                <button onClick={handleAddCategory} className="bg-green-700 hover:bg-green-600 text-white p-4 rounded-lg border border-royal-gold/30"><Plus size={20} /></button>
                <button onClick={() => setIsAddingNewCategory(false)} className="bg-red-700 hover:bg-red-600 text-white p-4 rounded-lg border border-royal-gold/30"><X size={20} /></button>
              </div>
            ) : (
              <div className="flex gap-2">
                <div className="flex-1 border-2 border-royal-gold/50 rounded-lg px-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
                  <select 
                    className="w-full p-4 bg-transparent outline-none font-body text-royal-cream appearance-none cursor-pointer"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23c5a059' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 1rem center`, backgroundRepeat: `no-repeat`, backgroundSize: `1.5em 1.5em`}}
                  >
                    {categories.map((cat, idx) => (
                      <option key={idx} value={cat} className="bg-[#1a1510] text-royal-gold">{cat}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => setIsAddingNewCategory(true)} className="bg-royal-maroon hover:bg-royal-gold hover:text-[#1a1510] text-royal-gold p-4 rounded-lg border border-royal-gold/30 transition-colors"><Plus size={20} /></button>
                <button onClick={handleDeleteCategory} className="bg-[#2a1010] hover:bg-red-900 text-red-400 p-4 rounded-lg border border-royal-gold/30 transition-colors"><Trash2 size={20} /></button>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs uppercase tracking-[0.2em] text-royal-gold mb-3 font-bold ml-1">Description</label>
            <div className="border-2 border-royal-gold/50 rounded-lg p-4 bg-[#251d16] focus-within:border-royal-gold focus-within:ring-1 focus-within:ring-royal-gold/50 transition-all duration-300">
              <textarea 
                rows={4}
                placeholder="Describe the fabric, embroidery, and history..." 
                className="w-full bg-transparent outline-none font-body resize-none text-royal-cream placeholder:text-royal-gold/40"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* --- SECTION 2: VARIANTS (Color & Images) --- */}
          <div className="border-t-2 border-royal-gold/20 pt-8 mt-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-heading text-royal-gold font-bold">Colors & Imagery</h2>
              <button onClick={addVariant} className="text-xs uppercase font-bold tracking-widest text-royal-gold hover:text-white flex items-center gap-2 border border-royal-gold/50 px-3 py-2 rounded-lg hover:bg-royal-gold/10">
                <Plus size={16} /> Add Color Option
              </button>
            </div>

            <div className="space-y-6">
              {variants.map((variant, index) => (
                <div key={variant.id} className="bg-black/30 border border-royal-gold/30 p-6 rounded-xl relative group">
                  {variants.length > 1 && (
                    <button 
                      onClick={() => removeVariant(index)}
                      className="absolute top-4 right-4 text-red-500 hover:text-red-300 opacity-50 hover:opacity-100 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Color Input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Color Name</label>
                      <div className="flex items-center border border-royal-gold/30 rounded px-3 bg-[#1a1510] focus-within:border-royal-gold transition">
                        <Palette size={16} className="text-royal-gold/50 mr-2" />
                        <input 
                          type="text" 
                          placeholder="e.g. Royal Red" 
                          className="w-full p-2 bg-transparent outline-none text-royal-cream text-sm"
                          value={variant.color}
                          onChange={(e) => updateVariant(index, 'color', e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Stock Input */}
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Stock Quantity</label>
                      <div className="flex items-center border border-royal-gold/30 rounded px-3 bg-[#1a1510] focus-within:border-royal-gold transition">
                        <Layers size={16} className="text-royal-gold/50 mr-2" />
                        <input 
                          type="number" 
                          placeholder="1" 
                          className="w-full p-2 bg-transparent outline-none text-royal-cream text-sm"
                          value={variant.stock}
                          onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multi-Image Upload */}
                  <div>
                    <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Upload Photos (Multiple)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {/* Upload Box */}
                      <div className="aspect-square border-2 border-dashed border-royal-gold/30 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-royal-gold/5 hover:border-royal-gold transition relative">
                        <input 
                          type="file" 
                          accept="image/*"
                          multiple
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => handleImageUpload(index, e.target.files)}
                        />
                        <Upload size={24} className="text-royal-gold/50 mb-1" />
                        <span className="text-[10px] text-royal-gold/50 uppercase">Add Images</span>
                      </div>

                      {/* Preview Images */}
                      {variant.images.map((file, imgIdx) => (
                        <div key={imgIdx} className="aspect-square bg-black rounded-lg border border-royal-gold/20 relative overflow-hidden group/img">
                          <img 
                            src={URL.createObjectURL(file)} 
                            alt="preview" 
                            className="w-full h-full object-cover opacity-80 group-hover/img:opacity-100 transition"
                          />
                          <button 
                            onClick={() => removeImage(index, imgIdx)}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button 
            onClick={handleAddItem}
            disabled={loading}
            className="w-full bg-gradient-to-r from-royal-maroon to-[#3d0a15] text-royal-gold py-5 font-heading font-bold uppercase tracking-[0.3em] hover:from-royal-gold hover:to-[#8c6d36] hover:text-[#1a1510] transition-all duration-500 rounded-xl shadow-lg hover:shadow-royal-gold/30 flex justify-center items-center gap-3 disabled:opacity-70 border border-royal-gold/50 mt-8 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? <Loader2 className="animate-spin w-6 h-6" /> : "Publish to Treasury"}
            </span>
            <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-royal-gold/40 to-transparent -translate-x-[100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
          </button>

        </div>
      </div>
    </div>
  );
}
