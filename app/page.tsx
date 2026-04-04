'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Resource } from '@/lib/types';

type View = 'home' | 'library' | 'upload' | 'login';

function HeaderButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? 'action-btn' : 'ghost-btn'}
      type="button"
    >
      {children}
    </button>
  );
}

function HomeView({
  resources,
  loading,
  onOpenLibrary,
}: {
  resources: Resource[];
  loading: boolean;
  onOpenLibrary: () => void;
}) {
  const latestUploads = resources.slice(0, 8);

  return (
    <>
      <section className="hero card card-pad">
        <div className="pill-row">
          <span className="pill">Living documents</span>
          <span className="pill">Tracked admin decisions</span>
          <span className="pill">Open legal discussion</span>
        </div>

        <div className="hero-grid">
          <div className="stack">
            <h1 className="hero-title">
              Pardella turns legal work into living documents, not static uploads.
            </h1>

            <p className="hero-copy">
              Members upload original materials, maintain a live editable working copy,
              debate objections in comments, and keep every admin acceptance or rejection visible.
              The goal is practical legal accuracy, current case law awareness, and transparent refinement.
            </p>

            <div className="hero-actions">
              <button className="action-btn" type="button" onClick={onOpenLibrary}>
                See latest uploads
              </button>
              <Link href="/admin" className="ghost-btn">
                Admin decisions
              </Link>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-number">{resources.length}</div>
              <div className="stat-label">Resources in discussion</div>
            </div>
            <div className="stat-box">
              <div className="stat-title">Original + live</div>
              <div className="stat-label">
                Every upload retains the original and a working copy
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-title">Comments</div>
              <div className="stat-label">
                Objections and new information sit beside the document
              </div>
            </div>
            <div className="stat-box">
              <div className="stat-title">History</div>
              <div className="stat-label">
                Admin decisions remain visible and disputable
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="card card-pad">
        <h2 className="section-title">Latest uploads</h2>
        <p className="section-copy">
          Newest to oldest. Click any document to open the live discussion page and the current working copy.
        </p>

        {loading ? (
          <div className="empty">Loading latest uploads…</div>
        ) : latestUploads.length ? (
          <div className="resource-list">
            {latestUploads.map((resource) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.id}`}
                className="resource-card"
              >
                <div className="resource-meta">
                  <span>{resource.area || 'General'}</span>
                  <span>·</span>
                  <span>{resource.jurisdiction || 'Australia'}</span>
                  <span>·</span>
                  <span>{resource.type || 'Document'}</span>
                </div>

                <h3 className="resource-title">{resource.title}</h3>

                {resource.summary && (
                  <p className="resource-summary">{resource.summary}</p>
                )}

                <div className="resource-footer">
                  <span>{formatDate(resource.created_at)}</span>
                  <span>Open discussion →</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="empty">No resources yet. Upload one to make it appear here.</div>
        )}
      </section>
    </>
  );
}

function LibraryView({
  resources,
  loading,
}: {
  resources: Resource[];
  loading: boolean;
}) {
  return (
    <section className="card card-pad">
      <h2 className="section-title">Library</h2>
      <p className="section-copy">Browse every resource currently in discussion.</p>

      {loading ? (
        <div className="empty">Loading library…</div>
      ) : resources.length ? (
        <div className="resource-list">
          {resources.map((resource) => (
            <Link
              key={resource.id}
              href={`/resources/${resource.id}`}
              className="resource-card"
            >
              <div className="resource-meta">
                <span>{resource.area || 'General'}</span>
                <span>·</span>
                <span>{resource.jurisdiction || 'Australia'}</span>
                <span>·</span>
                <span>{resource.type || 'Document'}</span>
              </div>

              <h3 className="resource-title">{resource.title}</h3>

              {resource.summary && (
                <p className="resource-summary">{resource.summary}</p>
              )}

              <div className="resource-footer">
                <span>{formatDate(resource.created_at)}</span>
                <span>Open →</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">No resources found.</div>
      )}
    </section>
  );
}

function UploadView({
  uploadTitle,
  setUploadTitle,
  uploadSummary,
  setUploadSummary,
  uploadArea,
  setUploadArea,
  uploadJurisdiction,
  setUploadJurisdiction,
  uploadType,
  setUploadType,
  uploadBusy,
  onSubmit,
}: {
  uploadTitle: string;
  setUploadTitle: (v: string) => void;
  uploadSummary: string;
  setUploadSummary: (v: string) => void;
  uploadArea: string;
  setUploadArea: (v: string) => void;
  uploadJurisdiction: string;
  setUploadJurisdiction: (v: string) => void;
  uploadType: string;
  setUploadType: (v: string) => void;
  uploadBusy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <section className="card card-pad">
      <h2 className="section-title">Upload</h2>
      <p className="section-copy">Create a new resource for discussion.</p>

      <form className="stack" onSubmit={onSubmit}>
        <input
          className="input"
          placeholder="Title"
          value={uploadTitle}
          onChange={(e) => setUploadTitle(e.target.value)}
          required
        />

        <textarea
          className="textarea"
          placeholder="Summary / working content"
          value={uploadSummary}
          onChange={(e) => setUploadSummary(e.target.value)}
          rows={8}
        />

        <div className="hero-actions">
          <input
            className="input"
            placeholder="Area"
            value={uploadArea}
            onChange={(e) => setUploadArea(e.target.value)}
          />
          <input
            className="input"
            placeholder="Jurisdiction"
            value={uploadJurisdiction}
            onChange={(e) => setUploadJurisdiction(e.target.value)}
          />
          <input
            className="input"
            placeholder="Type"
            value={uploadType}
            onChange={(e) => setUploadType(e.target.value)}
          />
        </div>

        <div className="hero-actions">
          <button className="action-btn" type="submit" disabled={uploadBusy}>
            {uploadBusy ? 'Uploading…' : 'Upload resource'}
          </button>
        </div>
      </form>
    </section>
  );
}

function LoginView({
  isSignedIn,
  authMode,
  setAuthMode,
  email,
  setEmail,
  password,
  setPassword,
  fullName,
  setFullName,
  authBusy,
  onSubmit,
  onSignOut,
}: {
  isSignedIn: boolean;
  authMode: 'signin' | 'signup';
  setAuthMode: (v: 'signin' | 'signup') => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  fullName: string;
  setFullName: (v: string) => void;
  authBusy: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onSignOut: () => void;
}) {
  return (
    <section className="card card-pad">
      <h2 className="section-title">Lawyer login</h2>
      <p className="section-copy">Sign in or create an account.</p>

      {isSignedIn ? (
        <div className="stack">
          <div className="success-box">You are signed in.</div>
          <div className="hero-actions">
            <button className="ghost-btn" type="button" onClick={onSignOut}>
              Sign out
            </button>
          </div>
        </div>
      ) : (
        <form className="stack" onSubmit={onSubmit}>
          {authMode === 'signup' && (
            <input
              className="input"
              placeholder="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}

          <input
            className="input"
            placeholder="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            className="input"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="hero-actions">
            <button className="action-btn" type="submit" disabled={authBusy}>
              {authBusy
                ? 'Please wait…'
                : authMode === 'signin'
                ? 'Sign in'
                : 'Create account'}
            </button>

            <button
              className="ghost-btn"
              type="button"
              onClick={() =>
                setAuthMode(authMode === 'signin' ? 'signup' : 'signin')
              }
            >
              {authMode === 'signin' ? 'Create account instead' : 'Use sign in instead'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default function Page() {
  const [view, setView] = useState<View>('home');
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [isSignedIn, setIsSignedIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authBusy, setAuthBusy] = useState(false);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadArea, setUploadArea] = useState('General');
  const [uploadJurisdiction, setUploadJurisdiction] = useState('Australia');
  const [uploadType, setUploadType] = useState('Advice');
  const [uploadBusy, setUploadBusy] = useState(false);

  useEffect(() => {
    async function boot() {
      try {
        setError(null);

        if (!isSupabaseConfigured() || !supabase) {
          setError('Supabase is not connected.');
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        setIsSignedIn(Boolean(sessionData.session));

        const { data, error: queryError } = await supabase
          .from('resources')
          .select('*')
          .order('created_at', { ascending: false });

        if (queryError) {
          setError(queryError.message);
          return;
        }

        setResources((data || []) as Resource[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load Pardella.');
      } finally {
        setLoading(false);
      }
    }

    boot();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  async function refreshResources() {
    if (!supabase) return;
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });
    setResources((data || []) as Resource[]);
  }

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }

    setAuthBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (authMode === 'signin') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        setMessage('Signed in successfully.');
        setView('library');
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName || null,
            role: 'member',
          });
        }

        setMessage('Account created. You can now sign in.');
        setAuthMode('signin');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage('Signed out.');
    setView('home');
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }

    setUploadBusy(true);
    setError(null);
    setMessage(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        throw new Error('Sign in first to upload.');
      }

      const { error: insertError } = await supabase.from('resources').insert({
        title: uploadTitle,
        summary: uploadSummary || null,
        area: uploadArea,
        jurisdiction: uploadJurisdiction,
        type: uploadType,
        current_content: uploadSummary || '',
        created_by: user.id,
      });

      if (insertError) throw insertError;

      setUploadTitle('');
      setUploadSummary('');
      setUploadArea('General');
      setUploadJurisdiction('Australia');
      setUploadType('Advice');

      await refreshResources();
      setMessage('Resource uploaded.');
      setView('library');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setUploadBusy(false);
    }
  }

  return (
    <main className="main">
      <div className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark">◐</div>
          <div>
            <div className="brand-name">Pardella</div>
            <div className="brand-tag">
              Collaborative legal discussion, living advices, and tracked revisions.
            </div>
          </div>
        </div>

        <div className="hero-actions">
          <HeaderButton active={view === 'home'} onClick={() => setView('home')}>
            Home
          </HeaderButton>
          <HeaderButton active={view === 'library'} onClick={() => setView('library')}>
            Library
          </HeaderButton>
          <HeaderButton active={view === 'upload'} onClick={() => setView('upload')}>
            Upload
          </HeaderButton>
          <HeaderButton active={view === 'login'} onClick={() => setView('login')}>
            Lawyer login
          </HeaderButton>
        </div>
      </div>

      <div className="container stack">
        {error && <div className="error-box">{error}</div>}
        {message && <div className="success-box">{message}</div>}

        {view === 'home' && (
          <HomeView
            resources={resources}
            loading={loading}
            onOpenLibrary={() => setView('library')}
          />
        )}

        {view === 'library' && (
          <LibraryView
            resources={resources}
            loading={loading}
          />
        )}

        {view === 'upload' && (
          <UploadView
            uploadTitle={uploadTitle}
            setUploadTitle={setUploadTitle}
            uploadSummary={uploadSummary}
            setUploadSummary={setUploadSummary}
            uploadArea={uploadArea}
            setUploadArea={setUploadArea}
            uploadJurisdiction={uploadJurisdiction}
            setUploadJurisdiction={setUploadJurisdiction}
            uploadType={uploadType}
            setUploadType={setUploadType}
            uploadBusy={uploadBusy}
            onSubmit={handleUploadSubmit}
          />
        )}

        {view === 'login' && (
          <LoginView
            isSignedIn={isSignedIn}
            authMode={authMode}
            setAuthMode={setAuthMode}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            fullName={fullName}
            setFullName={setFullName}
            authBusy={authBusy}
            onSubmit={handleAuthSubmit}
            onSignOut={handleSignOut}
          />
        )}
      </div>
    </main>
  );
}
