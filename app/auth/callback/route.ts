import { type NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return redirect(next)
        }

        // Fallback: Check if session already exists (handling race conditions/double requests)
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            console.log('Session already exists, redirecting despite error:', error?.message)
            return redirect(next)
        }

        console.error('Auth error:', error)
        return redirect(`/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
    }

    // return the user to an error page with instructions
    redirect('/auth/auth-code-error?error=No+code+provided')
}
