'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function addBookmark(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get('title') as string
    const url = formData.get('url') as string

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase.from('bookmarks').insert({
        title,
        url,
        user_id: user.id,
    })

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/')
}

export async function deleteBookmark(id: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('User not authenticated')
    }

    const { error } = await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', user.id)

    if (error) {
        throw new Error(error.message)
    }

    revalidatePath('/')
}

export async function loginWithGoogle() {
    const supabase = await createClient()

    // Dynamically determine the origin
    const headersList = await headers()
    const host = headersList.get('host')
    const protocol = headersList.get('x-forwarded-proto') ?? 'http'
    const origin = `${protocol}://${host}`

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })

    if (error) {
        console.error(error)
        throw error
    }

    if (data.url) {
        redirect(data.url)
    }
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/')
}
