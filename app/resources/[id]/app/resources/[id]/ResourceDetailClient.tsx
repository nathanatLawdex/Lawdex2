'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, MessageSquare, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminDecision, Comment, Profile, Resource, Revision } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ResourceDetailClient({ id }: { id: string }) {
  const [resourceId, setResourceId] = useState(id);
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [decisions, setDecisions] = useState<AdminDecision[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [commentBody, setCommentBody] = useState('');
  const [revisionBody, setRevisionBody] = useState('');
  const [revisionNote, setRevisionNote] = useState('');
  const [savingComment, setSavingComment] = useState(false);
  const [savingRevision, setSavingRevision] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setResourceId(id);
  }, [id]);

  useEffect(() => {
    async function load() {
      if (!supabase || !resourceId) return;
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .maybeSingle();

        if (data) setProfile(data as Profile);
      }

      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', resourceId)
        .single();

      if (resourceError) {
        setError(resourceError.message);
        return;
      }

      setResource(resourceData as Resource);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });

      setComments((commentsData || []) as Comment[]);

      const { data: revisionsData } = await supabase
        .from('revisions')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

      setRevisions((revisionsData || []) as Revision[]);

      const { data: decisionsData } = await supabase
        .from('admin_decisions')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });

      setDecisions((decisionsData || []) as AdminDecision[]);
    }

    load();
  }, [resourceId]);

  const canAdmin = profile?.role === 'admin';

  const acceptedRevision = useMemo(() => {
    return revisions.find((r) => r.status === 'accepted') || null;
  }, [revisions]);

  async function submitComment() {
    if (!supabase || !resourceId || !commentBody.trim()) return;
    setSavingComment(true);
    setError(null);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError('You must be signed in to comment.');
      setSavingComment(false);
      return;
    }

    const { error: insertError } = await supabase.from('comments').insert({
      resource_id: resourceId,
      user_id: user.id,
      body: commentBody.trim(),
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setCommentBody('');
      setMessage('Comment posted.');
      const { data } = await supabase
        .from('comments')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: true });
      setComments((data || []) as Comment[]);
    }

    setSavingComment(false);
  }

  async function submitRevision() {
    if (!supabase || !resourceId || !revisionBody.trim()) return;
    setSavingRevision(true);
    setError(null);
    setMessage(null);

    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setError('You must be signed in to propose a revision.');
      setSavingRevision(false);
      return;
    }

    const { error: insertError } = await supabase.from('revisions').insert({
      resource_id: resourceId,
      user_id: user.id,
      body: revisionBody,
      note: revisionNote,
      status: 'pending',
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      setRevisionNote('');
      setMessage('Revision submitted for review.');
      const { data } = await supabase
        .from('revisions')
        .select('*')
        .eq('resource_id', resourceId)
        .order('created_at', { ascending: false });
      setRevisions((data || []) as Revision[]);
    }

    setSavingRevision(false);
  }

  async function decideRevision(revisionId: string, decision: 'accepted' | 'rejected') {
    if (!supabase || !resource || !profile) return;

    const { error: revisionError } = await supabase
      .from('revisions')
      .update({ status: decision })
      .eq('id', revisionId);

    if (revisionError) {
      setError(revisionError.message);
      return;
    }

    const revision = revisions.find((r) => r.id === revisionId);

    if (decision === 'accepted' && revision) {
      await supabase
        .from('resources')
        .update({ current_content: revision.body })
        .eq('id', resource.id);
    }

    await supabase.from('admin_decisions').insert({
      resource_id: resource.id,
      revision_id: revisionId,
      admin_user_id: profile.id,
      decision,
      note: `${decision} by admin`,
    });

    const { data: revisionsData } = await supabase
      .from('revisions')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });

    setRevisions((revisionsData || []) as Revision[]);

    const { data: decisionsData } = await supabase
      .from('admin_decisions')
      .select('*')
      .eq('resource_id', resource.id)
      .order('created_at', { ascending: false });

    setDecisions((decisionsData || []) as AdminDecision[]);

    const { data: resourceData } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resource.id)
      .single();

    if (resourceData) setResource(resourceData as Resource);
  }

  if (error) {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-red-600">{error}</div>;
  }

  if (!resource) {
    return <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-slate-600">Loading resource…</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <Link href="/" className="text-sm text-slate-500 hover:text-slate-900">
          ← Back to home
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr,0.9fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold">{resource.title}</h1>
                <div className="mt-2 text-sm text-slate-500">
                  {resource.area} · {resource.jurisdiction} · {resource.type} · {formatDate(resource.created_at)}
                </div>
              </div>
              {resource.original_file_url && (
                <a
                  href={resource.original_file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  <Download className="h-4 w-4" />
                  Open original
                </a>
              )}
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <FileText className="h-4 w-4" />
                  Original retained
                </div>
                <p className="text-sm text-slate-600">
                  The original uploaded file is preserved and remains accessible.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <CheckCircle2 className="h-4 w-4" />
                  Current working copy
                </div>
                <p className="text-sm text-slate-600">
                  This is the live working document that evolves through proposed revisions and admin decisions.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="mb-3 text-lg font-semibold">Current working copy</h2>
              <div className="min-h-[260px] whitespace-pre-wrap rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
                {resource.current_content || resource.original_text || 'No working text available yet.'}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Propose a revision</h2>
            <p className="mt-2 text-sm text-slate-600">
              Submit a revised working version. The original remains untouched.
            </p>

            <textarea
              value={revisionBody}
              onChange={(e) => setRevisionBody(e.target.value)}
              rows={12}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              placeholder="Paste the revised working text here..."
            />
            <input
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
              className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              placeholder="Short note explaining the change..."
            />
            <button
              onClick={submitRevision}
              disabled={savingRevision}
              className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingRevision ? 'Submitting…' : 'Submit revision'}
            </button>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Comments</h2>
            </div>

            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">{formatDate(comment.created_at)}</div>
                  <div className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{comment.body}</div>
                </div>
              ))}
              {comments.length === 0 && <div className="text-sm text-slate-500">No comments yet.</div>}
            </div>

            <textarea
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={4}
              className="mt-4 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              placeholder="Add a comment, objection, or new authority..."
            />
            <button
              onClick={submitComment}
              disabled={savingComment}
              className="mt-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {savingComment ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Revision history</h2>
            <div className="mt-4 space-y-3">
              {revisions.map((revision) => (
                <div key={revision.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs text-slate-500">{formatDate(revision.created_at)}</div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {revision.status}
                    </div>
                  </div>
                  {revision.note && <div className="mt-2 text-sm text-slate-600">{revision.note}</div>}
                  <div className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-slate-700">{revision.body}</div>

                  {canAdmin && revision.status === 'pending' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => decideRevision(revision.id, 'accepted')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => decideRevision(revision.id, 'rejected')}
                        className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-3 py-2 text-xs font-semibold text-white"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {revisions.length === 0 && <div className="text-sm text-slate-500">No revisions yet.</div>}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Admin decision history</h2>
            <div className="mt-4 space-y-3">
              {decisions.map((decision) => (
                <div key={decision.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="text-xs text-slate-500">{formatDate(decision.created_at)}</div>
                  <div className="mt-2 text-sm font-semibold capitalize">{decision.decision}</div>
                  {decision.note && <div className="mt-1 text-sm text-slate-600">{decision.note}</div>}
                </div>
              ))}
              {decisions.length === 0 && <div className="text-sm text-slate-500">No admin decisions yet.</div>}
            </div>
          </div>

          {acceptedRevision && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold">Latest accepted revision</h2>
              <div className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{acceptedRevision.body}</div>
            </div>
          )}
        </aside>
      </div>

      {message && (
        <div className="fixed bottom-4 right-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          {message}
        </div>
      )}
    </main>
  );
}
