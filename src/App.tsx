import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import AccountantDashboard from './pages/AccountantDashboard'
import WorkerDashboard from './pages/WorkerDashboard'
import Orders from './pages/Orders'
import CustomerOrders from './pages/CustomerOrders'
import OrderDetails from './pages/OrderDetails'
import Attendance from './pages/Attendance'
import Payroll from './pages/Payroll'
import Profile from './pages/Profile'
import UserManagement from './pages/UserManagement'
import Inventory from './pages/Inventory'
import Settings from './pages/Settings'
import Analytics from './pages/Analytics'
import AIImage from './pages/AIImage'
import Notifications from './pages/Notifications'
import { Toaster } from './components/ui/toaster'

// Component to route to appropriate dashboard based on role
function DashboardRouter() {
  const { user } = useAuth()
  
  switch (user?.role) {
    case 'customer':
      return <CustomerDashboard />
    case 'manager':
      return <ManagerDashboard />
    case 'accountant':
      return <AccountantDashboard />
    case 'worker':
      return <WorkerDashboard />
    case 'admin':
    default:
      return <Dashboard />
  }
}

// Component to route to appropriate orders page based on role
function OrdersRouter() {
  const { user } = useAuth()
  const isCustomer = user?.role === 'customer'
  
  return isCustomer ? <CustomerOrders /> : <Orders />
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="fms-ui-theme">
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardRouter />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrdersRouter />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <OrderDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'worker']}>
                  <Layout>
                    <Attendance />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'manager', 'accountant', 'worker']}>
                  <Layout>
                    <Payroll />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <UserManagement />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout>
                    <Inventory />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Analytics />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <Settings />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route
            path="/ai-image"
            element={
              <ProtectedRoute>
                <Layout>
                  <AIImage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
                  <Layout>
                    <Notifications />
                  </Layout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App

