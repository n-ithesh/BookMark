'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function AuthErrorContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const error = searchParams.get('error')
    const errorMessage = error
        ? decodeURIComponent(error)
        : "There was a problem signing you in. This could be due to an expired link or a cancelled login attempt."

    useEffect(() => {
        const checkSession = async () => {
            const supabase = createClient()
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                // If session exists, it was likely a race condition error. Redirect to dashboard.
                router.replace('/')
            }
        }
        checkSession()
    }, [router])

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-sm text-center">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-destructive">Authentication Error</CardTitle>
                    <CardDescription>
                        {errorMessage}
                    </CardDescription>
                </CardHeader>
                <CardFooter className="flex justify-center">
                    <Button asChild>
                        <Link href="/">Try Again</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

export default function AuthError() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
            <AuthErrorContent />
        </Suspense>
    )
}
