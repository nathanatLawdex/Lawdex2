'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Upload,
  Lock,
  Shield,
  FileText,
  Users,
  Filter,
  Star,
  Eye,
  Plus,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type Doc = {
  id: number;
  title: string;
  area: string;
  jurisdiction: string;
  type: string;
  authorAlias: string;
  firmHidden: boolean;
  uploadedAt: string;
  summary: string;
  tags: string[];
  starred: boolean;
  views: number;
  access: string;
};

const seedDocs: Doc[] = [
  {
    id: 1,
    title: 'Retail lease option exercise checklist',
    area: 'Leasing',
    jurisdiction: 'QLD',
    type: 'Checklist',
    authorAlias: 'Anon Practitioner 14',
    firmHidden: true,
    uploadedAt: '2026-03-15',
    summary:
      'Practical step-by-step workflow for reviewing lease terms, diarising dates, serving notices, and checking registration issues.',
    tags: ['retail shop lease', 'option', 'notice', 'registration'],
    starred: true,
    views: 143,
    access: 'Members',
  },
  {
    id: 2,
    title: 'Seller disclosure defects memo',
    area: 'Property',
    jurisdiction: 'QLD',
    type: 'Advice Note',
    authorAlias: 'Regional Solicitor 03',
    firmHidden: true,
    uploadedAt: '2026-03-12',
    summary:
      'Short-form advice structure identifying key disclosure issues, risk points, and suggested client communication wording.',
    tags: ['seller disclosure', 'contract', 'risk', 'property'],
    starred: false,
    views: 87,
    access: 'Members',
  },
  {
    id: 3,
    title: 'Debt recovery letter pack',
    area: 'Litigation',
    jurisdiction: 'National',
    type: 'Precedent Pack',
    authorAlias: 'City Lawyer 09',
    firmHidden: true,
    uploadedAt: '2026-03-10',
    summary:
      'Template sequence for first demand, final demand, and file-opening issue spotting notes for straightforward recoveries.',
    tags: ['debt recovery', 'letters', 'precedent', 'litigation'],
    starred: true,
    views: 201,
    access: 'Members',
  },
];

const statCards = [
  { label: 'Shared resources', value: '1,284' },
  { label: 'Verified contributors', value: '312' },
  { label: 'Practice areas', value: '24' },
  { label: 'Time saved per matter', value: '~1.8 hrs' },
];

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}

function Button({
  children,
  variant = 'primary',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  onClick?: () => void;
}) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

function Input({
  icon: Icon,
  value,
  placeholder,
  onChange,
}: {
  icon?: React.ComponentType<{ size?: number }>;
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="input-shell">
      {Icon ? <Icon size={16} /> : null}
      <input value={value} placeholder={placeholder} onChange={onChange} />
    </div>
  );
}

export default function HomePage() {
  const [page, setPage] = useState<'home' | 'auth' | 'library' | 'upload' | 'admin'>('home');
  const [query, setQuery] = useState('');
  const [practiceArea, setPracticeArea] = useState('All');
  const [jurisdiction, setJurisdiction] = useState('All');
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState(seedDocs);

  const filteredDocs = useMemo(() => {
    return uploadedDocs.filter((doc) => {
      const text = [doc.title, doc.summary, ...doc.tags, doc.area, doc.jurisdiction].join(' ').toLowerCase();
      const matchesQuery = !query || text.includes(query.toLowerCase());
      const matchesArea = practiceArea === 'All' || doc.area === practiceArea;
      const matchesJurisdiction = jurisdiction === 'All' || doc.jurisdiction === jurisdiction;
      return matchesQuery && matchesArea && matchesJurisdiction;
    });
  }, [uploadedDocs, query, practiceArea, jurisdiction]);

  const handleMockUpload = () => {
    const newDoc: Doc = {
      id: uploadedDocs.length + 1,
      title: 'Without prejudice settlement conference notes',
      area: 'Litigation',
      jurisdiction: 'QLD',
      type: 'Internal Note',
      authorAlias: 'Anon Contributor 27',
      firmHidden: true,
      uploadedAt: '2026-03-15',
      summary:
        'Uploaded anonymously with a short summary, issue tags, and a redacted structure suitable for fast reuse.',
      tags: ['settlement', 'litigation', 'redacted', 'conference'],
      starred: false,
      views: 0,
      access: 'Members',
    };
    setUploadedDocs([newDoc, ...uploadedDocs]);
    setShowUploadSuccess(true);
    setPage('library');
    window.setTimeout(() => setShowUploadSuccess(false), 2500);
  };

  return (
    <div className="page">
      <header className="header">
        <div className="container header-inner">
          <div className="brand">
            <div className="brand-box">
              <Shield size={18} />
            </div>
            <div>
              <div className="brand-title">CounselCache</div>
              <div className="brand-subtitle">Anonymous practical know-how for lawyers</div>
            </div>
          </div>

          <nav className="nav">
            <Button variant={page === 'home' ? 'primary' : 'ghost'} onClick={() => setPage('home')}>Home</Button>
            <Button variant={page === 'library' ? 'primary' : 'ghost'} onClick={() => setPage('library')}>Library</Button>
            <Button variant={page === 'upload' ? 'primary' : 'ghost'} onClick={() => setPage('upload')}>Upload</Button>
            <Button variant={page === 'admin' ? 'primary' : 'ghost'} onClick={() => setPage('admin')}>Admin</Button>
          </nav>

          <div className="actions">
            <Button variant="secondary" onClick={() => setPage('auth')}>
              Lawyer login
            </Button>
            <Button onClick={() => setPage('upload')}>Start sharing</Button>
          </div>
        </div>
      </header>

      <main className="container main">
        {page === 'home' && (
          <div className="stack">
            <section className="grid-hero">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <div className="card card-body-lg">
                  <div className="badges">
                    <Badge>Anonymous uploads</Badge>
                    <Badge>Lawyer-only access</Badge>
                    <Badge>Practical precedents</Badge>
                  </div>
                  <h1>A shared library for lawyers.</h1>
                  <p className="muted spaced">
                    Lawyers create member accounts, upload redacted advice, checklists, precedents, and matter notes,
                    and search a growing knowledge base built for real-world practice.
                  </p>
                  <div className="row mt-6">
                    <Button onClick={() => setPage('library')}>Explore the library</Button>
                    <Button variant="secondary" onClick={() => setPage('auth')}>See member flow</Button>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="card card-body">
                  <div className="stats">
                    {statCards.map((item) => (
                      <div className="stat" key={item.label}>
                        <div className="stat-value">{item.value}</div>
                        <div className="stat-label">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  <div className="notice">
                    <strong>Important product note</strong>
                    <div className="small mt-4">
                      This concept works best with strong moderation, redaction controls, contributor terms, practice-area tagging,
                      and a clear disclaimer that materials are shared as practitioner resources rather than definitive legal advice.
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>

            <section className="grid-3 mt-8">
              {[
                {
                  icon: Lock,
                  title: 'Private member access',
                  text: 'Invite-only or subscription-based access with firm accounts, individual users, and gated content.',
                },
                {
                  icon: Upload,
                  title: 'Anonymous knowledge uploads',
                  text: 'Users upload advice notes, precedents, checklists, and research with identifying details removed.',
                },
                {
                  icon: Search,
                  title: 'Fast issue-based search',
                  text: 'Search by practice area, jurisdiction, issue, document type, keyword, and popularity.',
                },
                {
                  icon: Shield,
                  title: 'Redaction & moderation',
                  text: 'Admin review queue, automatic redaction prompts, versioning, and reporting tools.',
                },
                {
                  icon: Users,
                  title: 'Community trust layer',
                  text: 'Contributor reputation, peer saves, upvotes, and used-in-practice indicators.',
                },
                {
                  icon: FileText,
                  title: 'Practical over theoretical',
                  text: 'Built around reusable work product and workflows, not bloated content libraries.',
                },
              ].map((feature) => {
                const Icon = feature.icon;
                return (
                  <div className="card card-body" key={feature.title}>
                    <div className="feature-icon"><Icon size={18} /></div>
                    <h3>{feature.title}</h3>
                    <p className="muted spaced small">{feature.text}</p>
                  </div>
                );
              })}
            </section>
          </div>
        )}

        {page === 'auth' && (
          <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <div className="card card-body-lg">
              <h2>Lawyer member login</h2>
              <p className="muted spaced small">
                This is a front-end prototype of the sign-in flow. In production, this would connect to secure authentication,
                email verification, and role-based access control.
              </p>
              <div className="stack mt-6">
                <Input placeholder="Work email" />
                <Input placeholder="Password" />
                <div className="grid-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <Button onClick={() => setPage('library')}>Sign in</Button>
                  <Button variant="secondary">Request access</Button>
                </div>
              </div>
              <div className="info-box mt-6">
                Suggested production controls: MFA, approved domains, contributor agreements, admin suspension, and audit logs.
              </div>
            </div>
          </div>
        )}

        {page === 'library' && (
          <div className="stack">
            <div className="toolbar">
              <Input icon={Search} value={query} placeholder="Search issue, keyword, matter type, or precedent" onChange={(e) => setQuery(e.target.value)} />
              <div className="select-shell">
                <select value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)}>
                  <option>All</option>
                  <option>Property</option>
                  <option>Leasing</option>
                  <option>Litigation</option>
                </select>
              </div>
              <div className="select-shell">
                <select value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)}>
                  <option>All</option>
                  <option>QLD</option>
                  <option>National</option>
                </select>
              </div>
              <Button variant="secondary">
                <Filter size={16} /> Filters
              </Button>
            </div>

            {showUploadSuccess && (
              <div className="success">
                <strong>Upload received</strong>
                <div className="small mt-4">Your mock document has been added anonymously to the library view.</div>
              </div>
            )}

            <div className="doc-list">
              {filteredDocs.map((doc) => (
                <div className="card doc-card" key={doc.id}>
                  <div className="doc-wrap">
                    <div>
                      <div className="badges" style={{ marginBottom: 12 }}>
                        <Badge>{doc.area}</Badge>
                        <Badge>{doc.jurisdiction}</Badge>
                        <Badge>{doc.type}</Badge>
                        <Badge>{doc.access}</Badge>
                      </div>
                      <h3>{doc.title}</h3>
                      <p className="muted spaced small">{doc.summary}</p>
                      <div className="tags">
                        {doc.tags.map((tag) => (
                          <span className="tag" key={tag}>#{tag}</span>
                        ))}
                      </div>
                      <div className="doc-meta">
                        Uploaded by {doc.authorAlias} · {doc.uploadedAt} · Identity hidden: {doc.firmHidden ? 'Yes' : 'No'}
                      </div>
                    </div>
                    <div className="side-box">
                      <div className="info-box">
                        <div className="info-row"><span>Saves</span><span>{doc.starred ? 'High' : 'Moderate'}</span></div>
                        <div className="info-row mt-4"><span>Views</span><span>{doc.views}</span></div>
                      </div>
                      <Button>Open resource</Button>
                      <Button variant="secondary"><Star size={16} /> Save</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === 'upload' && (
          <div className="grid-2">
            <div className="card card-body-lg">
              <h2>Upload a redacted resource</h2>
              <p className="muted spaced small">
                Share practical work product while stripping identifying details. This mock form demonstrates the upload workflow only.
              </p>
              <div className="stack mt-6">
                <Input placeholder="Title of resource" />
                <div className="grid-2">
                  <div className="select-shell">
                    <select>
                      <option>Practice area</option>
                      <option>Property</option>
                      <option>Leasing</option>
                      <option>Litigation</option>
                      <option>Commercial</option>
                    </select>
                  </div>
                  <div className="select-shell">
                    <select>
                      <option>Jurisdiction</option>
                      <option>QLD</option>
                      <option>NSW</option>
                      <option>VIC</option>
                      <option>Federal</option>
                      <option>National</option>
                    </select>
                  </div>
                </div>
                <div className="textarea-shell">
                  <textarea rows={6} placeholder="Short summary, issue addressed, and why it is useful..." />
                </div>
                <div className="file-drop">Drag and drop file here or connect document storage</div>
                <div className="row">
                  <Button onClick={handleMockUpload}><Upload size={16} /> Upload anonymously</Button>
                  <Button variant="secondary">Save draft</Button>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="card card-body">
                <h3>Recommended moderation rules</h3>
                <div className="list-lines mt-4 small muted">
                  <div>• Remove client names, addresses, matter numbers, and opposing party details.</div>
                  <div>• Prohibit privileged, confidential, or court-restricted content.</div>
                  <div>• Require contributor confirmation that material can be shared lawfully.</div>
                  <div>• Route every upload through an admin approval queue before publication.</div>
                </div>
              </div>
              <div className="card card-body">
                <h3>Why this could work</h3>
                <p className="muted spaced small">
                  Most lawyers already create valuable internal know-how. The product value is in turning that scattered work into a searchable,
                  trusted, fast-access resource library.
                </p>
              </div>
            </div>
          </div>
        )}

        {page === 'admin' && (
          <div className="grid-admin">
            <div className="card card-body-lg">
              <div className="queue-row" style={{ marginBottom: 24 }}>
                <div>
                  <h2>Admin moderation queue</h2>
                  <p className="muted spaced small">Review uploads before releasing them into the shared library.</p>
                </div>
                <Badge>3 awaiting review</Badge>
              </div>
              <div className="stack">
                {[
                  'Building defects advice note',
                  'Commercial lease make-good checklist',
                  'Letter of demand template with annotations',
                ].map((item, index) => (
                  <div className="queue-item" key={item}>
                    <div className="queue-row">
                      <div>
                        <div style={{ fontWeight: 700 }}>{item}</div>
                        <div className="small muted spaced">Submitted by Anon Contributor {index + 11} · Needs redaction review</div>
                      </div>
                      <div className="row">
                        <Button variant="secondary"><Eye size={16} /> Review</Button>
                        <Button>Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="stack">
              <div className="card card-body">
                <h3>Suggested MVP stack</h3>
                <div className="list-lines mt-4 small muted">
                  <div><strong>Frontend:</strong> Next.js</div>
                  <div><strong>Backend:</strong> Supabase for auth, database, and storage</div>
                  <div><strong>Search:</strong> Postgres full-text search, Algolia, or Meilisearch</div>
                  <div><strong>Moderation:</strong> Admin dashboard + manual approval workflow</div>
                  <div><strong>Security:</strong> MFA, audit logs, encryption, terms acceptance</div>
                </div>
              </div>
              <div className="card card-body">
                <h3>Next build phases</h3>
                <div className="list-lines mt-4 small muted">
                  <div><Plus size={14} /> Real authentication and role permissions</div>
                  <div><Plus size={14} /> File uploads to cloud storage with virus scanning</div>
                  <div><Plus size={14} /> Structured metadata and advanced search filters</div>
                  <div><Plus size={14} /> Automated redaction assistance and reporting tools</div>
                  <div><Plus size={14} /> Billing, subscriptions, contributor analytics, and alerts</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
