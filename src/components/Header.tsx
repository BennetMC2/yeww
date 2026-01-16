'use client';

import Link from 'next/link';
import { User } from 'lucide-react';

interface HeaderProps {
  showProfile?: boolean;
}

export default function Header({ showProfile = true }: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 pt-8 pb-4">
      <Link href="/home" className="text-xl font-semibold text-[#E07A5F]">
        yeww
      </Link>
      {showProfile && (
        <Link
          href="/profile"
          className="w-10 h-10 rounded-full bg-[#F5EDE4] flex items-center justify-center text-[#8A8580] hover:bg-[#FFE8DC] hover:text-[#E07A5F] transition-colors"
        >
          <User className="w-5 h-5" />
        </Link>
      )}
    </header>
  );
}
