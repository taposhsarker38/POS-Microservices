// app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            POS Microservices
          </h1>
          <p className="text-gray-600 mb-8">
            Modern Point of Sale System
          </p>
          
          <div className="space-y-4">
            <Link 
              href="/login" 
              className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-indigo-700 transition-colors block text-center"
            >
              Sign In
            </Link>
            
            <div className="text-sm text-gray-500">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-600 hover:underline">
                Contact administrator
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}