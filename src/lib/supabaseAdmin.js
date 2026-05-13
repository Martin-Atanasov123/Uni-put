import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: true, autoRefreshToken: true } }
)
