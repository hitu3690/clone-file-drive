import { useOrganization, useUser } from '@clerk/nextjs';
import { useQuery } from 'convex/react';
import { api } from '@convex/_generated/api';
import { useState } from 'react';

export const useFiles = (isFavorite?: boolean) => {
  const organization = useOrganization();
  const user = useUser();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  // organization > userの優先度で、IDを取得
  const orgId: string | undefined =
    organization.isLoaded && user.isLoaded
      ? organization.organization?.id ?? user.user?.id
      : undefined;

  const files = useQuery(
    api.files.getFiles,
    orgId ? { orgId, type, query, isFavorite } : 'skip'
  );

  return {
    files,
    query,
    setQuery,
    type,
    setType,
  };
};
