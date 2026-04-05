'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const [tab, setTab] = useState<'home' | 'upload' | 'login'>('home');

  return (
    <main style={container}>
      <h1 style={title}>Pardella</h1>
      <p style={subtitle}>
        Collaborative legal discussion, living documents, tracked revisions.
      </p>

      <div style={nav}>
        {['home', 'upload', 'login'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              ...navBtn,
              ...(tab === t ? activeBtn : {}),
            }}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <div style={card}>
          <h2 style={heading}>Welcome</h2>
          <p style={text}>
            Upload a Word document, convert it into a live editable working copy,
            and collaborate without re-uploading files.
          </p>
        </div>
      )}

      {tab === 'upload' && <UploadSection />}

      {tab === 'login' && <LoginSection />}
    </main>
  );
}

/* ---------------- UPLOAD ---------------- */

function UploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');

  async function handleFile(e: any) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);

    if (f.name.endsWith('.docx')) {
      const mammoth = await import('mammoth/mammoth.browser');
      const buffer = await f.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buffer });

      const clean = result.value.replace(/\n{3,}/g, '\n\n').trim();
      setText(clean);
      setMsg('DOCX extracted — you can edit below');
    }
  }

  async function upload() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return alert('Login first');

    let url = null;

    if (file) {
      const path = `${Date.now()}-${file.name}`;
      await supabase.storage.from('resources').upload(path, file);
      url = supabase.storage.from('resources').getPublicUrl(path).data.publicUrl;
    }

    await supabase.from('resources').insert({
      title: 'Untitled',
      current_content: text,
      original_file_url: url,
      created_by: auth.user.id,
    });

    setMsg('Uploaded ✅');
  }

  return (
    <div style={card}>
      <h2 style={heading}>Upload Document</h2>

      <input type="file" onChange={handleFile} style={input} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Working document..."
        style={textarea}
      />

      <button onClick={upload} style={primaryBtn}>
        Upload
      </button>

      <p>{msg}</p>
    </div>
  );
}

/* ---------------- LOGIN ---------------- */

function LoginSection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function login() {
    await supabase.auth.signInWithPassword({ email, password });
    alert('Logged in');
  }

  return (
    <div style={card}>
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
    </div>
  );
}

/* ---------------- STYLES ---------------- */

const container = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 40,
  fontFamily: 'Inter, sans-serif',
};

const title = {
  textAlign: 'center' as const,
  fontSize: 36,
  fontWeight: 800,
};

const subtitle = {
  textAlign: 'center' as const,
  color: '#666',
  marginBottom: 20,
};

const nav = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 30,
};

const navBtn = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
};

const activeBtn = {
  background: '#111',
  color: '#fff',
};

const card = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #eee',
};

const heading = {
  fontSize: 22,
  marginBottom: 10,
};

const text = {
  color: '#555',
};

const input = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
};

const textarea = {
  width: '100%',
  height: 200,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  marginBottom: 10,
};

const primaryBtn = {
  padding: '10px 16px',
  background: '#111',
  color: '#fff',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
};
