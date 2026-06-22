import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RoleProtectedRoute } from './components/RoleProtectedRoute'
import { RoleDashboardRedirect } from './components/RoleDashboardRedirect'
import { InvalidDashboardPath } from './components/InvalidDashboardPath'
import { LayoutRoleRoute } from './components/LayoutRoleRoute'
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
import Tasks from './pages/Tasks'
import { ROUTE_ACCESS } from './lib/routeAccess'
import { Toaster } from './components/ui/toaster'

function DashboardPage({ role }: { role: 'admin' | 'manager' | 'accountant' | 'worker' | 'customer' }) {
  switch (role) {
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
                <RoleDashboardRedirect />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleProtectedRoute allowedRoles={['admin']} roleLabel="Admin">
                    <DashboardPage role="admin" />
                  </RoleProtectedRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/manager"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleProtectedRoute allowedRoles={['manager']} roleLabel="Manager">
                    <DashboardPage role="manager" />
                  </RoleProtectedRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/accountant"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleProtectedRoute allowedRoles={['accountant']} roleLabel="Accountant">
                    <DashboardPage role="accountant" />
                  </RoleProtectedRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/worker"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleProtectedRoute allowedRoles={['worker']} roleLabel="Worker">
                    <DashboardPage role="worker" />
                  </RoleProtectedRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/customer"
            element={
              <ProtectedRoute>
                <Layout>
                  <RoleProtectedRoute allowedRoles={['customer']} roleLabel="Customer">
                    <DashboardPage role="customer" />
                  </RoleProtectedRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <InvalidDashboardPath />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.orders}>
                <OrdersRouter />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.orders}>
                <OrderDetails />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.attendance}>
                <Attendance />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/payroll"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.payroll}>
                <Payroll />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.tasks}>
                <Tasks />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.profile}>
                <Profile />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.users} roleLabel="Admin">
                <UserManagement />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.inventory}>
                <Inventory />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.analytics} roleLabel="Admin">
                <Analytics />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.settings} roleLabel="Admin">
                <Settings />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/ai-image"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.aiImage}>
                <AIImage />
              </LayoutRoleRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <LayoutRoleRoute allowedRoles={ROUTE_ACCESS.notifications}>
                <Notifications />
              </LayoutRoleRoute>
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
