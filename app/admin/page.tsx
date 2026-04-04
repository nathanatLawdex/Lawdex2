'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Profile, Resource, Revision } from '@/lib/types';
import { formatDate } from '@/lib/utils';

export default function AdminPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    if (!supabase) return;
    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    if (!user) {
      setError('Sign in first.');
      return;
    }
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();
    setProfile(prof as Profile);

    const { data: resourceData } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: revisionData } = await supabase
      .from('revisions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    setResources((resourceData || []) as Resource[]);
    setRevisions((revisionData || []) as Revision[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function decide(revision: Revision, decision: 'accepted' | 'rejected') {
    if (!supabase) return;
    setError(null);
    const note = reason[revision.id] || null;

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('Sign in first.');
      if (profile?.role !== 'admin') {
        throw new Error(
          'This page only works for admin users. Promote your user role in the profiles table.'
        );
      }

      const { error: revError } = await supabase
        .from('revisions')
        .update({ status: decision, note: note || revision.note })
        .eq('id', revision.id);

      if (revError) throw revError;

      if (decision === 'accepted') {
        const { error: resourceError } = await supabase
          .from('resources')
          .update({
            current_content: revision.content,
            updated_at: new Date().toISOString(),
          })
          .eq('id', revision.resource_id);

        if (resourceError) throw resourceError;
      }

      const { error: decisionError } = await supabase
        .from('admin_decisions')
        .insert({
          resource_id: revision.resource_id,
          revision_id: revision.id,
          decision,
          reason: note,
          decided_by: user.id,
          decider_label: profile?.full_name || user.email || 'Admin',
        });

      if (decisionError) throw decisionError;

      setMessage(`Revision ${decision}.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to record decision.');
    }
  }

  return (
    <main className="main">
      <div className="container stack">
        <div className="pill-row">
          <Link href="/" className="ghost-btn">
            ← Back to Pardella
          </Link>
        </div>

        <div className="card card-pad">
          <h1 className="section-title">Admin review</h1>
          <p className="section-copy">
            Accept or reject proposed revisions. Decisions are logged publicly for
            signed-in users and can be disputed in comments on the resource page.
          </p>

          {profile?.role !== 'admin' && (
            <div className="notice">
              Your current role is <strong>{profile?.role || 'unknown'}</strong>. To use
              admin actions, open the <code>profiles</code> table in Supabase and change
              your role to <code>admin</code>.
            </div>
          )}

          {error && <div className="error-box">{error}</div>}
          {message && <div className="success-box">{message}</div>}
        </div>

        <div className="card card-pad">
          <h2 className="section-title" style={{ fontSize: 24 }}>
            Pending revisions
          </h2>

          <div className="revision-list">
            {revisions.length ? (
              revisions.map((revision) => {
                const resource = resources.find((r) => r.id === revision.resource_id);

                return (
                  <div className="revision-item" key={revision.id}>
                    <div className="split">
                      <strong>{resource?.title || 'Resource'}</strong>
                      <span className="tiny muted">{formatDate(revision.created_at)}</span>
                    </div>

                    <div className="tiny muted">
                      By {revision.author_label || 'Member'}
                    </div>

                    {revision.note && <p className="muted">{revision.note}</p>}

                    <textarea className="textarea" readOnly value={revision.content} />

                    <textarea
                      className="textarea"
                      placeholder="Decision reason"
                      value={reason[revision.id] || ''}
                      onChange={(e) =>
                        setReason((prev) => ({
                          ...prev,
                          [revision.id]: e.target.value,
                        }))
                      }
                    />

                    <div className="hero-actions">
                      <button
                        className="action-btn"
                        onClick={() => decide(revision, 'accepted')}
                      >
                        Accept changes
                      </button>

                      <button
                        className="ghost-btn"
                        onClick={() => decide(revision, 'rejected')}
                      >
                        Reject changes
                      </button>

                      <Link className="soft-btn" href={`/resources/${revision.resource_id}`}>
                        Open discussion
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty">No pending revisions.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
