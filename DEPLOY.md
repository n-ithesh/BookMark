# Deploying to Vercel

Follow these steps to deploy your **Smart Bookmark App** to Vercel.

## Prerequisites

- A [Vercel Account](https://vercel.com/signup).
- A [GitHub Account](https://github.com/).
- Your project pushed to a GitHub repository (already done!).

## Steps

1.  **Log in to Vercel**.
    - Go to [vercel.com](https://vercel.com) and log in.

2.  **Import Project**.
    - Click **"Add New..."** -> **"Project"**.
    - Select **"Import Git Repository"**.
    - Find your **BookMark** repository and click **"Import"**.

3.  **Configure Project**.
    - **Framework Preset**: Vercel should auto-detect **Next.js**.
    - **Root Directory**: `./` (default).
    - **Environment Variables**: Expand the section and add the following keys from your `.env.local` file:
        - `NEXT_PUBLIC_SUPABASE_URL`
        - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

4.  **Deploy**.
    - Click **"Deploy"**. Vercel will build your application.
    - Wait for the build to complete. Once finished, you will get a live URL (e.g., `https://bookmark-app-xyz.vercel.app`).

## ⚠️ Important Post-Deployment Step

For Google Login to work on your live site, you **must** update the redirect URL in Supabase.

1.  Copy your new Vercel URL (e.g., `https://bookmark-app-xyz.vercel.app`).
2.  Go to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
3.  Add your Vercel URL to **Site URL** and **Redirect URLs**:
    - **Site URL**: `https://bookmark-app-xyz.vercel.app`
    - **Redirect URLs**: Add `https://bookmark-app-xyz.vercel.app/**` (allows all subpaths including `/auth/callback`).
4.  Go to **Authentication** -> **Providers** -> **Google**.
5.  Ensure the **Callback URL** in your **Google Cloud Console** matches `https://[YOUR-SUPABASE-PROJECT-ID].supabase.co/auth/v1/callback`. (This usually doesn't need to change if you set it up correctly in Supabase).
    - **Note**: The redirect happens from Google -> Supabase -> Your App. So Google Cloud config points to Supabase, and Supabase config needs to know your Vercel URL to redirect back.

Your app is now live!
