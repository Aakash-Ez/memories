import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { RequireAuth } from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { Highlights } from './pages/Highlights'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { Polls } from './pages/Polls'
import { ProfileDetail } from './pages/ProfileDetail'
import { Profiles } from './pages/Profiles'
import { UploadHighlight } from './pages/UploadHighlight'
import { WriteTestimonial } from './pages/WriteTestimonial'
import { MakeProfile } from './pages/MakeProfile'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/highlights"
              element={
                <RequireAuth>
                  <Highlights />
                </RequireAuth>
              }
            />
            <Route
              path="/profiles"
              element={
                <RequireAuth>
                  <Profiles />
                </RequireAuth>
              }
            />
            <Route
              path="/profiles/:id"
              element={
                <RequireAuth>
                  <ProfileDetail />
                </RequireAuth>
              }
            />
            <Route
              path="/make-profile"
              element={
                <RequireAuth>
                  <MakeProfile />
                </RequireAuth>
              }
            />
            <Route
              path="/write-testimonial"
              element={
                <RequireAuth>
                  <WriteTestimonial />
                </RequireAuth>
              }
            />
            <Route
              path="/upload-highlight"
              element={
                <RequireAuth>
                  <UploadHighlight />
                </RequireAuth>
              }
            />
            <Route
              path="/polls"
              element={
                <RequireAuth>
                  <Polls />
                </RequireAuth>
              }
            />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
