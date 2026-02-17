# Smart Bookmark App

A simple, secure, and real-time bookmark manager built with **Next.js (App Router)**, **Supabase**, and **Tailwind CSS**.

## Features

- **Google OAuth Login**: Secure password-less authentication.
- **Private Bookmarks**: Row Level Security (RLS) ensures users only see their own data.
- **Real-time Updates**: Changes sync instantly across tabs using Supabase Realtime.
- **Modern UI**: Built with Shadcn UI and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS v4, Shadcn UI
- **Icons**: Lucide React

## Setup Instructions

### 1. Supabase Setup

Since I cannot access your Supabase dashboard, you must run the following SQL query in the **SQL Editor** of your Supabase project to set up the database:

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
3. Enter the **Client ID**: `477625061949-19htfkn76iuanq6snb468nijde57pft3.apps.googleusercontent.com` (Provided by you).
4. Enter the **Client Secret** (You need to get this from Google Cloud Console matching the Client ID, if you haven't already).
5. Ensure the **Callback URL (Redirect URL)** in Google Cloud Console matches: `https://raioydympxxesnnqthzv.supabase.co/auth/v1/callback`.

### 3. Environment Variables

The `.env.local` file has been pre-configured with the provided credentials.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Challenges & Solutions

### Challenge 1: Real-time Sync Across Tabs vs. Server Actions
**Problem**: Using Next.js Server Actions (`revalidatePath`) updates the current tab efficiently but doesn't automatically push changes to other open tabs of the same user.
**Solution**: Implemented a hybrid approach.
- **Server Component**: Fetches initial data securely.
- **Client Component**: Subscribes to Supabase Realtime (`postgres_changes`) to listen for `INSERT` and `DELETE` events.
- **State Management**: The client component merges Realtime events with the local state. Deduplication logic ensures that if the current tab adds a bookmark (triggering a local update via router refresh AND a Realtime event), the UI doesn't show duplicates.

### Challenge 2: Supabase Auth in Next.js App Router (Middleware vs Server Actions)
**Problem**: Managing auth sessions securely where cookies need to be refreshed and accessed in both Server Components (read-only) and Server Actions (writeable).
**Solution**: Used the standard `@supabase/ssr` pattern with separate helper functions for:
- **Server**: Uses `cookies()` from `next/headers` with try-catch block for `setAll` to handle the read-only context of Server Components gracefully while working in Actions.
- **Middleware**: A dedicated `updateSession` function ensures auth tokens are refreshed on every request before reaching the app logic.
- **Callback Route**: A clean `route.ts` handler exchanges the OAuth code for a session and redirects the user.

### Challenge 3: Tailwind CSS v4 Integration
**Problem**: The project was initialized with Tailwind v4, but standard Shadcn UI components often rely on `tailwind.config.js` (v3).
**Solution**: Adapted the configuration by defining the Shadcn CSS variables and theme extensions directly in `app/globals.css` using the new `@theme` directive relative to Tailwind v4, ensuring the UI components render correctly without a legacy config file.
