'use client';

import { FileBrowser } from '@/app/dashboard/_components/file-browser';

export default function FavoritesPage() {
  return (
    <>
      <FileBrowser title="Favorites" isFavorite={true} />
    </>
  );
}
