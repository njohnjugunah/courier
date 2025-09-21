import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from './firebase/firebaseClient'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/Header'
import { SmoothPageTransition } from './components/SmoothPageTransition'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ParcelsList from './pages/ParcelsList'
import ParcelCreate from './pages/ParcelCreate'
import ParcelDetail from './pages/ParcelDetail'
import Ledger from './pages/Ledger'
import Wallet from './pages/Wallet'
import AdminDestinations from './pages/AdminDestinations'
import AdminStaff from './pages/AdminStaff'

function App() {
  const [user, loading] = useAuthState(auth)

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex flex-col min-h-screen">
                    <Header />
                    <main className="flex-1 p-4">
                      <SmoothPageTransition>
                        <Routes>
                          <Route path="/" element={<Navigate to="/dashboard" />} />
                          <Route
                            path="/dashboard"
                            element={<Dashboard userUid={user ? user.uid : null} />}
                          />
                          <Route path="/parcels" element={<ParcelsList />} />
                          <Route path="/parcels/new" element={<ParcelCreate />} />
                          <Route path="/parcels/:id" element={<ParcelDetail />} />
                          <Route path="/ledger" element={<Ledger />} />
                          <Route path="/wallet" element={<Wallet />} />
                          <Route path="/admin/destinations" element={<AdminDestinations />} />
                          <Route path="/admin/staff" element={<AdminStaff />} />
                        </Routes>
                      </SmoothPageTransition>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  )
}

export default App
