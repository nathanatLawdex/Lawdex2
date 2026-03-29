'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Download, FileText, MessageSquare, XCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AdminDecision, Comment, Profile, Resource, Revision } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function ResourceDetail({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const [resourceId, setResourceId] = useState('');
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
    Promise.resolve(params).then((p) => setResourceId(p.id));
  }, [params]);

  async function load() {
    if (!supabase || !resourceId) return;
    setError(null);
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (user) {
      const { data } = await supabase.from('profiles').select('id, full_name, role').eq('id', user.id).maybeSingle();
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
    setRevisionBody(resourceData.current_content || '');

    const { data: commentData } = await supabase
      .from('comments')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true });
    setComments((commentData || []) as Comment[]);

    const { data: revisionData } = await supabase
      .from('revisions')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });
    setRevisions((revisionData || []) as Revision[]);

    const { data: decisionData } = await supabase
      .from('admin_decisions')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });
    setDecisions((decisionData || []) as AdminDecision[]);
  }

  useEffect(() => {
    load();
  }, [resourceId]);

  const latestAccepted = useMemo(() => {
    return revisions.find((r) => r.status === 'accepted') || null;
  }, [revisions]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !resourceId || !commentBody.trim()) return;
    setSavingComment(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Sign in to comment.');
      const authorLabel = profile?.full_name || user.email || 'Member';
      const { error } = await supabase.from('comments').insert({
        resource_id: resourceId,
        body: commentBody.trim(),
        created_by: user.id,
        author_label: authorLabel,
      });
      if (error) throw error;
      setCommentBody('');
      setMessage('Comment added.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to add comment.');
    } finally {
      setSavingComment(false);
    }
  }

  async function submitRevision(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !resourceId || !revisionBody.trim()) return;
    setSavingRevision(true);
    setError(null);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Sign in to submit revisions.');
      const authorLabel = profile?.full_name || user.email || 'Member';
      const { error } = await supabase.from('revisions').insert({
        resource_id: resourceId,
        content: revisionBody,
        note: revisionNote.trim() || null,
        status: 'pending',
        created_by: user.id,
        author_label: authorLabel,
      });
      if (error) throw error;
      setRevisionNote('');
      setMessage('Revision submitted for admin review. The original remains intact and the accepted working copy stays visible until a decision is made.');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit revision.');
    } finally {
      setSavingRevision(false);
    }
  }

  if (!resource) {
    return <main className="main"><div className="container"><div className="card card-pad">Loading resource…</div></div></main>;
  }

  return (
    <main className="main">
      <div className="container stack">
        <div className="pill-row">
          <Link className="ghost-btn" href="/">← Back to Pardella</Link>
          {resource.original_file_url && <a className="soft-btn" href={resource.original_file_url} target="_blank"><Download size={16} /> Open original file</a>}
          {resource.original_file_name && <span className="badge">Original: {resource.original_file_name}</span>}
          {resource.area && <span className="badge">{resource.area}</span>}
          {resource.jurisdiction && <span className="badge">{resource.jurisdiction}</span>}
          {resource.type && <span className="badge">{resource.type}</span>}
        </div>

        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        <section className="resource-layout">
          <div className="stack">
            <div className="card card-pad">
              <h1 className="section-title">{resource.title}</h1>
              <p className="section-copy">{resource.summary || 'No summary provided.'}</p>
              <div className="notice">
                The original uploaded document is retained separately. The text below is the live working copy. New edits are submitted as revisions and only replace the working copy if accepted by admin.
              </div>
            </div>

            <div className="card card-pad">
              <div className="split">
                <h2 className="section-title" style={{fontSize: 24}}>Current live working copy</h2>
                <div className="tiny muted">Last updated {formatDate(resource.updated_at)}</div>
              </div>
              <textarea className="textarea editor" value={revisionBody} onChange={(e) => setRevisionBody(e.target.value)} />
              <form className="stack" onSubmit={submitRevision}>
                <textarea className="textarea" placeholder="What changed and why? Include objection, authority, or new information." value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} />
                <div className="hero-actions">
                  <button className="action-btn" type="submit" disabled={savingRevision}>Submit proposed revision</button>
                </div>
              </form>
            </div>

            <div className="card card-pad">
              <h2 className="section-title" style={{fontSize: 24}}>Accepted version history</h2>
              <div className="revision-list">
                {latestAccepted ? (
                  revisions.filter((r) => r.status === 'accepted').map((revision) => (
                    <div key={revision.id} className="revision-item">
                      <div className="split"><strong>Accepted revision</strong><span className="tiny muted">{formatDate(revision.created_at)}</span></div>
                      <div className="tiny muted">By {revision.author_label || 'Member'}</div>
                      {revision.note && <p className="muted">{revision.note}</p>}
                    </div>
                  ))
                ) : <div className="empty">No accepted revisions yet.</div>}
              </div>
            </div>
          </div>

          <aside className="stack">
            <div className="card card-pad">
              <h2 className="section-title" style={{fontSize: 24}}><MessageSquare size={20} /> Comments and objections</h2>
              <form className="stack" onSubmit={addComment}>
                <textarea className="textarea" placeholder="Raise an objection, add authority, dispute a decision, or suggest new information." value={commentBody} onChange={(e) => setCommentBody(e.target.value)} />
                <button className="action-btn" type="submit" disabled={savingComment}>Post comment</button>
              </form>
              <div className="comment-list" style={{marginTop: 16}}>
                {comments.length ? comments.map((comment) => (
                  <div className="comment-item" key={comment.id}>
                    <div className="split"><strong>{comment.author_label || 'Member'}</strong><span className="tiny muted">{formatDate(comment.created_at)}</span></div>
                    <div>{comment.body}</div>
                  </div>
                )) : <div className="empty">No comments yet.</div>}
              </div>
            </div>

            <div className="card card-pad">
              <h2 className="section-title" style={{fontSize: 24}}>Admin decision history</h2>
              <div className="decision-list">
                {decisions.length ? decisions.map((decision) => (
                  <div key={decision.id} className="decision-item">
                    <div className="split">
                      <strong>{decision.decision === 'accepted' ? <><CheckCircle2 size={16} /> Accepted</> : <><XCircle size={16} /> Rejected</>}</strong>
                      <span className="tiny muted">{formatDate(decision.created_at)}</span>
                    </div>
                    <div className="tiny muted">By {decision.decider_label || 'Admin'}</div>
                    {decision.reason && <p className="muted">{decision.reason}</p>}
                  </div>
                )) : <div className="empty">No admin decisions yet.</div>}
              </div>
            </div>

            <div className="card card-pad">
              <h2 className="section-title" style={{fontSize: 24}}><FileText size={20} /> Pending revisions</h2>
              <div className="revision-list">
                {revisions.filter((r) => r.status === 'pending').length ? revisions.filter((r) => r.status === 'pending').map((revision) => (
                  <div key={revision.id} className="revision-item">
                    <div className="split"><strong>Pending review</strong><span className="tiny muted">{formatDate(revision.created_at)}</span></div>
                    <div className="tiny muted">By {revision.author_label || 'Member'}</div>
                    {revision.note && <p className="muted">{revision.note}</p>}
                  </div>
                )) : <div className="empty">No pending revisions.</div>}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
