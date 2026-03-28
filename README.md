# CounselCache – auth + real data edition

This version adds:
- real account creation and sign in via Supabase Auth
- real resource records saved in a Supabase table
- optional file upload to a Supabase Storage bucket called `resources`

## 1. Add files to GitHub
Replace your current project files with the contents of this folder.

## 2. Create a Supabase project
In Supabase:
- create a project
- Authentication -> Providers -> Email -> enable Email
- SQL Editor -> run `supabase/schema.sql`
- Storage -> create a public bucket called `resources`

## 3. Add environment variables in Vercel
Add these in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 4. Redeploy
Redeploy in Vercel. Then test:
- create account
- sign in
- upload a resource
- check that the record appears in Library

## Important next steps before public launch
- add admin approval workflow
- restrict signups to approved domains or invite-only access
- add contributor warranties, privacy policy, and terms of use
- add moderation and reporting tools
