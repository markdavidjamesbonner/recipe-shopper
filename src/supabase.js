import { createClient } from '@supabase/supabase-js'

// Use your project's API URL (Project URL in Supabase Dashboard → Settings → API)
// It should look like: https://XXXXXXXX.supabase.co
const supabaseUrl = 'https://dmhlsmuglhctivvbonnu.supabase.co'
// Use the "anon" / "public" key from the same API settings (not the dashboard page URL)
const supabaseKey = 'sb_publishable_-1uLArLi--KJQx0StKUl3w_z_atv_CD'

export const supabase = createClient(supabaseUrl, supabaseKey)
