export type Resource = {
  id: string;
  title: string;
  summary: string | null;
  area: string | null;
  jurisdiction: string | null;
  type: string | null;
  current_content: string | null;
  original_file_url: string | null;
  original_file_name: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string | null;
  author_alias: string;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
};

export type Comment = {
  id: string;
  resource_id: string;
  user_id: string | null;
  body: string;
  created_at: string;
  author_label: string | null;
};

export type Revision = {
  id: string;
  resource_id: string;
  user_id: string | null;
  content: string;
  note: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  author_label: string | null;
};

export type AdminDecision = {
  id: string;
  resource_id: string;
  revision_id: string | null;
  admin_user_id: string | null;
  decision: 'accepted' | 'rejected';
  reason: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string | null;
  role: 'member' | 'admin';
};

export type ResourceFile = {
  id: string;
  resource_id: string;
  file_url: string;
  file_name: string;
  version_number: number;
  uploaded_by: string | null;
  uploader_alias: string;
  note: string | null;
  created_at: string;
};
Sent
Write to
