
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey)
} else {
    console.error('Missing Supabase URL or Anon Key. Authentication will not work.')
    // Mock client to prevent crash
    supabaseInstance = {
        auth: {
            getSession: () => Promise.resolve({ data: { session: null } }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } }),
            signInWithOAuth: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
            signInWithOtp: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
            signOut: () => Promise.resolve({ error: null }),
            updateUser: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } }),
                    single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: { message: 'Supabase not configured' } })
                })
            }),
            insert: () => Promise.resolve({ error: { message: 'Supabase not configured' } }),
            delete: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) }),
            update: () => ({ eq: () => Promise.resolve({ error: { message: 'Supabase not configured' } }) })
        })
    }
}

export const supabase = supabaseInstance
