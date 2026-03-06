import { createClient } from '@supabase/supabase-js'
import { Database } from '@/lib/definitions/supabase'

export function createAdminClient() {
	const supabaseUrl = process.env.SUPABASE_URL
	const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

	if (!supabaseUrl || !supabaseServiceKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
		// Fallback/Error handling: if keys are missing, we can't create an admin client.
		// However, throwing might crash the endpoint if not caught. 
		// Allowing it to throw so it's visible in Vercel logs is better than silent failure.
		throw new Error('Supabase Service Credentials Missing')
	}

	return createClient<Database>(supabaseUrl, supabaseServiceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	})
}
