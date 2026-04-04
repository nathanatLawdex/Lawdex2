import ResourceDetailClient from './ResourceDetailClient';

export default async function ResourcePage({ params }: any) {
  const resolvedParams = await params;
  const id = resolvedParams?.id ?? '';
  return <ResourceDetailClient id={id} />;
}
