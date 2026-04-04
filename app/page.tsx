'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { Resource } from '@/lib/types';

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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

    load();
  }, []);

  return (
    <main className="main">
      <div className="container stack">
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
                <Link href="/upload" className="action-btn">
                  See latest uploads
                </Link>
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
            <div className="empty">Loading Pardella…</div>
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : resources.length ? (
            <div className="resource-list">
              {resources.map((resource) => (
                <Link
                  key={resource.id}
                  href={`/resources/${resource.id}`}
                  className="resource-card"
                >
                  <div className="resource-meta">
                    <span>{resource.area || 'Uncategorised'}</span>
                    <span>·</span>
                    <span>{resource.jurisdiction || 'Unknown jurisdiction'}</span>
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
      </div>
    </main>
  );
}
