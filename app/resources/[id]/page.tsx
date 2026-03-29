import ResourceDetailClient from './ResourceDetailClient';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ResourcePage({ params }: PageProps) {
  const { id } = await params;
  return <ResourceDetailClient id={id} />;
}
