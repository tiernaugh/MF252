import Link from "next/link";
import { mockUser, mockOrganization } from "~/lib/mock-data";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-8">
              {/* Logo */}
              <Link href="/projects" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-stone-900 rounded-md flex items-center justify-center">
                  <span className="text-white font-bold text-sm">MF</span>
                </div>
                <span className="font-semibold text-stone-900">Many Futures</span>
              </Link>
              
              {/* Main nav */}
              <div className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/projects" 
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Projects
                </Link>
                <Link 
                  href="/episodes" 
                  className="text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Episodes
                </Link>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Org name (placeholder for Clerk's OrganizationSwitcher) */}
              <div className="hidden sm:block text-sm text-stone-600">
                {mockOrganization.name}
              </div>
              
              {/* User menu (placeholder for Clerk's UserButton) */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-stone-200 rounded-full flex items-center justify-center">
                  <span className="text-stone-600 text-xs font-medium">
                    {mockUser.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <span className="hidden sm:block text-sm text-stone-700">
                  {mockUser.email}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}