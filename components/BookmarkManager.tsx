"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trash2, ExternalLink, Plus } from "lucide-react"

// Define Bookmark type manually since we don't have generated types imported yet
interface Bookmark {
    id: string
    created_at: string
    title: string
    url: string
    user_id: string
}

import { type User } from '@supabase/supabase-js'
import { type RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export default function BookmarkManager({ user, initialBookmarks }: { user: User; initialBookmarks: Bookmark[] }) {
    const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
    const [newTitle, setNewTitle] = useState("")
    const [newUrl, setNewUrl] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [supabase] = useState(() => createClient())

    // Sync state with initialBookmarks prop if it changes
    useEffect(() => {
        setBookmarks(initialBookmarks)
    }, [initialBookmarks])

    // Subscribe to real-time changes
    useEffect(() => {
        const channel = supabase
            .channel("realtime bookmarks")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "bookmarks",
                    filter: `user_id=eq.${user.id}`,
                },
                (payload: RealtimePostgresChangesPayload<Bookmark>) => {
                    if (payload.eventType === "INSERT") {
                        setBookmarks((prev) => {
                            const newRecord = payload.new as Bookmark
                            // Deduplicate if already exists (by ID)
                            if (prev.some(b => b.id === newRecord.id)) return prev

                            // Check for optimistic match to replace
                            const optimisticIndex = prev.findIndex(b =>
                                b.id.startsWith('temp-') &&
                                b.title === newRecord.title &&
                                b.url === newRecord.url
                            )

                            if (optimisticIndex !== -1) {
                                const newBookmarks = [...prev]
                                newBookmarks[optimisticIndex] = newRecord
                                return newBookmarks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            }

                            return [newRecord, ...prev].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                        })
                    } else if (payload.eventType === "DELETE") {
                        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== payload.old.id))
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase, user.id])

    const handleAddBookmark = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newTitle || !newUrl) return

        setIsLoading(true)

        // Using client-side insert for immediate feedback via optimistic update or waiting for realtime
        // However, server actions are preferred for security checks usually, but here RLS protects.
        // Let's use standard Supabase client insert for simplicity with Realtime.
        const tempId = `temp-${Date.now()}`
        const optimisticBookmark: Bookmark = {
            id: tempId,
            created_at: new Date().toISOString(),
            title: newTitle,
            url: newUrl,
            user_id: user.id,
        }

        // Optimistic update
        setBookmarks((prev) => [optimisticBookmark, ...prev])
        setNewTitle("")
        setNewUrl("")

        const { data, error } = await supabase.from("bookmarks").insert({
            title: optimisticBookmark.title,
            url: optimisticBookmark.url,
            user_id: user.id,
        }).select().single()

        if (error) {
            console.error("Error adding bookmark:", error)
            // Revert optimistic update
            setBookmarks((prev) => prev.filter(b => b.id !== tempId))
        } else {
            // Confirm/Replace optimistic with real data
            setBookmarks((prev) => {
                // If the real one is already there (via realtime), simply remove the temp one
                if (prev.some(b => b.id === data.id)) {
                    return prev.filter(b => b.id !== tempId)
                }
                // Otherwise replace temp with real
                return prev.map(b => b.id === tempId ? data : b)
            })
        }

        setIsLoading(false)
    }

    const handleDeleteBookmark = async (id: string) => {
        // Optimistic update: immediately remove from UI
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))

        const { error } = await supabase.from("bookmarks").delete().eq("id", id)

        if (error) {
            console.error("Error deleting bookmark:", error)
            // Revert changes if request fails
            // In a real app we might want to fetch fresh data or handle this more gracefully
            // For now, we'll revert to the initial state + error notification if we had one
            // Since we don't have the deleted item easily available to push back in exact sort order without fetching,
            // we will just log it. But to be safe, let's fetch the latest if error.
            const { data: refreshedBookmarks } = await supabase
                .from('bookmarks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (refreshedBookmarks) {
                setBookmarks(refreshedBookmarks)
            }
        }
    }

    return (
        <div className="space-y-8 w-full max-w-4xl mx-auto">
            {/* Add Bookmark Section */}
            <Card className="border-0 shadow-lg bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm overflow-hidden relative group">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-75 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                    <CardTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                        Add New Bookmark
                    </CardTitle>
                    <CardDescription>Save and organize your favorite links instantly.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddBookmark} className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 space-y-2">
                            <Input
                                placeholder="Website Title"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                required
                                className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:ring-indigo-500 transition-all font-medium"
                            />
                        </div>
                        <div className="flex-[2] space-y-2">
                            <Input
                                placeholder="URL (e.g., https://example.com)"
                                value={newUrl}
                                onChange={(e) => setNewUrl(e.target.value)}
                                required
                                type="url"
                                className="bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 focus:ring-indigo-500 transition-all font-mono text-sm"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 md:w-auto w-full"
                        >
                            {isLoading ? (
                                "Adding..."
                            ) : (
                                <><Plus className="mr-2 h-4 w-4" /> Add</>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Bookmark List */}
            <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {bookmarks.length === 0 ? (
                    <div className="col-span-full text-center py-12 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                        <div className="mx-auto w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-3">
                            <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No bookmarks yet</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add your first one above to get started!</p>
                    </div>
                ) : (
                    bookmarks.map((bookmark) => (
                        <Card
                            key={bookmark.id}
                            className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 ring-1 ring-gray-200 dark:ring-gray-800 bg-white dark:bg-gray-900/60 backdrop-blur-sm"
                        >
                            <CardContent className="p-5 flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 min-w-0">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:scale-110 transition-transform duration-300 shrink-0">
                                        <ExternalLink className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col min-w-0 gap-1 pt-0.5">
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate text-lg leading-tight"
                                        >
                                            {bookmark.title}
                                        </a>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono opacity-80 group-hover:opacity-100 transition-opacity">
                                            {bookmark.url}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteBookmark(bookmark.id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all opacity-0 group-hover:opacity-100 shrink-0 -mr-2"
                                    aria-label="Delete bookmark"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
