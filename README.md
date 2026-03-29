# Pardella MVP

Pardella is a collaborative legal discussion platform built on Next.js + Supabase.

## Implemented in this build

- **Pardella branding**
- Home page shows **latest uploads newest-to-oldest**, replacing the old feature boxes
- Each resource has a **live editable working copy** in-browser
- Each resource retains the **original uploaded file** separately
- **Comments** sit beside each document
- **Revision submissions** are stored separately from the current accepted working copy
- **Admin decisions** (accept / reject) are recorded and visible to signed-in users
- Admin page for reviewing pending revisions

## Important architecture note

This MVP does **not** directly edit binary PDFs or DOCX files in-browser. Instead:

1. the uploaded file is retained as the **original**;
2. the member provides or edits a **live working copy** as text in-browser;
3. proposed changes are stored as **revisions**;
4. admin can accept a revision, which updates the current working copy;
5. the original file remains accessible.

That is the safest practical first version for a legal discussion platform.

## Setup

### 1. Supabase

Create a Supabase project.

In Supabase:
- enable Email auth
- create a **public** storage bucket named `resources`
- run `supabase/schema.sql` in the SQL Editor
- if you want admin access, change your row in `profiles` to `role = 'admin'`

### 2. Vercel environment variables

Add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Use the **Project URL** and **Publishable key** from Supabase.

### 3. Deploy

Push to GitHub and let Vercel redeploy.

## Admin promotion

After signing up and logging in once, your profile row is created automatically.

Open the `profiles` table in Supabase and change your own `role` from `member` to `admin`.

## Tables

- `profiles`
- `resources`
- `comments`
- `revisions`
- `admin_decisions`

## Next recommended upgrades

- rich text editor instead of plain textarea
- anchored paragraph / page-level annotations
- side-by-side diff viewer
- notifications for comments and admin decisions
- invite-only signups or domain approval
- legal terms / privacy / moderation workflow
