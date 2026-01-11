"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AdminRecord, fetchAdmins, isAdminEmail } from "@/lib/admin";
import { ArrowLeft, Loader2, PlusCircle, Trash2, Shield, Phone, Mail, User } from "lucide-react";

export default function AdminRegistry() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admins, setAdmins] = useState<AdminRecord[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentEmail, setCurrentEmail] = useState("");
  const router = useRouter();
  const SUPER_ADMINS = ["7903379968@shades.local", "6205218556@shades.local"];

  const cleanPhone = useMemo(() => phone.replace(/\D/g, ""), [phone]);
  const generatedEmail = cleanPhone ? `${cleanPhone}@shades.local` : "";
  const canManageAdmins = SUPER_ADMINS.includes(currentEmail);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentEmail(user?.email || "");
      const allowed = await isAdminEmail(user?.email);

      if (!user || !allowed) {
        alert("Restricted Area: Admins Only.");
        router.push("/");
        return;
      }

      await loadAdmins();
      setLoading(false);
    };
    init();
  }, [router]);

  const loadAdmins = async () => {
    const { data, error } = await fetchAdmins();
    if (error) {
      alert("Failed to load admins: " + error.message);
      return;
    }
    setAdmins(data);
  };

  const handleAddAdmin = async () => {
    if (!canManageAdmins) return alert("Only authorized admins can manage access.");
    if (!cleanPhone) return alert("Please enter a valid phone number.");
    if (!generatedEmail) return;

    setSaving(true);
    const { error } = await supabase.from("admins").insert([{
      name: name.trim() ? name.trim() : null,
      phone: cleanPhone,
      email: generatedEmail,
    }]);

    if (error) {
      alert("Failed to add admin: " + error.message);
    } else {
      setName("");
      setPhone("");
      await loadAdmins();
    }
    setSaving(false);
  };

  const handleDeleteAdmin = async (id: number) => {
    if (!canManageAdmins) return alert("Only authorized admins can manage access.");
    if (!confirm("Remove this admin?")) return;
    const { error } = await supabase.from("admins").delete().eq("id", id);
    if (error) {
      alert("Failed to remove admin: " + error.message);
      return;
    }
    await loadAdmins();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-royal-dark flex items-center justify-center text-royal-gold">
        <Loader2 className="animate-spin w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-royal-dark text-royal-cream p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8 border-b border-royal-gold/30 pb-4">
          <Link href="/admin" className="text-royal-gold/70 hover:text-royal-gold transition-all duration-300 hover:scale-110">
            <ArrowLeft size={26} />
          </Link>
          <div>
            <p className="text-royal-gold uppercase tracking-[0.3em] text-[10px] font-bold">Registry</p>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-white">Admin Access</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] gap-8">
          <div className="bg-[#1a1510] border border-royal-gold/30 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-royal-gold/10 flex items-center justify-center border border-royal-gold/30">
                <Shield className="text-royal-gold" size={22} />
              </div>
              <div>
                <p className="text-royal-gold/70 uppercase tracking-[0.2em] text-[10px] font-bold">Add Admin</p>
                <h2 className="text-lg font-heading text-white">Invite to Royal Court</h2>
              </div>
            </div>

            <div className="space-y-5">
              {!canManageAdmins && (
                <div className="text-xs text-royal-gold/70 border border-royal-gold/20 bg-black/40 rounded-lg p-3">
                  Only 7903379968 and 6205218556 can add or remove admins.
                </div>
              )}
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Full Name (Optional)</label>
                <div className="flex items-center border border-royal-gold/30 rounded-lg px-3 bg-[#251d16] focus-within:border-royal-gold transition">
                  <User size={16} className="text-royal-gold/50 mr-2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-3 bg-transparent outline-none text-royal-cream text-sm"
                    placeholder="e.g. Harsh Deep Singh"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Phone (Login)</label>
                <div className="flex items-center border border-royal-gold/30 rounded-lg px-3 bg-[#251d16] focus-within:border-royal-gold transition">
                  <Phone size={16} className="text-royal-gold/50 mr-2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-3 bg-transparent outline-none text-royal-cream text-sm"
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-royal-gold/70 mb-2 font-bold">Generated Admin Email</label>
                <div className="flex items-center border border-royal-gold/20 rounded-lg px-3 bg-black/40">
                  <Mail size={16} className="text-royal-gold/40 mr-2" />
                  <input
                    type="text"
                    value={generatedEmail || "Enter phone to generate"}
                    readOnly
                    className="w-full p-3 bg-transparent outline-none text-royal-cream/70 text-sm"
                  />
                </div>
              </div>

              <button
                onClick={handleAddAdmin}
                disabled={saving || !canManageAdmins}
                className="w-full bg-royal-gold text-black py-3 rounded-lg font-heading font-bold uppercase tracking-[0.2em] text-xs hover:bg-white transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {saving ? <Loader2 className="animate-spin" size={16} /> : <PlusCircle size={16} />}
                {saving ? "Adding..." : "Add Admin"}
              </button>
            </div>
          </div>

          <div className="bg-[#1a1510] border border-royal-gold/30 rounded-2xl p-6 md:p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-royal-gold/10 flex items-center justify-center border border-royal-gold/30">
                <Shield className="text-royal-gold" size={22} />
              </div>
              <div>
                <p className="text-royal-gold/70 uppercase tracking-[0.2em] text-[10px] font-bold">Active</p>
                <h2 className="text-lg font-heading text-white">Royal Court Members</h2>
              </div>
            </div>

            {admins.length === 0 ? (
              <div className="text-center text-royal-gold/50 text-sm border border-dashed border-royal-gold/20 rounded-xl p-6">
                No admins registered yet.
              </div>
            ) : (
              <div className="space-y-4">
                {admins.map((admin) => {
                      const isSelf = admin.email === currentEmail;
                      const isProtected = !canManageAdmins || isSelf;
                      return (
                        <div key={admin.id} className="bg-black/30 border border-royal-gold/20 rounded-xl p-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-white font-bold text-sm">{admin.name || "Admin"}</p>
                        <p className="text-royal-gold/70 text-xs">{admin.email}</p>
                        <p className="text-royal-cream/60 text-xs mt-1">Phone: {admin.phone || "N/A"}</p>
                      </div>
                        <button
                          onClick={() => handleDeleteAdmin(admin.id)}
                          disabled={isProtected}
                          title={isSelf ? "You cannot remove your own access" : !canManageAdmins ? "Only authorized admins can manage access" : "Remove admin"}
                          className={`p-2 rounded border transition ${isProtected ? "text-royal-gold/30 border-royal-gold/10 cursor-not-allowed" : "text-red-400 border-red-500/30 hover:bg-red-900/20"}`}
                        >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
