'use client';

import Link from 'next/link';

interface QuickAction {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'green' | 'blue' | 'purple' | 'orange';
}

const quickActions: QuickAction[] = [
  {
    title: 'Chat',
    description: 'Conversas e mensagens',
    icon: '💬',
    href: '/chat',
    color: 'green',
  },
  {
    title: 'Contatos',
    description: 'Gerenciar contatos',
    icon: '👥',
    href: '/contacts',
    color: 'blue',
  },
  {
    title: 'Fluxos',
    description: 'Automações e respostas',
    icon: '🔄',
    href: '/flows',
    color: 'purple',
  },
  {
    title: 'Campanhas',
    description: 'Disparos em massa',
    icon: '📢',
    href: '/campaigns',
    color: 'orange',
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Ações Rápidas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">
              {action.icon}
            </div>
            <h4 className="font-semibold text-gray-800 text-sm">{action.title}</h4>
            <p className="text-xs text-gray-600 mt-1">{action.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
