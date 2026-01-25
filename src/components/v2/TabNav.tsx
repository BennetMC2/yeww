'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { href: '/v2', label: 'Today' },
  { href: '/v2/journey', label: 'Journey' },
  { href: '/v2/rewards', label: 'Rewards' },
];

export default function TabNav() {
  const pathname = usePathname();

  return (
    <nav className="flex justify-center gap-2 py-3">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href ||
          (tab.href === '/v2' && pathname === '/v2');

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
              isActive
                ? 'bg-[#2D2A26] text-white'
                : 'text-[#8A8580] hover:text-[#2D2A26] hover:bg-[#F5EDE4]'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
