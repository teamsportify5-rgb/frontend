import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/components/ThemeProvider'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  Package, 
  Clock, 
  DollarSign, 
  LogOut,
  Menu,
  X,
  User,
  Users,
  Warehouse,
  Settings,
  BarChart3,
  Wand2,
  Bell,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ForcePasswordChange } from '@/components/ForcePasswordChange'

interface LayoutProps {
  children: React.ReactNode
}

const adminNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Payroll', href: '/payroll', icon: DollarSign },
  { name: 'Inventory', href: '/inventory', icon: Warehouse },
  { name: 'AI Image', href: '/ai-image', icon: Wand2 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
]

const managerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'AI Image', href: '/ai-image', icon: Wand2 },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

const accountantNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Payroll', href: '/payroll', icon: DollarSign },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

const workerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Attendance', href: '/attendance', icon: Clock },
  { name: 'Notifications', href: '/notifications', icon: Bell },
]

const customerNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Orders', href: '/orders', icon: Package },
  { name: 'Notifications', href: '/notifications', icon: Bell },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Determine navigation based on user role
  const getNavigation = () => {
    switch (user?.role) {
      case 'customer':
        return customerNavigation
      case 'manager':
        return managerNavigation
      case 'accountant':
        return accountantNavigation
      case 'worker':
        return workerNavigation
      case 'admin':
      default:
        return adminNavigation
    }
  }
  const navigation = getNavigation()

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    const onChange = () => {
      if (mq.matches) setMobileMenuOpen(false)
    }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileMenuOpen])

  return (
    <div className="min-h-screen bg-background">
      <ForcePasswordChange />
      {/* Sidebar: drawer on mobile, fixed on lg+ */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 max-w-[min(100vw,16rem)] border-r bg-card shadow-xl transition-transform duration-300 ease-out lg:shadow-none',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:translate-x-0',
          !mobileMenuOpen && 'max-lg:pointer-events-none'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b px-4 sm:px-6">
            <h1 className="text-xl font-bold">Sportify</h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" type="button">
                    {theme === 'light' ? (
                      <Sun className="h-5 w-5" />
                    ) : theme === 'dark' ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Monitor className="h-5 w-5" />
                    )}
                    <span className="sr-only">Toggle theme</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme('light')}>
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('dark')}>
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme('system')}>
                    <Monitor className="mr-2 h-4 w-4" />
                    <span>System</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>
          
          <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-6">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t">
            <div className="px-4 py-2 mb-2">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="min-w-0 overflow-x-hidden lg:pl-64">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 lg:hidden">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="truncate text-lg font-semibold">Sportify</span>
        </header>
        <main className="px-3 py-4 sm:px-6 sm:py-8 lg:px-8">
          {children}
        </main>
      </div>

      {/* Mobile drawer backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  )
}


