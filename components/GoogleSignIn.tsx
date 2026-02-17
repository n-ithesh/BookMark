'use client'

import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'

export default function GoogleSignIn() {
    const supabase = createClient()

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        })
    }

    return (
        <Button onClick={handleLogin} className="w-full" variant="outline">
            Sign in with Google
        </Button>
    )
}
