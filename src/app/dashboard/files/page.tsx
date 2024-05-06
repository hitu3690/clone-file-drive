import { FileBrowser } from '@/app/dashboard/_components/file-browser';
import { api } from '@convex/_generated/api';
import { preloadQuery } from 'convex/nextjs';
import { auth } from '@clerk/nextjs/server';

export default async function FilesPage() {
  const { userId } = auth();
  const orgId: string | undefined = userId ?? undefined;

  const files = await preloadQuery(api.files.getFiles, {
    orgId: orgId ?? '',
    type: 'all',
  });

  return (
    <>
      <FileBrowser title="Your Files" preloadFiles={files} />
    </>
  );
}
