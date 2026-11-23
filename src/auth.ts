import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key);

export async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: window.location.origin },
  });
}

export async function signOut() {
  await supabase.auth.signOut();
  window.localStorage.removeItem("bb_access_token");
  window.localStorage.removeItem("bb_role");
}

export async function restoreSession(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  const session = data.session;
  if (!session) {
    window.localStorage.removeItem("bb_access_token");
    window.localStorage.removeItem("bb_role");
    return null;
  }

  window.localStorage.setItem("bb_access_token", session.access_token);
  const { data: account } = await supabase
    .from("account")
    .select("role")
    .maybeSingle();
  const role = account?.role ?? "customer";
  window.localStorage.setItem("bb_role", role);
  return role;
}
