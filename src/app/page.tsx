'use client';

import { Button } from '@/components/ui/button';
import { SignInButton } from '@clerk/clerk-react';
import {
  SignOutButton,
  SignedIn,
  SignedOut,
  useOrganization,
  useUser,
} from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function Home() {
  const organization = useOrganization();
  const user = useUser();

  // organization > userの優先度で、IDを取得
  const orgId: string | undefined =
    organization.isLoaded && user.isLoaded
      ? organization.organization?.id ?? user.user?.id
      : '';

  const files = useQuery(api.files.getFiles, orgId ? { orgId } : 'skip');
  const createFile = useMutation(api.files.createFile);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <SignedIn>
        <SignOutButton>
          <Button>Sign out</Button>
        </SignOutButton>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </SignedOut>

      {files?.map(({ _id, name }) => <div key={_id}>{name}</div>)}

      <Button
        onClick={() => {
          if (!orgId) return;

          return createFile({
            name: 'hello world',
            orgId,
          });
        }}
      >
        Click me
      </Button>
    </main>
  );
}
