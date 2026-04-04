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

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSummary, setUploadSummary] = useState('');
  const [uploadArea, setUploadArea] = useState('');
  const [uploadJurisdiction, setUploadJurisdiction] = useState('');
  const [uploadType, setUploadType] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

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
        setError(err instanceof Error ? err.message : 'Unable to load homepage data.');
      } finally {
        setLoading(false);
      }
    }

    loadResources();
  }, []);

  async function handleAuthSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setAuthError('Supabase is not connected.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    try {
      if (authMode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;
        setAuthMessage('Account created. Check your email if confirmation is enabled.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        setAuthMessage('Signed in successfully.');
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Unable to complete login.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setUploadError('Supabase is not connected.');
      return;
    }

    setUploadLoading(true);
    setUploadError(null);
    setUploadMessage(null);

    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;

      if (!user) {
        throw new Error('You must be signed in to upload.');
      }

      const { error } = await supabase.from('resources').insert({
        title: uploadTitle,
        summary: uploadSummary || null,
        area: uploadArea || null,
        jurisdiction: uploadJurisdiction || null,
        type: uploadType || null,
        current_content: uploadContent || null,
        created_by: user.id,
      });

      if (error) throw error;

      setUploadTitle('');
      setUploadSummary('');
      setUploadArea('');
      setUploadJurisdiction('');
      setUploadType('');
      setUploadContent('');
      setUploadMessage('Resource uploaded successfully.');
      setActiveTab('library');

      const { data, error: queryError } = await supabase
        .from('resources')
        .select('id,title,summary,area,jurisdiction,type,created_at')
        .order('created_at', { ascending: false });

      if (!queryError) {
        setResources((data || []) as Resource[]);
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Unable to upload resource.');
    } finally {
      setUploadLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f5f9',
        color: '#0f172a',
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          width: '100%',
          margin: '0 auto',
          padding: '16px 24px 40px',
          boxSizing: 'border-box',
        }}
      >
        <header style={{ width: '100%', marginBottom: '28px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              gap: '12px',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  lineHeight: 1.05,
                  marginBottom: '4px',
                }}
              >
                Pardella
              </div>
              <div
                style={{
                  fontSize: '1rem',
                  color: '#64748b',
                }}
              >
                Collaborative legal discussion, living advices, and tracked revisions.
              </div>
            </div>

            <nav
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap',
                width: '100%',
                marginTop: '8px',
              }}
            >
              <button onClick={() => setActiveTab('home')} style={tabStyle(activeTab === 'home')}>
                Home
              </button>
              <button onClick={() => setActiveTab('library')} style={tabStyle(activeTab === 'library')}>
                Library
              </button>
              <button onClick={() => setActiveTab('upload')} style={tabStyle(activeTab === 'upload')}>
                Upload
              </button>
              <button onClick={() => setActiveTab('login')} style={tabStyle(activeTab === 'login')}>
                Lawyer login
              </button>
            </nav>
          </div>
        </header>

        {activeTab === 'home' && (
          <>
            <section
              style={{
                background: '#ffffff',
                border: '1px solid #dbe3ee',
                borderRadius: '24px',
                padding: '28px',
                boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
                marginBottom: '18px',
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
                <Pill>Living documents</Pill>
                <Pill>Tracked admin decisions</Pill>
                <Pill>Open legal discussion</Pill>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1.2fr 0.8fr',
                  gap: '18px',
                }}
              >
                <div>
                  <h1
                    style={{
                      fontSize: 'clamp(2.3rem, 5vw, 4rem)',
                      lineHeight: 1.02,
                      fontWeight: 900,
                      margin: 0,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Pardella turns legal work into living documents, not static uploads.
                  </h1>

                  <p
                    style={{
                      marginTop: '22px',
                      fontSize: '1.1rem',
                      lineHeight: 1.8,
                      color: '#64748b',
                      maxWidth: '760px',
                    }}
                  >
                    Members upload original materials, maintain a live editable working copy,
                    debate objections in comments, and keep every admin acceptance or rejection
                    visible. The goal is practical legal accuracy, current case law awareness,
                    and transparent refinement.
                  </p>

                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '24px' }}>
                    <button
                      onClick={() => setActiveTab('library')}
                      style={{
                        border: 'none',
                        background: '#0f172a',
                        color: '#fff',
                        padding: '14px 20px',
                        borderRadius: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontSize: '0.98rem',
                      }}
                    >
                      See latest uploads
                    </button>

                    <Link href="/admin" style={secondaryButtonStyle}>
                      Admin decisions
                    </Link>
                  </div>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '14px',
                    alignSelf: 'start',
                  }}
                >
                  <StatCard title={String(resources.length)} text="Resources in discussion" number />
                  <StatCard title="Original + live" text="Every upload retains the original and a working copy" />
                  <StatCard title="Comments" text="Objections and new information sit beside the document" />
                  <StatCard title="History" text="Admin decisions remain visible and disputable" />
                </div>
              </div>
            </section>

            <LatestUploadsSection loading={loading} error={error} resources={resources} />
          </>
        )}

        {activeTab === 'library' && (
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #dbe3ee',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 850,
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Library
            </h2>

            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '1rem' }}>
              Browse every uploaded resource below.
            </p>

            {loading ? (
              <div style={emptyBoxStyle}>Loading library…</div>
            ) : error ? (
              <div style={errorBoxStyle}>{error}</div>
            ) : resources.length ? (
              <div style={{ display: 'grid', gap: '14px' }}>
                {resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))}
              </div>
            ) : (
              <div style={emptyBoxStyle}>No resources in the library yet.</div>
            )}
          </section>
        )}

        {activeTab === 'upload' && (
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #dbe3ee',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 850,
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Upload
            </h2>

            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '1rem' }}>
              Upload a new resource into Pardella.
            </p>

            {uploadError && <div style={errorBoxStyle}>{uploadError}</div>}
            {uploadMessage && <div style={successBoxStyle}>{uploadMessage}</div>}

            <form onSubmit={handleUploadSubmit} style={{ display: 'grid', gap: '14px' }}>
              <input
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Title"
                style={inputStyle}
                required
              />
              <input
                value={uploadSummary}
                onChange={(e) => setUploadSummary(e.target.value)}
                placeholder="Summary"
                style={inputStyle}
              />
              <input
                value={uploadArea}
                onChange={(e) => setUploadArea(e.target.value)}
                placeholder="Area"
                style={inputStyle}
              />
              <input
                value={uploadJurisdiction}
                onChange={(e) => setUploadJurisdiction(e.target.value)}
                placeholder="Jurisdiction"
                style={inputStyle}
              />
              <input
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                placeholder="Type"
                style={inputStyle}
              />
              <textarea
                value={uploadContent}
                onChange={(e) => setUploadContent(e.target.value)}
                placeholder="Working copy text"
                style={{ ...inputStyle, minHeight: '180px', resize: 'vertical' }}
              />
              <button
                type="submit"
                disabled={uploadLoading}
                style={{
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.98rem',
                  width: 'fit-content',
                }}
              >
                {uploadLoading ? 'Uploading…' : 'Upload resource'}
              </button>
            </form>
          </section>
        )}

        {activeTab === 'login' && (
          <section
            style={{
              background: '#ffffff',
              border: '1px solid #dbe3ee',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
            }}
          >
            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 850,
                margin: '0 0 8px 0',
                letterSpacing: '-0.02em',
              }}
            >
              Lawyer login
            </h2>

            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '1rem' }}>
              Sign in to comment, upload, and participate in document revision.
            </p>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
              <button onClick={() => setAuthMode('signin')} style={tabStyle(authMode === 'signin')}>
                Sign in
              </button>
              <button onClick={() => setAuthMode('signup')} style={tabStyle(authMode === 'signup')}>
                Create account
              </button>
            </div>

            {authError && <div style={errorBoxStyle}>{authError}</div>}
            {authMessage && <div style={successBoxStyle}>{authMessage}</div>}

            <form onSubmit={handleAuthSubmit} style={{ display: 'grid', gap: '14px', maxWidth: '560px' }}>
              {authMode === 'signup' && (
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Full name"
                  style={inputStyle}
                />
              )}
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                type="email"
                style={inputStyle}
                required
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                style={inputStyle}
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                style={{
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  padding: '14px 20px',
                  borderRadius: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontSize: '0.98rem',
                  width: 'fit-content',
                }}
              >
                {authLoading
                  ? 'Please wait…'
                  : authMode === 'signin'
                  ? 'Sign in'
                  : 'Create account'}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}

function LatestUploadsSection({
  loading,
  error,
  resources,
}: {
  loading: boolean;
  error: string | null;
  resources: Resource[];
}) {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #dbe3ee',
        borderRadius: '24px',
        padding: '28px',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
      }}
    >
      <h2
        style={{
          fontSize: '2rem',
          fontWeight: 850,
          margin: '0 0 8px 0',
          letterSpacing: '-0.02em',
        }}
      >
        Latest uploads
      </h2>

      <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '1rem' }}>
        Newest to oldest. Click any document to open the live discussion page and the current working copy.
      </p>

      {loading ? (
        <div style={emptyBoxStyle}>Loading Pardella…</div>
      ) : error ? (
        <div style={errorBoxStyle}>{error}</div>
      ) : resources.length ? (
        <div style={{ display: 'grid', gap: '14px' }}>
          {resources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      ) : (
        <div style={emptyBoxStyle}>No resources yet. Upload one to make it appear here.</div>
      )}
    </section>
  );
}

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Link
      href={`/resources/${resource.id}`}
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        border: '1px solid #dbe3ee',
        background: '#f8fafc',
        borderRadius: '18px',
        padding: '18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          color: '#64748b',
          fontSize: '0.87rem',
          marginBottom: '10px',
        }}
      >
        <span>{resource.area || 'Uncategorised'}</span>
        <span>·</span>
        <span>{resource.jurisdiction || 'Unknown jurisdiction'}</span>
        <span>·</span>
        <span>{resource.type || 'Document'}</span>
      </div>

      <div
        style={{
          fontSize: '1.2rem',
          fontWeight: 750,
          marginBottom: resource.summary ? '8px' : '14px',
        }}
      >
        {resource.title}
      </div>

      {resource.summary && (
        <div
          style={{
            color: '#64748b',
            lineHeight: 1.6,
            marginBottom: '14px',
          }}
        >
          {resource.summary}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px',
          color: '#64748b',
          fontSize: '0.9rem',
        }}
      >
        <span>{formatDate(resource.created_at)}</span>
        <span style={{ fontWeight: 650, color: '#0f172a' }}>Open discussion →</span>
      </div>
    </Link>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '8px 12px',
        borderRadius: '999px',
        background: '#eff6ff',
        color: '#1d4ed8',
        fontSize: '0.88rem',
        fontWeight: 650,
      }}
    >
      {children}
    </span>
  );
}

function StatCard({
  title,
  text,
  number = false,
}: {
  title: string;
  text: string;
  number?: boolean;
}) {
  return (
    <div
      style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '18px',
        padding: '18px',
        minHeight: '118px',
      }}
    >
      <div
        style={{
          fontSize: number ? '2rem' : '1.1rem',
          fontWeight: 800,
          marginBottom: '8px',
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: '#64748b',
          lineHeight: 1.55,
          fontSize: '0.95rem',
        }}
      >
        {text}
      </div>
    </div>
  );
}

function tabStyle(active: boolean): React.CSSProperties {
  return {
    border: active ? '1px solid #0f172a' : '1px solid #dbe3ee',
    background: active ? '#0f172a' : '#ffffff',
    color: active ? '#ffffff' : '#0f172a',
    padding: '12px 18px',
    borderRadius: '14px',
    fontWeight: 700,
    fontSize: '0.96rem',
    cursor: 'pointer',
    textDecoration: 'none',
  };
}

const secondaryButtonStyle: React.CSSProperties = {
  border: '1px solid #dbe3ee',
  background: '#ffffff',
  color: '#0f172a',
  padding: '14px 20px',
  borderRadius: '14px',
  fontWeight: 700,
  fontSize: '0.98rem',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px',
  borderRadius: '14px',
  border: '1px solid #dbe3ee',
  background: '#fff',
  fontSize: '0.98rem',
  boxSizing: 'border-box',
};

const errorBoxStyle: React.CSSProperties = {
  border: '1px solid #fecaca',
  background: '#fef2f2',
  color: '#b91c1c',
  padding: '16px 18px',
  borderRadius: '16px',
  fontSize: '0.95rem',
  marginBottom: '16px',
};

const successBoxStyle: React.CSSProperties = {
  border: '1px solid #bbf7d0',
  background: '#f0fdf4',
  color: '#166534',
  padding: '16px 18px',
  borderRadius: '16px',
  fontSize: '0.95rem',
  marginBottom: '16px',
};

const emptyBoxStyle: React.CSSProperties = {
  border: '1px dashed #dbe3ee',
  background: '#f8fafc',
  color: '#64748b',
  padding: '22px 18px',
  borderRadius: '18px',
  textAlign: 'center',
  fontSize: '1rem',
};
