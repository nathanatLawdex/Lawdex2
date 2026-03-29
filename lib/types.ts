export type Resource = {
  id: string;
  title: string;
  summary: string | null;
  area: string | null;
  jurisdiction: string | null;
  type: string | null;
  original_file_url: string | null;
  original_file_name: string | null;
  current_content: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
};

export type Comment = {
  id: string;
  resource_id: string;
  body: string;
  created_at: string;
  created_by: string | null;
  author_label: string | null;
};

export type Revision = {
  id: string;
  resource_id: string;
  content: string;
  created_at: string;
  created_by: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  note: string | null;
  author_label: string | null;
};

export type AdminDecision = {
  id: string;
  resource_id: string;
  revision_id: string | null;
  decision: 'accepted' | 'rejected';
  reason: string | null;
  created_at: string;
  decided_by: string | null;
  decider_label: string | null;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: 'member' | 'admin';
};
