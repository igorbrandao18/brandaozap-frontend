import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <main className="text-center max-w-2xl">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-4">
            Brandao<span className="text-green-600">Zap</span>
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Sistema de Automação WhatsApp
          </p>
          <p className="text-gray-500">
            Conecte seu WhatsApp e automatize suas conversas
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="bg-gradient-to-r from-blue-600 to-green-600 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-green-700 transition-all transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg"
          >
            🚀 Começar Agora
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-800 mb-2">Rápido</h3>
            <p className="text-gray-600 text-sm">Conexão automática em segundos</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-800 mb-2">Seguro</h3>
            <p className="text-gray-600 text-sm">Seus dados protegidos</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-3">🤖</div>
            <h3 className="font-semibold text-gray-800 mb-2">Automático</h3>
            <p className="text-gray-600 text-sm">Respostas inteligentes</p>
          </div>
        </div>
      </main>
    </div>
  );
}
