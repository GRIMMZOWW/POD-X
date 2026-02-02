import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { YouTubeProvider } from './contexts/YouTubeContext';
import { BookProvider } from './contexts/BookContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/layout/Layout';
import StreamPage from './pages/StreamPage';
import LibraryPage from './pages/LibraryPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <YouTubeProvider>
          <BookProvider>
            <BrowserRouter>
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />

                {/* Protected routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Layout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<StreamPage />} />
                  <Route path="library" element={<LibraryPage />} />
                  <Route path="upload" element={<UploadPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Catch all - redirect to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </BookProvider>
        </YouTubeProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
