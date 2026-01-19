// API Endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  // WhatsApp
  whatsapp: {
    sessions: '/whatsapp/sessions',
    connect: '/whatsapp/connect',
    disconnect: '/whatsapp/disconnect/:sessionId',
    status: '/whatsapp/status/:sessionId',
    qrCode: '/whatsapp/qr-code/:sessionId',
  },
  // Messages
  messages: {
    send: '/messages/send',
    conversations: '/messages/conversations',
    conversation: '/messages/conversations/:chatId',
  },
  // Flows
  flows: {
    list: '/flows',
    create: '/flows',
    update: '/flows/:id',
    delete: '/flows/:id',
    get: '/flows/:id',
  },
  // Keywords
  keywords: {
    list: '/keywords',
    create: '/keywords',
    update: '/keywords/:id',
    delete: '/keywords/:id',
  },
  // Contacts
  contacts: {
    list: '/contacts',
    create: '/contacts',
    update: '/contacts/:id',
    delete: '/contacts/:id',
    import: '/contacts/import',
  },
  // Campaigns
  campaigns: {
    list: '/campaigns',
    create: '/campaigns',
    update: '/campaigns/:id',
    delete: '/campaigns/:id',
  },
  // Templates
  templates: {
    list: '/templates',
    get: '/templates/:id',
  },
} as const;
