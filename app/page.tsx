import { createClient } from '@/utils/supabase/server'
import BookmarkManager from '@/components/BookmarkManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginWithGoogle, logout } from '@/actions/bookmarkActions'
import { LogOut, Bookmark, Sparkles } from 'lucide-react'

export default async function Home() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-100 via-white to-purple-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-800/50 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0))]" />

        <Card className="w-full max-w-md mx-auto shadow-2xl border-0 bg-white/70 backdrop-blur-xl dark:bg-gray-950/70 relative z-10 overflow-hidden ring-1 ring-gray-900/5">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <CardHeader className="text-center space-y-6 pt-12 pb-8">
            <div className="mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105 duration-300">
              <Bookmark className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                Smart Bookmark
              </CardTitle>
              <CardDescription className="text-lg font-medium text-gray-500 dark:text-gray-400">
                Your second brain for links.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6 px-8 pb-12">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Save, organize, and access your favorite content from anywhere, instantly.
            </p>
            <form action={loginWithGoogle}>
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all duration-300 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                size="lg"
              >
                <svg className="mr-3 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                  <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Continue with Google
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: bookmarks } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-950/50">
      <div className="container mx-auto py-8 px-4 max-w-5xl space-y-8">
        {/* Header Section */}
        <header className="flex flex-col sm:flex-row justify-between items-center gap-6 p-2 rounded-2xl">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
              <div className="relative bg-white dark:bg-gray-900 p-3.5 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50">
                Your Bookmarks
              </h1>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                Welcome back, <span className="text-indigo-600 dark:text-indigo-400">{user.email?.split('@')[0]}</span>
              </p>
            </div>
          </div>

          <form action={logout}>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors gap-2 rounded-xl px-4 py-6 h-auto"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Sign Out</span>
            </Button>
          </form>
        </header>

        {/* Content Section */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <BookmarkManager user={user} initialBookmarks={bookmarks || []} />
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-purple-100/50 dark:bg-purple-900/10 blur-3xl mix-blend-multiply dark:mix-blend-overlay opacity-70" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-indigo-100/50 dark:bg-indigo-900/10 blur-3xl mix-blend-multiply dark:mix-blend-overlay opacity-70" />
      </div>
    </div>
  )
}
