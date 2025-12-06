import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import UserProfile from '@/components/UserProfile'
import { Menu, X, Calendar, User, LogIn } from 'lucide-react'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const { isAuthenticated, user } = useAuthStore()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (path: string) => {
    return location.pathname === path
  }

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Dienstleistungen', href: '/#servicos' },
    { name: 'Termin', href: '/agendar' },
    { name: 'Kontakt', href: '/#contato' },
    { name: 'Visuel IA', href: '/simulator' }
  ]

  const handleNavClick = (href: string) => {
    setIsMenuOpen(false)

    if (href.includes('#')) {
      const [path, section] = href.split('#')
      if (section && location.pathname === path) {
        // Scroll to section on same page
        const element = document.getElementById(section)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      } else if (section) {
        // Navigate to page and then scroll to section
        setTimeout(() => {
          const element = document.getElementById(section)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }, 100)
      }
    }
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
      ? 'bg-white/95 backdrop-blur-sm shadow-lg border-b border-gray-200'
      : 'bg-transparent'
      }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2"
            onClick={() => handleNavClick('/')}
          >
            <picture>
              <source srcSet="/logo.svg" type="image/svg+xml" />
              <img src="/logo.png" alt="Schönheits Lokal" className="w-10 h-10 object-contain" />
            </picture>
            <span translate="no" className={`font-bold text-lg notranslate ${isScrolled ? 'text-gray-800' : 'text-gray-800'
              }`}>
              Schönheits Lokal
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`font-medium transition-colors ${isActive(item.href) || (item.href.includes('#') && location.pathname === '/')
                  ? 'text-pink-600'
                  : isScrolled
                    ? 'text-gray-700 hover:text-pink-600'
                    : 'text-gray-700 hover:text-pink-600'
                  }`}
                onClick={() => handleNavClick(item.href)}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <UserProfile />
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center px-4 py-2 text-gray-700 hover:text-pink-600 transition-colors"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Einloggen
                </Link>
                <Link
                  to="/agendar"
                  className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Termin
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white rounded-lg shadow-lg mt-2 border border-gray-200">
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-lg transition-colors ${isActive(item.href) || (item.href.includes('#') && location.pathname === '/')
                    ? 'bg-pink-50 text-pink-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-pink-600'
                    }`}
                  onClick={() => handleNavClick(item.href)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="border-t border-gray-200 pt-4 mt-4">
                {isAuthenticated ? (
                  <div className="space-y-2">
                    {user?.role === 'admin' || user?.role === 'owner' ? (
                      <Link
                        to="/admin/dashboard"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    ) : (
                      <Link
                        to="/meus-agendamentos"
                        className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Meine Termine
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false)
                        // Handle logout through UserProfile component
                      }}
                      className="flex items-center w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Ausloggen
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="flex items-center px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LogIn className="w-4 h-4 mr-2" />
                      Einloggen
                    </Link>
                    <Link
                      to="/agendar"
                      className="flex items-center px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Termin
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}