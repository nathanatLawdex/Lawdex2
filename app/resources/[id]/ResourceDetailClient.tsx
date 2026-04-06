'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type {
  AdminDecision,
  Comment,
  Profile,
  Resource,
  ResourceFile,
  Revision,
} from '@/lib/types';

export default function ResourceDetailClient({ id }: { id: string }) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [decisions, setDecisions] = useState<AdminDecision[]>([]);
  const [files, setFiles] = useState<ResourceFile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [commentBody, setCommentBody] = useState('');
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [newVersionNote, setNewVersionNote] = useState('');
  const [versionUploading, setVersionUploading] = useState(false);
  const [savingComment, setSavingComment] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEverything();
  }, [id]);

  async function loadEverything() {
    if (!supabase) {
      setError('Supabase is not connected.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;
    setCurrentUserId(user?.id ?? null);

    if (user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData as Profile);
      }
    }

    const { data: resourceData, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (resourceError) {
      setError(resourceError.message);
      setLoading(false);
      return;
    }

    const typedResource = resourceData as Resource;

    if (typedResource.is_deleted) {
      setError('This resource has been removed.');
      setLoading(false);
      return;
    }

    setResource(typedResource);

    const { data: commentsData } = await supabase
      .from('comments')
      .select('*')
      .eq('resource_id', id)
      .order('created_at', { ascending: true });

    setComments((commentsData || []) as Comment[]);

    const { data: revisionsData } = await supabase
      .from('revisions')
      .select('*')
      .eq('resource_id', id)
      .order('created_at', { ascending: false });

    setRevisions((revisionsData || []) as Revision[]);

    const { data: decisionsData } = await supabase
      .from('admin_decisions')
      .select('*')
      .eq('resource_id', id)
      .order('created_at', { ascending: false });

    setDecisions((decisionsData || []) as AdminDecision[]);

    const { data: filesData } = await supabase
      .from('resource_files')
      .select('*')
      .eq('resource_id', id)
      .order('version_number', { ascending: false });

    setFiles((filesData || []) as ResourceFile[]);

    setLoading(false);
  }

  const canDelete = useMemo(() => {
    if (!resource) return false;
    return currentUserId === resource.created_by || profile?.role === 'admin';
  }, [currentUserId, resource, profile]);

  async function postComment() {
    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }

    if (!commentBody.trim()) return;

    setSavingComment(true);
    setError('');
    setMessage('');

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setError('You must be logged in to comment.');
      setSavingComment(false);
      return;
    }

    const authorLabel = profile?.full_name || user.email?.split('@')[0] || 'Member';

    const { error: insertError } = await supabase.from('comments').insert({
      resource_id: id,
      user_id: user.id,
      body: commentBody.trim(),
      author_label: authorLabel,
    });

    if (insertError) {
      setError(insertError.message);
      setSavingComment(false);
      return;
    }

    setCommentBody('');
    setMessage('Comment posted.');
    await loadEverything();
    setSavingComment(false);
  }

  async function uploadNewVersion() {
    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }

    if (!newVersionFile) {
      setError('Choose a file first.');
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setError('You must be logged in to upload a new version.');
      return;
    }

    if (!resource) {
      setError('Resource not loaded.');
      return;
    }

    setVersionUploading(true);
    setError('');
    setMessage('');

    const alias = profile?.full_name || user.email?.split('@')[0] || 'Member';

    const nextVersion =
      files.length > 0 ? Math.max(...files.map((f) => f.version_number)) + 1 : 1;

    const storagePath = `${Date.now()}-${newVersionFile.name}`;

    const { error: storageError } = await supabase.storage
      .from('resources')
      .upload(storagePath, newVersionFile);

    if (storageError) {
      setError(storageError.message);
      setVersionUploading(false);
      return;
    }

    const { data: publicData } = supabase.storage.from('resources').getPublicUrl(storagePath);
    const fileUrl = publicData.publicUrl;

    const { error: versionError } = await supabase.from('resource_files').insert({
      resource_id: resource.id,
      file_url: fileUrl,
      file_name: newVersionFile.name,
      version_number: nextVersion,
      uploaded_by: user.id,
      uploader_alias: alias,
      note: newVersionNote || null,
    });

    if (versionError) {
      setError(versionError.message);
      setVersionUploading(false);
      return;
    }

    if (newVersionFile.name.toLowerCase().endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth/mammoth.browser');
        const arrayBuffer = await newVersionFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extracted = result.value.replace(/\n{3,}/g, '\n\n').trim();

        if (extracted) {
          const { error: revisionError } = await supabase.from('revisions').insert({
            resource_id: resource.id,
            user_id: user.id,
            content: extracted,
            note: newVersionNote || `Proposed revision from original document version ${nextVersion}`,
            status: 'pending',
            author_label: alias,
          });

          if (revisionError) {
            setError(revisionError.message);
            setVersionUploading(false);
            return;
          }
        }
      } catch (_err) {
        setMessage(
          'Original version uploaded, but DOCX text could not be extracted into a proposed revision.'
        );
      }
    }

    setNewVersionFile(null);
    setNewVersionNote('');
    setMessage('New original version uploaded successfully.');
    await loadEverything();
    setVersionUploading(false);
  }

  async function deleteResource() {
    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }

    if (!canDelete || !resource) {
      setError('You do not have permission to delete this resource.');
      return;
    }

    const { data: authData } = await supabase.auth.getUser();
    const user = authData.user;

    if (!user) {
      setError('You must be logged in.');
      return;
    }

    setDeleting(true);
    setError('');
    setMessage('');

    const { error: deleteError } = await supabase
      .from('resources')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', resource.id);

    if (deleteError) {
      setError(deleteError.message);
      setDeleting(false);
      return;
    }

    window.location.href = '/';
  }

  if (loading) return <div style={pageWrap}>Loading…</div>;
  if (error && !resource) return <div style={pageWrap}><p style={errorText}>{error}</p></div>;
  if (!resource) return <div style={pageWrap}>Resource not found.</div>;

  return (
    <main style={pageWrap}>
      <div style={headerRow}>
        <div>
          <h1 style={title}>{resource.title}</h1>
          <div style={metaText}>
            {resource.type || 'Document'} · {resource.jurisdiction || 'Unknown jurisdiction'} · {resource.area || 'General'}
          </div>
        </div>

        <div style={headerActions}>
          {resource.original_file_url ? (
            <a href={resource.original_file_url} target="_blank" rel="noreferrer" style={secondaryBtn}>
              Download current original
            </a>
          ) : null}

          {canDelete ? (
            <button onClick={deleteResource} style={dangerBtn} disabled={deleting}>
              {deleting ? 'Deleting…' : 'Delete resource'}
            </button>
          ) : null}
        </div>
      </div>

      {message ? <p style={successText}>{message}</p> : null}
      {error ? <p style={errorText}>{error}</p> : null}

      <div style={layout}>
        <section style={mainCard}>
          <h2 style={sectionTitle}>Live working copy</h2>
          <div style={documentBox}>
            {resource.current_content || 'No working copy text available.'}
          </div>

          <h2 style={sectionTitle}>Comments</h2>

          <div style={commentList}>
            {comments.length === 0 ? (
              <p style={mutedText}>No comments yet.</p>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} style={commentCard}>
                  <div style={commentMeta}>
                    {comment.author_label || 'Member'} · {new Date(comment.created_at).toLocaleString()}
                  </div>
                  <div>{comment.body}</div>
                </div>
              ))
            )}
          </div>

          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            placeholder="Add a comment, objection, or new authority..."
            style={textarea}
          />

          <button onClick={postComment} style={primaryBtn} disabled={savingComment}>
            {savingComment ? 'Posting…' : 'Post comment'}
          </button>
        </section>

        <aside style={sideColumn}>
          <section style={sideCard}>
            <h2 style={sectionTitle}>Original document versions</h2>

            {files.length === 0 ? (
              <p style={mutedText}>No original versions recorded yet.</p>
            ) : (
              <div style={versionList}>
                {files.map((file) => (
                  <div key={file.id} style={versionCard}>
                    <div style={versionTitle}>Version {file.version_number}</div>
                    <div style={versionMeta}>{file.file_name}</div>
                    <div style={versionMeta}>
                      {file.uploader_alias} · {new Date(file.created_at).toLocaleString()}
                    </div>
                    {file.note ? <div style={versionNote}>{file.note}</div> : null}
                    <a href={file.file_url} target="_blank" rel="noreferrer" style={secondaryBtn}>
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}

            <hr style={divider} />

            <h3 style={subHeading}>Upload new original version</h3>

            <input
              type="file"
              onChange={(e) => setNewVersionFile(e.target.files?.[0] || null)}
              style={fileInput}
            />

            <textarea
              value={newVersionNote}
              onChange={(e) => setNewVersionNote(e.target.value)}
              placeholder="Optional note about this new original version..."
              style={smallTextarea}
            />

            <button onClick={uploadNewVersion} style={primaryBtn} disabled={versionUploading}>
              {versionUploading ? 'Uploading…' : 'Upload new version'}
            </button>

            <p style={mutedText}>
              If the new file is a DOCX, Pardella will extract its text and create a proposed revision for review.
            </p>
          </section>

          <section style={sideCard}>
            <h2 style={sectionTitle}>Revision history</h2>

            {revisions.length === 0 ? (
              <p style={mutedText}>No revisions yet.</p>
            ) : (
              revisions.map((revision) => (
                <div key={revision.id} style={revisionCard}>
                  <div style={revisionMeta}>
                    {revision.author_label || 'Member'} · {revision.status} · {new Date(revision.created_at).toLocaleString()}
                  </div>
                  {revision.note ? <div style={revisionNote}>{revision.note}</div> : null}
                  <div style={revisionPreview}>
                    {revision.content.slice(0, 220)}
                    {revision.content.length > 220 ? '…' : ''}
                  </div>
                </div>
              ))
            )}
          </section>

          <section style={sideCard}>
            <h2 style={sectionTitle}>Admin decision history</h2>

            {decisions.length === 0 ? (
              <p style={mutedText}>No admin decisions yet.</p>
            ) : (
              decisions.map((decision) => (
                <div key={decision.id} style={decisionCard}>
                  <div style={revisionMeta}>
                    {decision.decision} · {new Date(decision.created_at).toLocaleString()}
                  </div>
                  {decision.reason ? <div style={revisionNote}>{decision.reason}</div> : null}
                </div>
              ))
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

const pageWrap: React.CSSProperties = {
  maxWidth: 1200,
  margin: '0 auto',
  padding: 32,
  fontFamily: 'Inter, Arial, sans-serif',
  background: '#f4f6fa',
  minHeight: '100vh',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  marginBottom: 20,
  flexWrap: 'wrap',
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 32,
  fontWeight: 800,
  color: '#0f172a',
};

const metaText: React.CSSProperties = {
  marginTop: 8,
  color: '#64748b',
  fontSize: 14,
};

const headerActions: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  flexWrap: 'wrap',
};

const layout: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '2fr 1fr',
  gap: 20,
  alignItems: 'start',
};

const mainCard: React.CSSProperties = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  border: '1px solid #e5e7eb',
};

const sideColumn: React.CSSProperties = {
  display: 'grid',
  gap: 20,
};

const sideCard: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 16,
  border: '1px solid #e5e7eb',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  marginBottom: 14,
  color: '#0f172a',
};

const subHeading: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
  marginTop: 0,
};

const documentBox: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 18,
  minHeight: 240,
  lineHeight: 1.7,
  marginBottom: 24,
};

const commentList: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  marginBottom: 14,
};

const commentCard: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
};

const commentMeta: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginBottom: 8,
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 120,
  padding: 14,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  marginBottom: 12,
  boxSizing: 'border-box',
  fontSize: 14,
  lineHeight: 1.5,
};

const smallTextarea: React.CSSProperties = {
  width: '100%',
  minHeight: 90,
  padding: 12,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  marginTop: 12,
  marginBottom: 12,
  boxSizing: 'border-box',
  fontSize: 14,
  lineHeight: 1.5,
};

const fileInput: React.CSSProperties = {
  width: '100%',
  marginTop: 8,
};

const primaryBtn: React.CSSProperties = {
  padding: '12px 18px',
  background: '#111827',
  color: '#fff',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
};

const secondaryBtn: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 14px',
  background: '#fff',
  color: '#111827',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  textDecoration: 'none',
  fontWeight: 600,
};

const dangerBtn: React.CSSProperties = {
  padding: '10px 14px',
  background: '#dc2626',
  color: '#fff',
  borderRadius: 10,
  border: 'none',
  cursor: 'pointer',
  fontWeight: 700,
};

const divider: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid #e5e7eb',
  margin: '18px 0',
};

const versionList: React.CSSProperties = {
  display: 'grid',
  gap: 12,
};

const versionCard: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
};

const versionTitle: React.CSSProperties = {
  fontWeight: 700,
  marginBottom: 6,
};

const versionMeta: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginBottom: 6,
};

const versionNote: React.CSSProperties = {
  fontSize: 13,
  color: '#334155',
  marginBottom: 10,
};

const revisionCard: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
};

const revisionMeta: React.CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  marginBottom: 8,
};

const revisionNote: React.CSSProperties = {
  fontSize: 13,
  color: '#334155',
  marginBottom: 8,
};

const revisionPreview: React.CSSProperties = {
  fontSize: 14,
  color: '#0f172a',
  lineHeight: 1.5,
};

const decisionCard: React.CSSProperties = {
  background: '#f8fafc',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 14,
  marginBottom: 10,
};

const successText: React.CSSProperties = {
  color: '#166534',
  marginBottom: 14,
};

const errorText: React.CSSProperties = {
  color: '#dc2626',
  marginBottom: 14,
};

const mutedText: React.CSSProperties = {
  color: '#64748b',
  fontSize: 14,
};
