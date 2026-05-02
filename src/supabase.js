import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://clytujskrmcnstzuvuaf.supabase.co"
const supabaseKey = "sb_publishable_iTI05LkGPnhWrcwB74-Mug_iOHcZ7xt"

export const supabase = createClient(supabaseUrl, supabaseKey)
