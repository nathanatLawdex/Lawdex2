"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  FileText,
  Filter,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Plus,
  Search,
  Shield,
  Star,
  Upload,
  UserCircle2,
  Users,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

type PracticeArea = "Property" | "Leasing" | "Litigation" | "Commercial" | "Planning & Environment";
type Jurisdiction = "QLD" | "NSW" | "VIC" | "Federal" | "National";
type ResourceType = "Checklist" | "Advice Note" | "Precedent Pack" | "Research Note" | "Internal Note";

type Resource = {
  id: string;
  title: string;
  area: PracticeArea;
  jurisdiction: Jurisdiction;
  type: ResourceType;
  summary: string;
  tags: string[];
  created_at: string;
  author_alias: string;
  file_url?: string | null;
  file_name?: string | null;
};

const statCards = [
  { label: "Shared resources", value: "Live" },
  { label: "Member accounts", value: "Real" },
  { label: "Data storage", value: "Live" },
  { label: "Next step", value: "Moderation" },
];

const demoResources: Resource[] = [
  {
    id: "demo-1",
    title: "Retail lease option exercise checklist",
    area: "Leasing",
    jurisdiction: "QLD",
    type: "Checklist",
    summary: "Practical workflow for reviewing lease terms, diarising dates, serving notices, and checking registration issues.",
    tags: ["retail shop lease", "option", "notice", "registration"],
    created_at: "2026-03-15",
    author_alias: "Anon Practitioner 14",
    file_url: null,
    file_name: null,
  },
  {
    id: "demo-2",
    title: "Seller disclosure defects memo",
    area: "Property",
    jurisdiction: "QLD",
    type: "Advice Note",
    summary: "Short-form advice structure identifying disclosure issues, risk points, and suggested client communication wording.",
    tags: ["seller disclosure", "contract", "risk", "property"],
    created_at: "2026-03-12",
    author_alias: "Regional Solicitor 03",
    file_url: null,
    file_name: null,
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span style={badgeStyle}>{children}</span>;
}

function Button({ children, variant = "primary", style, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  return (
    <button
      {...props}
      style={{
        ...buttonBaseStyle,
        ...(variant === "primary" ? primaryButtonStyle : variant === "secondary" ? secondaryButtonStyle : ghostButtonStyle),
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ ...cardStyle, ...style }}>{children}</div>;
}

function TextInput({ icon: Icon, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { icon?: React.ComponentType<{ size?: number; color?: string }> }) {
  return (
    <div style={inputWrapperStyle}>
      {Icon ? <Icon size={16} color="#94a3b8" /> : null}
      <input {...props} style={inputStyle} />
    </div>
  );
}

function SelectInput({ value, onChange, children }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={inputWrapperStyle}>
      <select value={value} onChange={onChange} style={selectStyle}>
        {children}
      </select>
    </div>
  );
}

function AuthPanel({ onAuthed }: { onAuthed: (session: Session) => void }) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase is not connected yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel environment variables.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: "member",
            },
          },
        });
        if (error) throw error;
        if (data.session) {
          onAuthed(data.session);
        } else {
          setMessage("Account created. Check your email to confirm the account.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) onAuthed(data.session);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card style={{ maxWidth: 560, margin: "0 auto" }}>
      <h2 style={sectionTitleStyle}>Member access</h2>
      <p style={mutedStyle}>Create a real account or sign in. This is connected to Supabase auth once your environment variables are set.</p>

      <div style={{ display: "flex", gap: 8, marginTop: 20, marginBottom: 20, background: "#f1f5f9", padding: 6, borderRadius: 16 }}>
        <button type="button" onClick={() => setMode("login")} style={mode === "login" ? activeTabStyle : inactiveTabStyle}>Sign in</button>
        <button type="button" onClick={() => setMode("signup")} style={mode === "signup" ? activeTabStyle : inactiveTabStyle}>Create account</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14 }}>
        {mode === "signup" && (
          <TextInput icon={UserCircle2} placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        )}
        <TextInput icon={Mail} type="email" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <TextInput icon={KeyRound} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}</Button>
          <Button type="button" variant="secondary" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Need an account?" : "Already have an account?"}</Button>
        </div>
      </form>

      {message ? <div style={successBoxStyle}>{message}</div> : null}
      {error ? <div style={errorBoxStyle}>{error}</div> : null}
    </Card>
  );
}

function UploadForm({ userEmail, onSaved }: { userEmail: string; onSaved: (r: Resource) => void }) {
  const [title, setTitle] = useState("");
  const [area, setArea] = useState<PracticeArea>("Property");
  const [jurisdiction, setJurisdiction] = useState<Jurisdiction>("QLD");
  const [type, setType] = useState<ResourceType>("Advice Note");
  const [summary, setSummary] = useState("");
  const [tags, setTags] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!supabase) {
      setError("Supabase is not connected yet.");
      return;
    }

    if (!title.trim() || !summary.trim()) {
      setError("Title and summary are required.");
      return;
    }

    setBusy(true);
    try {
      let fileUrl: string | null = null;
      let fileName: string | null = null;

      if (file) {
        const safeName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
        const bucketPath = `${safeName}`;
        const upload = await supabase.storage.from("resources").upload(bucketPath, file, { upsert: false });
        if (upload.error) throw upload.error;

        const publicUrlResult = supabase.storage.from("resources").getPublicUrl(bucketPath);
        fileUrl = publicUrlResult.data.publicUrl;
        fileName = file.name;
      }

      const payload = {
        title: title.trim(),
        area,
        jurisdiction,
        type,
        summary: summary.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        author_alias: userEmail.split("@")[0],
        file_url: fileUrl,
        file_name: fileName,
      };

      const { data, error } = await supabase.from("resources").insert(payload).select().single();
      if (error) throw error;

      onSaved(data as Resource);
      setMessage("Resource saved.");
      setTitle("");
      setSummary("");
      setTags("");
      setFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save resource.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <h2 style={sectionTitleStyle}>Upload a redacted resource</h2>
      <p style={mutedStyle}>This saves real data to Supabase. If you create the storage bucket, it will also upload files.</p>
      <form onSubmit={handleUpload} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <TextInput placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div style={twoColStyle}>
          <SelectInput value={area} onChange={(e) => setArea(e.target.value as PracticeArea)}>
            <option>Property</option>
            <option>Leasing</option>
            <option>Litigation</option>
            <option>Commercial</option>
            <option>Planning &amp; Environment</option>
          </SelectInput>
          <SelectInput value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value as Jurisdiction)}>
            <option>QLD</option>
            <option>NSW</option>
            <option>VIC</option>
            <option>Federal</option>
            <option>National</option>
          </SelectInput>
        </div>
        <SelectInput value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
          <option>Advice Note</option>
          <option>Checklist</option>
          <option>Precedent Pack</option>
          <option>Research Note</option>
          <option>Internal Note</option>
        </SelectInput>
        <textarea style={textareaStyle} rows={5} placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
        <TextInput placeholder="Tags separated by commas" value={tags} onChange={(e) => setTags(e.target.value)} />
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button type="submit" disabled={busy}><span style={inlineIconTextStyle}><Upload size={16} />{busy ? "Saving..." : "Save resource"}</span></Button>
        </div>
      </form>
      {message ? <div style={successBoxStyle}>{message}</div> : null}
      {error ? <div style={errorBoxStyle}>{error}</div> : null}
    </Card>
  );
}

export default function Page() {
  const [page, setPage] = useState<"home" | "auth" | "library" | "upload" | "admin">("home");
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [resources, setResources] = useState<Resource[]>(demoResources);
  const [query, setQuery] = useState("");
  const [areaFilter, setAreaFilter] = useState("All");
  const [jurisdictionFilter, setJurisdictionFilter] = useState("All");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    async function boot() {
      if (!supabase) {
        setAuthChecked(true);
        return;
      }
      const sessionResult = await supabase.auth.getSession();
      if (!ignore) {
        setSession(sessionResult.data.session ?? null);
        setAuthChecked(true);
      }
    }

    boot();

    if (!supabase) return;

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      ignore = true;
      authSub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    async function fetchResources() {
      if (!supabase || !session) return;
      const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
      if (error) {
        setLoadError(error.message);
        return;
      }
      setResources((data as Resource[])?.length ? (data as Resource[]) : []);
    }

    fetchResources();
  }, [session]);

  const filtered = useMemo(() => {
    return resources.filter((item) => {
      const matchesQuery = !query || [item.title, item.summary, ...(item.tags ?? []), item.area, item.jurisdiction].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchesArea = areaFilter === "All" || item.area === areaFilter;
      const matchesJurisdiction = jurisdictionFilter === "All" || item.jurisdiction === jurisdictionFilter;
      return matchesQuery && matchesArea && matchesJurisdiction;
    });
  }, [resources, query, areaFilter, jurisdictionFilter]);

  async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setPage("home");
  }

  const memberLabel = session?.user?.user_metadata?.full_name || session?.user?.email || "Member";

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <header style={headerStyle}>
        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={logoBoxStyle}><Shield size={20} /></div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>CounselCache</div>
              <div style={{ color: "#64748b", fontSize: 12 }}>Anonymous practical know-how for lawyers</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <Button variant={page === "home" ? "primary" : "ghost"} onClick={() => setPage("home")}>Home</Button>
            <Button variant={page === "library" ? "primary" : "ghost"} onClick={() => setPage("library")}>Library</Button>
            <Button variant={page === "upload" ? "primary" : "ghost"} onClick={() => setPage("upload")}>Upload</Button>
            {!session ? (
              <Button variant="secondary" onClick={() => setPage("auth")}>Lawyer login</Button>
            ) : (
              <>
                <span style={{ color: "#475569", fontSize: 14 }}>Signed in as <strong>{memberLabel}</strong></span>
                <Button variant="secondary" onClick={signOut}><span style={inlineIconTextStyle}><LogOut size={16} />Sign out</span></Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main style={{ ...containerStyle, paddingTop: 32, paddingBottom: 32 }}>
        {page === "home" && (
          <div style={{ display: "grid", gap: 24 }}>
            <section style={heroGridStyle}>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                    <Badge>Anonymous uploads</Badge>
                    <Badge>Lawyer-only access</Badge>
                    <Badge>Real auth & data</Badge>
                  </div>
                  <h1 style={heroTitleStyle}>Precedent Sharing for Lawyers.</h1>
                  <p style={heroTextStyle}>Lawyers create accounts, upload redacted advice, precedents, and checklists, and search a practical resource bank built for day-to-day work.</p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 24 }}>
                    <Button onClick={() => setPage(session ? "library" : "auth")}>Explore the library</Button>
                    <Button variant="secondary" onClick={() => setPage("auth")}>Create account</Button>
                  </div>
                </Card>
              </motion.div>
              <Card>
                <div style={statsGridStyle}>
                  {statCards.map((item) => (
                    <div key={item.label} style={statBoxStyle}>
                      <div style={{ fontSize: 24, fontWeight: 700 }}>{item.value}</div>
                      <div style={mutedStyle}>{item.label}</div>
                    </div>
                  ))}
                </div>
                <div style={warningBoxStyle}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertTriangle size={16} />
                    <div>
                      <div style={{ fontWeight: 700 }}>Important product note</div>
                      <div style={{ marginTop: 6, lineHeight: 1.6 }}>Before public launch, add moderation, redaction controls, contributor warranties, and a clear disclaimer that resources are practitioner aids, not definitive legal advice.</div>
                    </div>
                  </div>
                </div>
              </Card>
            </section>

            <section style={featureGridStyle}>
              {[
                [Lock, "Private member access", "Real sign-up and sign-in using Supabase authentication."],
                [Upload, "Real data saving", "Resources are stored in a live database and can be uploaded with metadata."],
                [Search, "Fast issue-based search", "Filter by practice area, jurisdiction, type, and keywords."],
                [Shield, "Redaction & moderation", "Next step: approval queue and admin roles."],
                [Users, "Community knowledge", "A practical bank of reusable work product."],
                [FileText, "Built for lawyers", "Focused on precedents, advice notes, and checklists."],
              ].map(([Icon, title, text]) => {
                const FeatureIcon = Icon as typeof Lock;
                return (
                  <Card key={String(title)}>
                    <div style={featureIconBoxStyle}><FeatureIcon size={18} /></div>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>{title as string}</div>
                    <p style={{ ...mutedStyle, lineHeight: 1.7, marginTop: 8 }}>{text as string}</p>
                  </Card>
                );
              })}
            </section>
          </div>
        )}

        {page === "auth" && (
          authChecked ? (session ? (
            <Card style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 style={sectionTitleStyle}>You are signed in</h2>
              <p style={mutedStyle}>Welcome back, {memberLabel}.</p>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <Button onClick={() => setPage("library")}>Go to library</Button>
                <Button variant="secondary" onClick={signOut}>Sign out</Button>
              </div>
            </Card>
          ) : <AuthPanel onAuthed={(s) => { setSession(s); setPage("library"); }} />) : <Card><div>Checking authentication…</div></Card>
        )}

        {page === "library" && (
          session ? (
            <div style={{ display: "grid", gap: 20 }}>
              <div style={filterGridStyle}>
                <TextInput icon={Search} placeholder="Search issue, keyword, matter type, or precedent" value={query} onChange={(e) => setQuery(e.target.value)} />
                <SelectInput value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                  <option>All</option>
                  <option>Property</option>
                  <option>Leasing</option>
                  <option>Litigation</option>
                  <option>Commercial</option>
                  <option>Planning &amp; Environment</option>
                </SelectInput>
                <SelectInput value={jurisdictionFilter} onChange={(e) => setJurisdictionFilter(e.target.value)}>
                  <option>All</option>
                  <option>QLD</option>
                  <option>NSW</option>
                  <option>VIC</option>
                  <option>Federal</option>
                  <option>National</option>
                </SelectInput>
                <Button variant="secondary"><span style={inlineIconTextStyle}><Filter size={16} />Filters</span></Button>
              </div>

              {loadError ? <div style={errorBoxStyle}>{loadError}</div> : null}

              {filtered.length === 0 ? (
                <Card>
                  <div style={{ fontWeight: 700 }}>No resources yet</div>
                  <p style={mutedStyle}>Upload the first resource and it will appear here.</p>
                </Card>
              ) : filtered.map((doc) => (
                <Card key={doc.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                        <Badge>{doc.area}</Badge>
                        <Badge>{doc.jurisdiction}</Badge>
                        <Badge>{doc.type}</Badge>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>{doc.title}</div>
                      <p style={{ ...mutedStyle, lineHeight: 1.7, marginTop: 8 }}>{doc.summary}</p>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                        {(doc.tags ?? []).map((tag) => <span key={tag} style={tagStyle}>#{tag}</span>)}
                      </div>
                      <div style={{ color: "#64748b", fontSize: 12, marginTop: 14 }}>Uploaded by {doc.author_alias} · {new Date(doc.created_at).toLocaleDateString()}</div>
                    </div>
                    <div style={{ width: 220, display: "grid", gap: 10 }}>
                      {doc.file_url ? (
                        <a href={doc.file_url} target="_blank" rel="noreferrer"><Button style={{ width: "100%" }}>Open file</Button></a>
                      ) : (
                        <Button style={{ width: "100%" }} disabled>No file attached</Button>
                      )}
                      <Button variant="secondary" style={{ width: "100%" }}><span style={inlineIconTextStyle}><Star size={16} />Save</span></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 style={sectionTitleStyle}>Members only</h2>
              <p style={mutedStyle}>Sign in to access the resource library.</p>
              <div style={{ marginTop: 20 }}><Button onClick={() => setPage("auth")}>Go to login</Button></div>
            </Card>
          )
        )}

        {page === "upload" && (
          session ? <UploadForm userEmail={session.user.email || "member@example.com"} onSaved={(r) => { setResources((prev) => [r, ...prev]); setPage("library"); }} /> : (
            <Card style={{ maxWidth: 560, margin: "0 auto" }}>
              <h2 style={sectionTitleStyle}>Sign in required</h2>
              <p style={mutedStyle}>Only signed-in members can upload resources.</p>
              <div style={{ marginTop: 20 }}><Button onClick={() => setPage("auth")}>Go to login</Button></div>
            </Card>
          )
        )}

        {page === "admin" && (
          <Card>
            <h2 style={sectionTitleStyle}>Admin area</h2>
            <p style={mutedStyle}>Next step: add role-based access so only admins can view moderation items.</p>
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              {[
                "Building defects advice note",
                "Commercial lease make-good checklist",
                "Letter of demand template with annotations",
              ].map((item, index) => (
                <div key={item} style={adminRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item}</div>
                    <div style={{ color: "#64748b", fontSize: 13, marginTop: 4 }}>Submitted by Anon Contributor {index + 11}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <Button variant="secondary"><span style={inlineIconTextStyle}><Eye size={16} />Review</span></Button>
                    <Button>Approve</Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {!isSupabaseConfigured && (
          <div style={{ ...warningBoxStyle, marginTop: 24 }}>
            <div style={{ fontWeight: 700 }}>Supabase is not connected yet</div>
            <div style={{ marginTop: 8, lineHeight: 1.7 }}>Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in Vercel. Then run the SQL in <code>supabase/schema.sql</code> and create a bucket called <code>resources</code>.</div>
          </div>
        )}
      </main>
    </div>
  );
}

const containerStyle: React.CSSProperties = { maxWidth: 1180, margin: "0 auto", paddingLeft: 24, paddingRight: 24 };
const headerStyle: React.CSSProperties = { position: "sticky", top: 0, zIndex: 20, borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", paddingTop: 14, paddingBottom: 14 };
const logoBoxStyle: React.CSSProperties = { width: 40, height: 40, borderRadius: 16, background: "#0f172a", color: "white", display: "grid", placeItems: "center" };
const cardStyle: React.CSSProperties = { background: "white", border: "1px solid #e2e8f0", borderRadius: 24, padding: 24, boxShadow: "0 2px 12px rgba(15,23,42,0.05)" };
const badgeStyle: React.CSSProperties = { display: "inline-flex", alignItems: "center", padding: "6px 12px", borderRadius: 999, border: "1px solid #e2e8f0", fontSize: 12, fontWeight: 600, color: "#334155", background: "rgba(255,255,255,0.85)" };
const buttonBaseStyle: React.CSSProperties = { borderRadius: 16, padding: "12px 16px", fontWeight: 700, border: 0, cursor: "pointer" };
const primaryButtonStyle: React.CSSProperties = { background: "#0f172a", color: "white" };
const secondaryButtonStyle: React.CSSProperties = { background: "white", color: "#0f172a", border: "1px solid #e2e8f0" };
const ghostButtonStyle: React.CSSProperties = { background: "transparent", color: "#334155" };
const inputWrapperStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10, border: "1px solid #e2e8f0", borderRadius: 16, padding: "12px 14px", background: "white" };
const inputStyle: React.CSSProperties = { border: 0, outline: "none", width: "100%", background: "transparent" };
const selectStyle: React.CSSProperties = { border: 0, outline: "none", width: "100%", background: "transparent" };
const textareaStyle: React.CSSProperties = { border: "1px solid #e2e8f0", borderRadius: 16, padding: 14, outline: "none", width: "100%" };
const sectionTitleStyle: React.CSSProperties = { fontSize: 28, fontWeight: 800, margin: 0 };
const mutedStyle: React.CSSProperties = { color: "#64748b", fontSize: 14 };
const heroGridStyle: React.CSSProperties = { display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" };
const heroTitleStyle: React.CSSProperties = { fontSize: 44, lineHeight: 1.1, margin: 0, maxWidth: 700 };
const heroTextStyle: React.CSSProperties = { marginTop: 16, color: "#475569", lineHeight: 1.7, fontSize: 16, maxWidth: 760 };
const statsGridStyle: React.CSSProperties = { display: "grid", gap: 14, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" };
const statBoxStyle: React.CSSProperties = { background: "#f8fafc", borderRadius: 18, padding: 18 };
const warningBoxStyle: React.CSSProperties = { marginTop: 16, background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: 18, padding: 16 };
const featureGridStyle: React.CSSProperties = { display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" };
const featureIconBoxStyle: React.CSSProperties = { width: 48, height: 48, borderRadius: 18, background: "#f1f5f9", display: "grid", placeItems: "center", marginBottom: 16 };
const activeTabStyle: React.CSSProperties = { flex: 1, border: 0, background: "white", borderRadius: 12, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const inactiveTabStyle: React.CSSProperties = { flex: 1, border: 0, background: "transparent", borderRadius: 12, padding: "10px 14px", color: "#64748b", cursor: "pointer" };
const twoColStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" };
const successBoxStyle: React.CSSProperties = { marginTop: 16, background: "#ecfdf5", color: "#166534", border: "1px solid #bbf7d0", borderRadius: 16, padding: 14 };
const errorBoxStyle: React.CSSProperties = { marginTop: 16, background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", borderRadius: 16, padding: 14 };
const filterGridStyle: React.CSSProperties = { display: "grid", gap: 12, gridTemplateColumns: "minmax(0, 1.5fr) repeat(2, minmax(0, 0.7fr)) auto" };
const tagStyle: React.CSSProperties = { background: "#f1f5f9", color: "#475569", fontSize: 12, borderRadius: 999, padding: "6px 10px" };
const inlineIconTextStyle: React.CSSProperties = { display: "inline-flex", gap: 8, alignItems: "center" };
const adminRowStyle: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 18, padding: 14, flexWrap: "wrap" };
