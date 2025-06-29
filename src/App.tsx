import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { IconSprite } from './components/ui/IconSprite';
import { ToastProvider } from './components/ui/Toast';
import { preloadIcons, COMMON_ICONS } from './components/ui/LazyIcon';
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { AskQuestion } from './pages/AskQuestion';
import { EditQuestion } from './pages/EditQuestion';
import { QuestionDetail } from './pages/QuestionDetail';
import { EditAnswer } from './pages/EditAnswer';
import { Profile } from './pages/Profile';
import { ProfileSettings } from './pages/ProfileSettings';
import { Leaderboard } from './pages/Leaderboard';
import { Search } from './pages/Search';
import { Categories } from './pages/Categories';
import { CategoryDetail } from './pages/CategoryDetail.tsx';
import { Messages } from './pages/Messages';
import { MyQuestions } from './pages/MyQuestions';
import { MyAnswers } from './pages/MyAnswers';
import { AllQuestions } from './pages/AllQuestions';

// Admin Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { ReportsManagement } from './pages/admin/ReportsManagement';
import { CategoriesManagement } from './pages/admin/CategoriesManagement';
import { UserManagement } from './pages/admin/UserManagement';

// Error Boundary
import { ErrorBoundary } from './components/ui/ErrorBoundary';

function App() {
  // Preload common icons on app start
  useEffect(() => {
    preloadIcons(COMMON_ICONS);
  }, []);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network: Online');
    };

    const handleOffline = () => {
      console.log('Network: Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors duration-200">
              {/* SVG Icon Sprite */}
              <IconSprite />
              
              {/* Toast Provider */}
              <ToastProvider />
              
              <Header />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/question/:id" element={<QuestionDetail />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/category/:id" element={<CategoryDetail />} />
                  <Route path="/trending" element={<AllQuestions />} />
                  <Route path="/recent" element={<AllQuestions />} />
                  
                  {/* Protected Routes */}
                  <Route path="/ask" element={
                    <ProtectedRoute requireAuth={true}>
                      <AskQuestion />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-question/:id" element={
                    <ProtectedRoute requireAuth={true}>
                      <EditQuestion />
                    </ProtectedRoute>
                  } />
                  <Route path="/edit-answer/:id" element={
                    <ProtectedRoute requireAuth={true}>
                      <EditAnswer />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/profile/settings" element={
                    <ProtectedRoute requireAuth={true}>
                      <ProfileSettings />
                    </ProtectedRoute>
                  } />
                  <Route path="/profile/:userId" element={<Profile />} />
                  <Route path="/messages" element={
                    <ProtectedRoute requireAuth={true}>
                      <Messages />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-questions" element={
                    <ProtectedRoute requireAuth={true}>
                      <MyQuestions />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-answers" element={
                    <ProtectedRoute requireAuth={true}>
                      <MyAnswers />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute requireAuth={true} requireRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/reports" element={
                    <ProtectedRoute requireAuth={true} requireRole="moderator">
                      <ReportsManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/categories" element={
                    <ProtectedRoute requireAuth={true} requireRole="admin">
                      <CategoriesManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/users" element={
                    <ProtectedRoute requireAuth={true} requireRole="admin">
                      <UserManagement />
                    </ProtectedRoute>
                  } />
                </Routes>
              </main>
              <Footer />
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;