import { OrganizationSwitcher, UserButton, UserProfile } from '@clerk/nextjs';

export function Header() {
  return (
    <div className="relative z-10 border-b py-4 bg-gray-50">
      <div className="flex container mx-auto justify-between">
        <div>FileDrive</div>
        <div className="flex gap-2">
          <OrganizationSwitcher />
          <UserButton />
        </div>
      </div>
    </div>
  );
}
