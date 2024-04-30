import { Button } from '@/components/ui/button';
import {
  OrganizationSwitcher,
  SignInButton,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export function Header() {
  return (
    <div className="relative z-10 border-b py-4 bg-gray-50">
      <div className="flex container mx-auto justify-between">
        <div>FileDrive</div>
        <div className="flex gap-2">
          <OrganizationSwitcher />
          <UserButton />
          {/* ログアウト状態に表示 */}
          <SignedOut>
            <SignInButton>
              <Button>Sign In</Button>
            </SignInButton>
          </SignedOut>
        </div>
      </div>
    </div>
  );
}
