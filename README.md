# Smart Bookmark App

A simple, secure, and real-time bookmark manager built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**.

## Features

- **Google OAuth Login**: Secure password-less authentication.
- **Private Bookmarks**: Row Level Security (RLS) ensures users only see their own data.
- **Real-time Updates**: Changes sync instantly across tabs using Supabase Realtime.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS with a stunning glassmorphism design.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Icons**: Lucide React

## Setup Instructions

### 1. Supabase Setup

You must run the following SQL query in the **SQL Editor** of your Supabase project to set up the database:

```sql
-- 1. Create the bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  url text not null,
  user_id uuid references auth.users not null default auth.uid()
);

-- 2. Enable Row Level Security (RLS)
alter table bookmarks enable row level security;

-- 3. Create RLS Policies
-- Allow users to view their own bookmarks
create policy "Users can view own bookmarks"
on bookmarks for select
using (auth.uid() = user_id);

-- Allow users to insert their own bookmarks
create policy "Users can insert own bookmarks"
on bookmarks for insert
with check (auth.uid() = user_id);

-- Allow users to delete their own bookmarks
create policy "Users can delete own bookmarks"
on bookmarks for delete
using (auth.uid() = user_id);

-- 4. Enable Realtime for the table
-- Go to Database -> Replication -> supabase_realtime -> Toggle 'bookmarks' ON
-- OR run:
alter publication supabase_realtime add table bookmarks;
```

### 2. Google OAuth Configuration

1. Go to your **Supabase Dashboard** -> **Authentication** -> **Providers**.
2. Enable **Google**.
3. Enter your **Client ID** and **Client Secret** (obtained from Google Cloud Console).
4. Ensure the **Callback URL** in Google Cloud Console matches your Supabase project's callback URL.

### 3. Environment Variables

Create a `.env.local` file with your project credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Challenges & Solutions

### Challenge 1: Unreliable Realtime Updates
**Problem**: The realtime connection was unstable, causing updates to be missed or delayed, especially when typing in input fields. This was caused by the Supabase client being re-initialized on every render, forcing the subscription to constantly reconnect.
**Solution**: Memoized the Supabase client instance using `useState(() => createClient())` to ensure a stable, persistent connection throughout the component's lifecycle. Additionally, separated the subscription logic from other effects to prevent unnecessary re-subscriptions.

### Challenge 2: Slow UI Feedback (Optimistic Updates)
**Problem**: Users experienced a delay between clicking "Add" or "Delete" and seeing the change on screen, as the UI waited for the server round-trip.
**Solution**: Implemented **Optimistic UI updates**. The local state is updated immediately to reflect the user's action (adding a temporary item or removing a deleted one). The server request happens in the background. If it fails, the change is rolled back. If it succeeds, the temporary item is seamlessly replaced with real server data.

### Challenge 3: Handling Duplicate Events
**Problem**: When a user adds a bookmark, the Optimistic update adds it to the UI immediately. Shortly after, the Realtime subscription receives an `INSERT` event for the same item, potentially causing duplicates.
**Solution**: Added intelligent deduplication logic. The `useEffect` hook listening to Realtime events checks if an incoming record matches an existing one (by ID) or an optimistic placeholder (by content match). If a match is found, it updates the existing entry instead of creating a duplicate, ensuring a smooth transition from "temporary" to "persisted" state.

### Challenge 4: Tailwind CSS v4 & Standard Components
**Problem**: Standard UI component libraries often rely on legacy Tailwind configuration, which conflicted with the new v4 engine.
**Solution**: Adapted the design system by defining theme variables directly in `app/globals.css` using the `@theme` directive, ensuring compatibility without needing a legacy config file.
