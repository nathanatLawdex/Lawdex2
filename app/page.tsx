'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { FileText, Home, Library, MessageSquare, Scale, Shield, Upload, UserCircle2 } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { Profile, Resource } from '@/lib/types';
import { formatDate } from '@/lib/utils';

function Header({
  page,
  setPage,
  signedIn,
  profile,
  onSignOut,
}: {
  page: string;
  setPage: (page: string) => void;
  signedIn: boolean;
  profile: Profile | null;
  onSignOut: () => void;
}) {
  return (
    <header className="header">
      <div className="container header-row">
        <div className="brand">
          <div className="brand-badge"><Shield size={20} /></div>
          <div>
            <div className="brand-name">Pardella</div>
            <div className="brand-sub">Collaborative legal discussion, living advices, and tracked revisions.</div>
          </div>
        </div>
        <nav className="nav">
          <button className={page === 'home' ? 'action-btn' : 'ghost-btn'} onClick={() => setPage('home')}><Home size={16} /> Home</button>
          <button className={page === 'library' ? 'action-btn' : 'ghost-btn'} onClick={() => setPage('library')}><Library size={16} /> Library</button>
          <button className={page === 'upload' ? 'action-btn' : 'ghost-btn'} onClick={() => setPage('upload')}><Upload size={16} /> Upload</button>
          {!signedIn ? (
            <button className={page === 'auth' ? 'action-btn' : 'ghost-btn'} onClick={() => setPage('auth')}><UserCircle2 size={16} /> Lawyer login</button>
          ) : (
            <>
              {profile?.role === 'admin' && <Link className="ghost-btn" href="/admin">Admin</Link>}
              <button className="ghost-btn" onClick={onSignOut}>Sign out</button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function LoginCard({
  onSignedIn,
}: {
  onSignedIn: () => void;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!supabase) {
      setError('Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email, role: 'member' },
          },
        });
        if (error) throw error;
        if (data.user) {
          setSuccess('Account created. If email confirmation is enabled in Supabase, confirm the email and then sign in.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSignedIn();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-shell card card-pad">
      <h2 className="section-title">Member access</h2>
      <p className="section-copy">Create an account or sign in. Pardella uses Supabase for real authentication and stored legal discussion.</p>
      <div className="tab-row">
        <button className={mode === 'signin' ? 'active' : ''} onClick={() => setMode('signin')}>Sign in</button>
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>Create account</button>
      </div>
      <form className="stack" onSubmit={submit}>
        {mode === 'signup' && <input className="input" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />}
        <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div className="hero-actions">
          <button className="action-btn" type="submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}</button>
          <button className="ghost-btn" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </form>
      {error && <div className="error-box">{error}</div>}
      {success && <div className="success-box">{success}</div>}
      <div className="footer-note">
        This build treats uploaded files as originals and keeps a separate live editable working copy for revisions and admin decisions.
      </div>
    </div>
  );
}

function UploadCard({
  signedIn,
  onUploaded,
}: {
  signedIn: boolean;
  onUploaded: () => void;
}) {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [area, setArea] = useState('Property');
  const [jurisdiction, setJurisdiction] = useState('QLD');
  const [type, setType] = useState('Advice');
  const [workingText, setWorkingText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (!supabase) {
      setError('Supabase is not connected.');
      return;
    }
    if (!signedIn) {
      setError('Sign in before uploading.');
      return;
    }
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const user = authData.user;
      if (!user) throw new Error('No signed-in user found.');

      let originalFileUrl: string | null = null;
      let originalFileName: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('resources').upload(path, file, { upsert: false });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('resources').getPublicUrl(path);
        originalFileUrl = data.publicUrl;
        originalFileName = file.name;
      }

      const payload = {
        title: title.trim(),
        summary: summary.trim() || null,
        area,
        jurisdiction,
        type,
        current_content: workingText.trim() || null,
        original_file_url: originalFileUrl,
        original_file_name: originalFileName,
        created_by: user.id,
      };

      const { data: inserted, error: insertError } = await supabase
        .from('resources')
        .insert(payload)
        .select('id')
        .single();
      if (insertError) throw insertError;

      if (workingText.trim()) {
        const { error: revError } = await supabase.from('revisions').insert({
          resource_id: inserted.id,
          content: workingText,
          status: 'accepted',
          note: 'Initial working copy on upload',
          created_by: user.id,
        });
        if (revError) throw revError;
      }

      setMessage('Resource uploaded. It now appears on the homepage and library.');
      setTitle('');
      setSummary('');
      setWorkingText('');
      setFile(null);
      onUploaded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card card-pad">
      <h2 className="section-title">Upload an original and create a live working copy</h2>
      <p className="section-copy">Upload the original document, then add the current editable working text. The original stays accessible. The working copy becomes the basis for comments, revisions, and admin decisions.</p>
      <form className="stack" onSubmit={submit}>
        <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <textarea className="textarea" placeholder="Summary or issue note" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <div className="search-row">
          <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
            <option>Property</option>
            <option>Commercial</option>
            <option>Litigation</option>
            <option>Planning & Environment</option>
            <option>Construction</option>
            <option>Tax</option>
          </select>
          <select className="select" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
            <option>QLD</option>
            <option>Federal</option>
            <option>NSW</option>
            <option>National</option>
          </select>
          <select className="select" value={type} onChange={(e) => setType(e.target.value)}>
            <option>Advice</option>
            <option>Checklist</option>
            <option>Case note</option>
            <option>Research memo</option>
            <option>Submission</option>
          </select>
          <label className="soft-btn" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
            <input type="file" hidden onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file ? file.name : 'Choose original file'}
          </label>
        </div>
        <textarea className="textarea editor" placeholder="Paste the current live working text here. This is the editable copy that members can discuss and revise." value={workingText} onChange={(e) => setWorkingText(e.target.value)} />
        <div className="hero-actions">
          <button className="action-btn" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Upload resource'}</button>
        </div>
      </form>
      {error && <div className="error-box">{error}</div>}
      {message && <div className="success-box">{message}</div>}
    </div>
  );
}

function HomeView({ resources }: { resources: Resource[] }) {
  return (
    <div className="stack">
      <section className="grid-2">
        <div className="card card-pad">
          <div className="eyebrow">
            <span className="badge">Living documents</span>
            <span className="badge">Tracked admin decisions</span>
            <span className="badge">Open legal discussion</span>
          </div>
          <h1 className="hero-title">Pardella turns legal work into living documents, not static uploads.</h1>
          <p className="hero-copy">
            Members upload original materials, maintain a live editable working copy, debate objections in comments, and keep every admin acceptance or rejection visible. The goal is practical legal accuracy, current case law awareness, and transparent refinement.
          </p>
          <div className="hero-actions">
            <Link href="#recent" className="action-btn">See latest uploads</Link>
            <Link href="/admin" className="ghost-btn">Admin decisions</Link>
          </div>
        </div>
        <div className="card card-pad">
          <div className="stats-grid">
            <div className="stat-box"><div className="stat-value">{resources.length}</div><div className="stat-label">Resources in discussion</div></div>
            <div className="stat-box"><div className="stat-value">Original + live</div><div className="stat-label">Every upload retains the original and a working copy</div></div>
            <div className="stat-box"><div className="stat-value">Comments</div><div className="stat-label">Objections and new information sit beside the document</div></div>
            <div className="stat-box"><div className="stat-value">History</div><div className="stat-label">Admin decisions remain visible and disputable</div></div>
          </div>
          <div className="notice">
            MVP note: in-browser editing is implemented as a live working text version. Original PDFs/DOCX files remain separately accessible and untouched.
          </div>
        </div>
      </section>

      <section id="recent" className="card card-pad">
        <h2 className="section-title">Latest uploads</h2>
        <p className="section-copy">Newest to oldest. Click any document to open the live discussion page and the current working copy.</p>
        {resources.length === 0 ? (
          <div className="empty">No resources yet. Upload one to make it appear here.</div>
        ) : (
          <div className="home-recent-grid">
            {resources.map((resource) => (
              <Link key={resource.id} href={`/resources/${resource.id}`} className="resource-card">
                <div className="resource-head">
                  <div>
                    <h3 className="resource-title">{resource.title}</h3>
                    <div className="resource-meta">
                      {resource.area && <span className="badge">{resource.area}</span>}
                      {resource.jurisdiction && <span className="badge">{resource.jurisdiction}</span>}
                      {resource.type && <span className="badge">{resource.type}</span>}
                    </div>
                  </div>
                  <div className="tiny muted">{formatDate(resource.created_at)}</div>
                </div>
                <p className="muted">{resource.summary || 'No summary provided.'}</p>
                <div className="tiny linkish">Open live document →</div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LibraryView({ resources }: { resources: Resource[] }) {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const filtered = useMemo(() => resources.filter((resource) => {
    const q = query.toLowerCase();
    const matchesQuery = !q || [resource.title, resource.summary, resource.area, resource.jurisdiction, resource.type].join(' ').toLowerCase().includes(q);
    const matchesArea = area === 'All' || resource.area === area;
    const matchesJurisdiction = jurisdiction === 'All' || resource.jurisdiction === jurisdiction;
    return matchesQuery && matchesArea && matchesJurisdiction;
  }), [resources, query, area, jurisdiction]);

  return (
    <div className="stack">
      <div className="search-row">
        <input className="input" placeholder="Search title, issue, practice area, jurisdiction" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value)}>
          <option>All</option><option>Property</option><option>Commercial</option><option>Litigation</option><option>Planning & Environment</option><option>Construction</option><option>Tax</option>
        </select>
        <select className="select" value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
          <option>All</option><option>QLD</option><option>Federal</option><option>NSW</option><option>National</option>
        </select>
        <div className="soft-btn">{filtered.length} results</div>
      </div>
      <div className="recent-list">
        {filtered.map((resource) => (
          <Link key={resource.id} href={`/resources/${resource.id}`} className="resource-card">
            <div className="resource-head">
              <div>
                <h3 className="resource-title">{resource.title}</h3>
                <div className="resource-meta">
                  {resource.area && <span className="badge">{resource.area}</span>}
                  {resource.jurisdiction && <span className="badge">{resource.jurisdiction}</span>}
                  {resource.type && <span className="badge">{resource.type}</span>}
                </div>
              </div>
              <div className="tiny muted">{formatDate(resource.created_at)}</div>
            </div>
            <p className="muted">{resource.summary || 'No summary provided.'}</p>
            <div className="tiny linkish">Open document discussion →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Page() {
  const [page, setPage] = useState<'home' | 'library' | 'upload' | 'auth'>('home');
  const [resources, setResources] = useState<Resource[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signedIn, setSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!supabase) {
      setError('Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.');
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const session = sessionData.session;
    setSignedIn(Boolean(session));

    if (session?.user) {
      const { data: existingProfile } = await supabase.from('profiles').select('id, full_name, role').eq('id', session.user.id).maybeSingle();
      if (existingProfile) {
        setProfile(existingProfile as Profile);
      } else {
        const insertPayload = {
          id: session.user.id,
          full_name: (session.user.user_metadata?.full_name as string | undefined) || session.user.email || 'Member',
          role: 'member',
        };
        await supabase.from('profiles').insert(insertPayload);
        setProfile(insertPayload as Profile);
      }
    } else {
      setProfile(null);
    }

    const { data, error: resourceError } = await supabase
      .from('resources')
      .select('id, title, summary, area, jurisdiction, type, original_file_url, original_file_name, current_content, created_at, updated_at, created_by')
      .order('created_at', { ascending: false });
    if (resourceError) setError(resourceError.message);
    setResources((data || []) as Resource[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange(() => load());
    return () => data.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSignedIn(false);
    setProfile(null);
    setPage('home');
  };

  return (
    <div className="page-shell">
      <Header page={page} setPage={(p) => setPage(p as typeof page)} signedIn={signedIn} profile={profile} onSignOut={signOut} />
      <main className="main">
        <div className="container stack">
          {!isSupabaseConfigured() && (
            <div className="notice">Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel, then create the schema and the <code>resources</code> storage bucket.</div>
          )}
          {error && <div className="error-box">{error}</div>}
          {loading ? (
            <div className="card card-pad">Loading Pardella…</div>
          ) : page === 'home' ? (
            <HomeView resources={resources} />
          ) : page === 'library' ? (
            <LibraryView resources={resources} />
          ) : page === 'upload' ? (
            <UploadCard signedIn={signedIn} onUploaded={load} />
          ) : (
            <LoginCard onSignedIn={load} />
          )}
        </div>
      </main>
    </div>
  );
}
