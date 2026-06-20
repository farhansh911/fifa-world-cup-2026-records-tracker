function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local as https://YOUR-PROJECT.supabase.co"
    );
  }

  if (/^https?:\/\//i.test(raw)) {
    return raw.replace(/\/+$/, "");
  }

  // Support project ref only (e.g. fwkhfablwwmosffddtxf)
  if (/^[a-z0-9-]+$/i.test(raw)) {
    return `https://${raw}.supabase.co`;
  }

  throw new Error(
    `Invalid NEXT_PUBLIC_SUPABASE_URL "${raw}". Use https://YOUR-PROJECT.supabase.co from Supabase → Project Settings → API`
  );
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy the anon public key from Supabase → Project Settings → API"
    );
  }

  if (!key.startsWith("eyJ")) {
    throw new Error(
      "Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY. It must be the long anon public JWT from Supabase → Project Settings → API (starts with eyJ...)"
    );
  }

  return key;
}

export function getSupabaseEnv() {
  return {
    url: getSupabaseUrl(),
    anonKey: getSupabaseAnonKey(),
  };
}
