import ResourceDetailClient from './ResourceDetailClient';

export default async function Page(props: any) {
  const resolved = await props.params;
  return <ResourceDetailClient id={resolved?.id ?? ''} />;
}
