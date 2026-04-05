'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Resource } from '@/lib/types';

type TabKey = 'home' | 'library' | 'upload' | 'login';

export default function Page() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('home');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [area, setArea] = useState('');
  const [jurisdiction, setJurisdiction] = useState('');
  const [type, setType] = useState('');
  const [workingText, setWorkingText] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [message, setMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    async function loadResources() {
      try {
        setError(null);

        if (!isSupabaseConfigured() || !supabase) {
          setError('Supabase is not connected.');
          return;
        }

        const { data, error: queryError } = await supabase
          .from('resources')
          .select('id,title,summary,area,jurisdiction,type,created_at')
          .order('created_at', { ascending: false });

        if (queryError) {
          setError(queryError.message);
          return;
        }

        setResources((data || []) as Resource[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load data.');
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setAuthMessage('Account created.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setAuthMessage('Signed in.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Auth error');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setFile(nextFile);
    setMessage(null);
    setUploadError(null);

    if (nextFile.name.endsWith('.docx')) {
      setExtracting(true);
      try {
        const mammoth = await import('mammoth/mammoth.browser');
        const arrayBuffer = await nextFile.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });

        const extracted = result.value.replace(/\n{3,}/g, '\n\n').trim();

        if (extracted) {
          setWorkingText(extracted);
          setMessage('DOCX text extracted. You can edit before upload.');
        } else {
          setMessage('No text extracted — you can still type below.');
        }
      } catch (err) {
        setUploadError('Failed to extract DOCX.');
      } finally {
        setExtracting(false);
      }
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setUploading(true);
    setUploadError(null);
    setMessage(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error('You must be logged in.');

      let fileUrl = null;
      let fileName = null;

      if (file) {
        const filePath = `${Date.now()}-${file.name}`;

        const { error: uploadErr } = await supabase.storage
          .from('resources')
          .upload(filePath, file);

        if (uploadErr) throw uploadErr;

        const { data } = supabase.storage.from('resources').getPublicUrl(filePath);

        fileUrl = data.publicUrl;
        fileName = file.name;
      }

      const { error } = await supabase.from('resources').insert({
        title,
        summary,
        area,
        jurisdiction,
        type,
        current_content: workingText,
        original_file_url: fileUrl,
        original_file_name: fileName,
        created_by: auth.user.id,
      });

      if (error) throw error;

      setMessage('Uploaded successfully.');
      setActiveTab('library');
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 24 }}>
      <h1 style={{ textAlign: 'center' }}>Pardella</h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
        <button onClick={() => setActiveTab('home')}>Home</button>
        <button onClick={() => setActiveTab('library')}>Library</button>
        <button onClick={() => setActiveTab('upload')}>Upload</button>
        <button onClick={() => setActiveTab('login')}>Login</button>
      </div>

      {activeTab === 'upload' && (
        <form onSubmit={handleUpload}>
          <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <input placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
          <input type="file" onChange={handleFileChange} />
          {extracting && <p>Extracting DOCX…</p>}
          <textarea
            placeholder="Working document"
            value={workingText}
            onChange={(e) => setWorkingText(e.target.value)}
          />
          <button type="submit">{uploading ? 'Uploading…' : 'Upload'}</button>
          {message && <p>{message}</p>}
          {uploadError && <p style={{ color: 'red' }}>{uploadError}</p>}
        </form>
      )}

      {activeTab === 'login' && (
        <form onSubmit={handleAuthSubmit}>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
          <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
          <button>{authLoading ? '...' : authMode === 'signin' ? 'Sign in' : 'Sign up'}</button>
          {authError && <p style={{ color: 'red' }}>{authError}</p>}
          {authMessage && <p>{authMessage}</p>}
        </form>
      )}

      {activeTab === 'library' && (
        <div>
          {loading && <p>Loading…</p>}
          {error && <p>{error}</p>}
          {resources.map((r) => (
            <div key={r.id}>
              <Link href={`/resources/${r.id}`}>{r.title}</Link>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
