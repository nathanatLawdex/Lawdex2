'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Comment, Resource, Revision } from '@/lib/types';

export default function ResourceDetailClient({ id }: { id: string }) {
  const [resource, setResource] = useState<Resource | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!supabase) {
        setError('Supabase is not connected.');
        return;
      }

      const { data: resourceData, error: resourceError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();

      if (resourceError) {
        setError(resourceError.message);
        return;
      }

      setResource(resourceData);

      const { data: commentsData } = await supabase
        .from('comments')
        .select('*')
        .eq('resource_id', id);

      setComments(commentsData || []);

      const { data: revisionsData } = await supabase
        .from('revisions')
        .select('*')
        .eq('resource_id', id);

      setRevisions(revisionsData || []);
    }

    load();
  }, [id]);

  if (error) return <div style={{ padding: 20 }}>{error}</div>;
  if (!resource) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h1>{resource.title}</h1>

      <h2>Current Content</h2>
      <pre>{resource.current_content}</pre>

      <h2>Revisions</h2>
      {revisions.map((r) => (
        <div key={r.id}>
          <pre>{r.content}</pre>
        </div>
      ))}

      <h2>Comments</h2>
      {comments.map((c) => (
        <div key={c.id}>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  );
}
