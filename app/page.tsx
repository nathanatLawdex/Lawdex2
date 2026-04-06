'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Resource } from '@/lib/types';

type TabKey = 'home' | 'library' | 'upload' | 'login';

export default function Page() {
  const [tab, setTab] = useState<TabKey>('home');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [resourceError, setResourceError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [authError, setAuthError] = useState('');

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadResources();
    loadUser();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUser() {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    setCurrentUser(data.user ?? null);
  }

  async function loadResources() {
    if (!supabase) {
      setResourceError('Supabase is not connected.');
      setLoadingResources(false);
      return;
    }

    setLoadingResources(true);
    setResourceError('');

    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .or('is_deleted.is.false,is_deleted.is.null')
      .order('created_at', { ascending: false });

    if (error) {
      setResourceError(error.message);
      setLoadingResources(false);
      return;
    }

    setResources((data || []) as Resource[]);
    setLoadingResources(false);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setFile(nextFile);
    setUploadError('');
    setUploadMessage('');

    if (nextFile.name.toLowerCase().endsWith('.docx')) {
      setExtracting(true);
      try {
        const mammoth = await import('mammoth/mammoth.browser');
        const arrayBuffer = await nextFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const extracted = result.value.replace(/\n{3,}/g, '\n\n').trim();

        if (extracted) {
          setText(extracted);
          setUploadMessage('DOCX text extracted. You can edit the working copy before uploading.');
        } else {
          setUploadMessage('No text could be extracted from the DOCX. You can still type or paste text below.');
        }
      } catch (_err) {
        setUploadError('Failed to extract DOCX text.');
      } finally {
        setExtracting(false);
      }
    }
  }

  async function upload() {
    if (!supabase) {
      setUploadError('Supabase is not connected.');
      return;
    }

    setUploadError('');
    setUploadMessage('');
    setUploading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setUploadError('Login first.');
      setUploading(false);
      return;
    }

    let url: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const path = ${Date.now()}-${file.name};
      const { error: uploadStorageError } = await supabase.storage
        .from('resources')
        .upload(path, file);

      if (uploadStorageError) {
        setUploadError(uploadStorageError.message);
        setUploading(false);
        return;
      }

      const { data } = supabase.storage.from('resources').getPublicUrl(path);
      url = data.publicUrl;
      fileName = file.name;
    }

    const alias = auth.user.email?.split('@')[0] || 'Member';

    const { data: insertedResource, error: resourceInsertError } = await supabase
      .from('resources')
      .insert({
        title: fileName || 'Untitled',
        summary: text.slice(0, 200) || 'No summary provided.',
        area: 'General',
        jurisdiction: 'Australia',
        type: file ? 'DOCX Upload' : 'Text Entry',
        current_content: text,
        original_file_url: url,
        original_file_name: fileName,
        created_by: auth.user.id,
        author_alias: alias,
      })
      .select()
      .single();

    if (resourceInsertError) {
      setUploadError(resourceInsertError.message);
      setUploading(false);
      return;
    }

    if (insertedResource && url && fileName) {
      const { error: versionInsertError } = await supabase.from('resource_files').insert({
        resource_id: insertedResource.id,
        file_url: url,
        file_name: fileName,
        version_number: 1,
        uploaded_by: auth.user.id,
        uploader_alias: alias,
        note: 'Initial upload',
      });

      if (versionInsertError) {
        setUploadError(versionInsertError.message);
        setUploading(false);
        return;
      }
    }

    setUploadMessage('Uploaded successfully.');
    setFile(null);
    setText('');
    await loadResources();
    setTab('home');
    setUploading(false);
  }

  async function login() {
    if (!supabase) {
      setAuthError('Supabase is not connected.');
      return;
    }

    setAuthError('');
    setAuthMessage('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setAuthError(error.message);
      return;
    }

    const { data: userData } = await supabase.auth.getUser();
    setCurrentUser(userData.user ?? null);
    setAuthMessage('Logged in.');
    setTab('home');
  }

  async function logout() {
    if (!supabase) {
      setAuthError('Supabase is not connected.');
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setAuthError(error.message);
      return;
    }

    setCurrentUser(null);
    setAuthMessage('Logged out.');
    setTab('home');
  }

  return (
    <main style={container}>
      <h1 style={title}>Pardella</h1>
      <p style={subtitle}>
        Collaborative legal discussion, living documents, tracked revisions.
      </p>

      <div style={nav}>
        <button onClick={() => setTab('home')} style={{ ...navBtn, ...(tab === 'home' ? activeBtn : {}) }}>
          HOME
        </button>
        <button onClick={() => setTab('library')} style={{ ...navBtn, ...(tab === 'library' ? activeBtn : {}) }}>
          LIBRARY
        </button>
        <button onClick={() => setTab('upload')} style={{ ...navBtn, ...(tab === 'upload' ? activeBtn : {}) }}>
          UPLOAD
        </button>

        {currentUser ? (
          <button onClick={logout} style={navBtn}>
            LOGOUT
          </button>
        ) : (
          <button onClick={() => setTab('login')} style={{ ...navBtn, ...(tab === 'login' ? activeBtn : {}) }}>
            LOGIN
          </button>
        )}
      </div>

      {currentUser?.email ? (
        <div style={signedInText}>Signed in as {currentUser.email}</div>
      ) : null}

      {tab === 'home' && (
        <>
          <section style={heroCard}>
            <h2 style={heading}>Welcome</h2>
            <p style={textStyle}>
              Upload a Word document, preserve the original file, extract its contents into a live editable
              working copy, and let others discuss and refine the text without re-uploading documents.
            </p>
          </section>

          <section style={card}>
            <h2 style={heading}>Latest uploads</h2>
            <p style={subtext}>Newest to oldest. Click any document to open it.</p>

            {loadingResources ? (
              <p>Loading…</p>
            ) : resourceError ? (
              <p style={errorText}>{resourceError}</p>
            ) : resources.length === 0 ? (
              <p style={subtext}>No uploaded documents yet.</p>
            ) : (
              <div style={list}>
                {resources.map((resource) => (
                  <Link key={resource.id} href={`/resources/${resource.id}`} style={resourceCard}>
                    <div style={resourceTitle}>{resource.title}</div>
                    <div style={resourceMeta}>
                      {resource.type || 'Document'} · {resource.jurisdiction || 'Unknown'} · {formatDate(resource.created_at)}
                    </div>
                    <div style={resourceSummary}>
                      {resource.summary || 'No summary available.'}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {tab === 'library' && (
        <section style={card}>
          <h2 style={heading}>Library</h2>
          <p style={subtext}>All uploaded documents.</p>

          {loadingResources ? (
            <p>Loading…</p>
          ) : resourceError ? (
            <p style={errorText}>{resourceError}</p>
          ) : resources.length === 0 ? (
            <p style={subtext}>No documents yet.</p>
          ) : (
            <div style={list}>
              {resources.map((resource) => (
                <Link key={resource.id} href={`/resources/${resource.id}`} style={resourceCard}>
                  <div style={resourceTitle}>{resource.title}</div>
                  <div style={resourceMeta}>
                    {resource.type || 'Document'} · {resource.jurisdiction || 'Unknown'} · {formatDate(resource.created_at)}
                  </div>
                  <div style={resourceSummary}>
                    {resource.summary || 'No summary available.'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'upload' && (
        <section style={card}>
          <h2 style={heading}>Upload Document</h2>

          <input type="file" onChange={handleFileChange} style={input} />
          {extracting ? <p style={subtext}>Extracting DOCX…</p> : null}

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Working document..."
            style={textarea}
          />

          <button onClick={upload} style={primaryBtn}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>

          {uploadMessage ? <p style={successText}>{uploadMessage}</p> : null}
          {uploadError ? <p style={errorText}>{uploadError}</p> : null}
        </section>
      )}

      {tab === 'login' && (
        <section style={card}>
          <h2 style={heading}>Lawyer Login</h2>

          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
          />

          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
          />

          <button onClick={login} style={primaryBtn}>
            Login
          </button>

          {authMessage ? <p style={successText}>{authMessage}</p> : null}
          {authError ? <p style={errorText}>{authError}</p> : null}
        </section>
      )}
    </main>
  );
}

const container: React.CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: 40,
  fontFamily: 'Inter, Arial, sans-serif',
  background: '#f4f6fa',
  minHeight: '100vh',
};

const title: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 42,
  fontWeight: 800,
  marginBottom: 8,
  color: '#0f172a',
};

const subtitle: React.CSSProperties = {
  textAlign: 'center',
  color: '#64748b',
  marginBottom: 24,
  fontSize: 18,
};

const signedInText: React.CSSProperties = {
  textAlign: 'center',
  color: '#475569',
  marginBottom: 18,
  fontSize: 14,
};

const nav: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  marginBottom: 22,
  flexWrap: 'wrap',
};

const navBtn: React.CSSProperties = {
  padding: '12px 18px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  cursor: 'pointer',
  fontWeight: 700,
};

const activeBtn: React.CSSProperties = {
  background: '#111827',
  color: '#fff',
  border: '1px solid #111827',
};

const heroCard: React.CSSProperties = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  marginBottom: 20,
};

const card: React.CSSProperties = {
  background: '#fff',
  padding: 24,
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  marginBottom: 20,
};

const heading: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 10,
  color: '#0f172a',
};

const textStyle: React.CSSProperties = {
  color: '#475569',
  lineHeight: 1.7,
};

const subtext: React.CSSProperties = {
  color: '#64748b',
  marginBottom: 16,
};

const input: React.CSSProperties = {
  width: '100%',
  padding: 12,
  marginBottom: 12,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  boxSizing: 'border-box',
  fontSize: 15,
};

const textarea: React.CSSProperties = {
  width: '100%',
  minHeight: 260,
  padding: 14,
  borderRadius: 10,
  border: '1px solid #d1d5db',
  marginBottom: 14,
  boxSizing: 'border-box',
  fontSize: 15,
  lineHeight: 1.6,
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

const list: React.CSSProperties = {
  display: 'grid',
  gap: 14,
};

const resourceCard: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  color: '#111827',
  border: '1px solid #e5e7eb',
  borderRadius: 14,
  padding: 18,
  background: '#f8fafc',
};

const resourceTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  marginBottom: 6,
};

const resourceMeta: React.CSSProperties = {
  fontSize: 13,
  color: '#64748b',
  marginBottom: 8,
};

const resourceSummary: React.CSSProperties = {
  fontSize: 14,
  color: '#475569',
  lineHeight: 1.5,
};

const successText: React.CSSProperties = {
  color: '#166534',
  marginTop: 12,
};

const errorText: React.CSSProperties = {
  color: '#dc2626',
  marginTop: 12,
};
