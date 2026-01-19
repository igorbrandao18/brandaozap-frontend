'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  title: string;
  href: string;
  icon: string;
  badge?: number;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    href: '/whatsapp',
    icon: '📊',
  },
  {
    title: 'Chat',
    href: '/chat',
    icon: '💬',
  },
  {
    title: 'Contatos',
    href: '/contacts',
    icon: '👥',
  },
  {
    title: 'Conversas',
    href: '/conversations',
    icon: '📨',
  },
  {
    title: 'Fluxos',
    href: '/flows',
    icon: '🔄',
  },
  {
    title: 'Palavras-chave',
    href: '/keywords',
    icon: '🔑',
  },
  {
    title: 'Campanhas',
    href: '/campaigns',
    icon: '📢',
  },
  {
    title: 'Templates',
    href: '/templates',
    icon: '📝',
  },
  {
    title: 'Atendentes',
    href: '/agents',
    icon: '👤',
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">
          Brandao<span className="text-green-600">Zap</span>
        </h1>
        <p className="text-xs text-gray-500 mt-1">CRM de WhatsApp</p>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-green-50 text-green-700 font-semibold border-l-4 border-l-green-500'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="flex-1">{item.title}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-green-500 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          <p>BrandaoZap v1.0</p>
          <p className="mt-1">CRM de WhatsApp</p>
        </div>
      </div>
    </div>
  );
}
