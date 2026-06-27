import {
  createClient,
  type SupabaseClient,
} from "@supabase/supabase-js";

export class SupabaseAdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseAdminConfigError";
  }
}

let adminClient: SupabaseClient | null = null;

export function getSupabaseAdminClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new SupabaseAdminConfigError(
      "Supabase admin client can only be used on the server.",
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new SupabaseAdminConfigError(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to the server environment.",
    );
  }

  if (!serviceRoleKey) {
    throw new SupabaseAdminConfigError(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to the server environment before using server-side Supabase sync.",
    );
  }

  adminClient ??= createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
