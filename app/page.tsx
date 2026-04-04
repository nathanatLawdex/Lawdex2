import Link from 'next/link';
import { createServerSupabase } from '@/lib/server-supabase';
import { formatDate } from '@/lib/utils';
import type { Resource } from '@/lib/types';

export default async function HomePage() {
  const supabase = createServerSupabase();

  let resources: Resource[] = [];

  if (supabase) {
    const { data } = await supabase
      .from('resources')
      .select('*')
      .order('created_at', { ascending: false });

    resources = (data || []) as Resource[];
  }

  return (
    <main className="main">
      <div className="container stack">
        <section className="hero card card-pad">
          <div className="pill-row">
            <span className="pill">Pardella</span>
            <span className="pill">Collaborative legal discussion</span>
            <span className="pill">Originals preserved</span>
          </div>

          <h1 className="hero-title">
            A living library of legal analysis, objections, updates, and better answers.
          </h1>

          <p className="hero-copy">
            Pardella is a collaborative platform for discussing law openly, refining advice,
            preserving original source documents, and keeping working copies current as new
            authorities, objections, and reasoning emerge.
          </p>

          <div className="hero-actions">
            <Link href="/upload" className="action-btn">
              Upload a document
            </Link>
            <Link href="/admin" className="ghost-btn">
              Admin review
            </Link>
          </div>
        </section>

        <section className="card card-pad">
          <div className="split">
            <div>
              <h2 className="section-title">Latest uploads</h2>
              <p className="section-copy">
                Most recent to oldest. Open any resource to view the original document,
                working copy, comments, revisions, and decision history.
              </p>
            </div>
          </div>

          {resources.length ? (
            <div className="resource-list">
              {resources.map((resource) => (
                <Link
                  key={resource.id}
                  href={`/resources/${resource.id}`}
                  className="resource-card"
                >
                  <div className="resource-meta">
                    <span>{resource.area}</span>
                    <span>·</span>
                    <span>{resource.jurisdiction}</span>
                    <span>·</span>
                    <span>{resource.type}</span>
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
            <div className="empty">
              No resources yet. Upload the first document to start the library.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
