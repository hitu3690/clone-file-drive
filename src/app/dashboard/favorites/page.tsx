import { FileBrowser } from '@/app/dashboard/_components/file-browser';
import { preloadQuery } from 'convex/nextjs';
import { auth } from '@clerk/nextjs/server';
import { api } from '@convex/_generated/api';

export default async function FavoritesPage() {
  const { userId } = auth();
  const orgId: string | undefined = userId ?? undefined;

  const files = await preloadQuery(api.files.getFiles, {
    orgId: orgId ?? '',
    isFavorite: true,
  });

  return (
    <>
      <FileBrowser title="Favorites" preloadFiles={files} />
    </>
  );
}
