'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, MessageCircle, LayoutGrid, TrendingUp } from 'lucide-react';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/chat', label: 'Chat', icon: MessageCircle },
  { href: '/health', label: 'Health', icon: LayoutGrid },
  { href: '/progress', label: 'Progress', icon: TrendingUp },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#FAF6F1] border-t border-[#EBE3DA] pb-safe">
      <div className="max-w-[430px] mx-auto">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${isActive ? 'text-[#E07A5F]' : 'text-[#B5AFA8] hover:text-[#8A8580]'}`}
              >
                <Icon
                  className={`w-6 h-6 ${isActive ? 'fill-current' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
