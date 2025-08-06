import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'QuizBot Form',
  description: 'Interactive quiz web app with AI-generated questions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-16">
                <div className="flex items-center">
                  <h1 className="text-2xl font-bold text-primary-600">QuizBot Form</h1>
                </div>
                <nav className="flex space-x-4">
                  <a href="/" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Take Quiz
                  </a>
                  <a href="/admin" className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Admin
                  </a>
                </nav>
              </div>
            </div>
          </header>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}