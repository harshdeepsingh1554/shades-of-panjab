import { supabase } from "@/lib/supabase";

export type AdminRecord = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  created_at: string;
};

export async function isAdminEmail(email?: string | null) {
  if (!email) return false;
  const { data, error } = await supabase
    .from("admins")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export async function fetchAdmins() {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: (data || []) as AdminRecord[], error };
}
