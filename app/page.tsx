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
            onClick={() => setTab(t as 'home' | 'upload' | 'login')}
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

function UploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    setMsg('');
    setErr('');

    if (f.name.endsWith('.docx')) {
      try {
        const mammoth = await import('mammoth/mammoth.browser');
        const buffer = await f.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        const clean = result.value.replace(/\n{3,}/g, '\n\n').trim();
        setText(clean);
        setMsg('DOCX extracted — you can edit below.');
      } catch {
        setErr('Could not extract DOCX text.');
      }
    }
  }

  async function upload() {
    if (!supabase) {
      setErr('Supabase is not connected.');
      return;
    }

    setErr('');
    setMsg('');

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setErr('Login first.');
      return;
    }

    let url: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resources')
        .upload(path, file);

      if (uploadError) {
        setErr(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from('resources').getPublicUrl(path);
      url = data.publicUrl;
      fileName = file.name;
    }

    const { error } = await supabase.from('resources').insert({
  title: fileName || 'Untitled',
  summary: null,
  area: 'General',
  jurisdiction: null,
  type: file ? 'DOCX Upload' : 'Text Entry',
  current_content: text,
  original_file_url: url,
  original_file_name: fileName,
  created_by: auth.user.id,
});

    if (error) {
      setErr(error.message);
      return;
    }

    setMsg('Uploaded successfully.');
    setFile(null);
    setText('');
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

      {msg ? <p>{msg}</p> : null}
      {err ? <p style={{ color: 'red' }}>{err}</p> : null}
    </div>
  );
}

function LoginSection() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');

  async function login() {
    if (!supabase) {
      setErr('Supabase is not connected.');
      return;
    }

    setErr('');
    setMsg('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setErr(error.message);
      return;
    }

    setMsg('Logged in.');
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

      {msg ? <p>{msg}</p> : null}
      {err ? <p style={{ color: 'red' }}>{err}</p> : null}
    </div>
  );
}

const container: React.CSSProperties = {
  maxWidth: 900,
  margin: '0 auto',
  padding: 40,
  fontFamily: 'Inter, sans-serif',
};

const title: React.CSSProperties = {
  textAlign: 'center',
  fontSize: 36,
  fontWeight: 800,
};

const subtitle: React.CSSProperties = {
  textAlign: 'center',
  color: '#666',
  marginBottom: 20,
};

const nav: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 10,
  marginBottom: 30,
};

const navBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #ddd',
  background: '#fff',
  cursor: 'pointer',
};

const activeBtn: React.CSSProperties = {
  background: '#111',
  color: '#fff',
};

const card: React.CSSProperties = {
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #eee',
};

const heading: React.CSSProperties = {
  fontSize: 22,
  marginBottom: 10,
};

const text: React.CSSProperties = {
  color: '#555',
};

const input: React.CSSProperties = {
  width: '100%',
  padding: 10,
  marginBottom: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  boxSizing: 'border-box',
};

const textarea: React.CSSProperties = {
  width: '100%',
  height: 200,
  padding: 10,
  borderRadius: 8,
  border: '1px solid #ddd',
  marginBottom: 10,
  boxSizing: 'border-box',
};

const primaryBtn: React.CSSProperties = {
  padding: '10px 16px',
  background: '#111',
  color: '#fff',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
};
