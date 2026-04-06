'use client';

import './globals.css';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <html lang="en">
      <body style={bodyStyle}>
        {/* NAVBAR */}
        <div style={nav}>
          <Link href="/" style={navBtn}>HOME</Link>
          <Link href="/" style={navBtn}>LIBRARY</Link>
          <Link href="/" style={navBtn}>UPLOAD</Link>

          {user ? (
            <button onClick={logout} style={navBtn}>
              LOGOUT
            </button>
          ) : (
            <Link href="/" style={navBtn}>
              LOGIN
            </Link>
          )}
        </div>

        {/* PAGE CONTENT */}
        <div style={container}>{children}</div>
      </body>
    </html>
  );
}

const bodyStyle: React.CSSProperties = {
  margin: 0,
  background: '#f4f6fa',
  fontFamily: 'Inter, Arial, sans-serif',
};

const container: React.CSSProperties = {
  maxWidth: 1000,
  margin: '0 auto',
  padding: 24,
};

const nav: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: 12,
  padding: 16,
  borderBottom: '1px solid #e5e7eb',
  background: '#fff',
  position: 'sticky',
  top: 0,
  zIndex: 100,
};

const navBtn: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 10,
  border: '1px solid #d1d5db',
  background: '#fff',
  textDecoration: 'none',
  color: '#111827',
  fontWeight: 700,
  cursor: 'pointer',
};
