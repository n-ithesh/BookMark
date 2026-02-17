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

export default function BookmarkManager({ user, initialBookmarks }: { user: any; initialBookmarks: Bookmark[] }) {
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
                (payload: any) => {
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
        <div className="space-y-8 w-full max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Add New Bookmark</CardTitle>
                    <CardDescription>Save your favorite links.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleAddBookmark} className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
                        <Input
                            placeholder="Title"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            required
                            className="flex-1"
                        />
                        <Input
                            placeholder="URL (https://...)"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            required
                            type="url"
                            className="flex-1"
                        />
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Adding..." : <><Plus className="mr-2 h-4 w-4" /> Add</>}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <div className="grid gap-4">
                {bookmarks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No bookmarks yet. Add one above!</p>
                ) : (
                    bookmarks.map((bookmark) => (
                        <Card key={bookmark.id} className="overflow-hidden transition-all hover:shadow-md">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-4 overflow-hidden">
                                    <div className="p-2 bg-primary/10 rounded-full">
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                        <a
                                            href={bookmark.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-medium hover:underline truncate"
                                        >
                                            {bookmark.title}
                                        </a>
                                        <span className="text-xs text-muted-foreground truncate">{bookmark.url}</span>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteBookmark(bookmark.id)}
                                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
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
