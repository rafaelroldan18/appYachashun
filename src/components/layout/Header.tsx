import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, LogOut, Menu, X, Moon, Sun, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Avatar } from '../ui/Avatar';
import { NotificationCenter } from '../notifications/NotificationCenter';
import { MessageCenter } from '../messaging/MessageCenter';
import { showWarning } from '../../utils/errorHandling';

export function Header() {
  const { user, userProfile, signOut, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessageCenter, setShowMessageCenter] = useState(false);
  const navigate = useNavigate();
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    // Confirmar antes de cerrar sesión
    if (!window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      return;
    }

    try {
      // Cerrar menú inmediatamente para mejor UX
      setIsMenuOpen(false);
      setIsProfileMenuOpen(false);
      
      await signOut();
      // La redirección se maneja en el AuthContext
    } catch (error) {
      console.error('Error during sign out:', error);
      showWarning('Error al cerrar sesión. Intenta nuevamente.');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isAdmin = userProfile?.role === 'admin';

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="h-14 w-14 group-hover:shadow-glow transition-all duration-300">
                  <img src="/2.png" alt="Yachashun Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-xl font-display font-bold text-gray-900 dark:text-white">
                  Yachashun
                </span>
              </Link>
            </motion.div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-lg mx-8">
              <form onSubmit={handleSearch} className="w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Buscar preguntas, categorías..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white transition-all duration-200"
                  />
                </div>
              </form>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/categories"
                  className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                >
                  Categorías
                </Link>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/ask"
                  className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
                >
                  Hacer Pregunta
                </Link>
              </motion.div>

              {/* Theme Toggle */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={toggleTheme}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>

              {user && (
                <>
                  {/* Notifications */}
                  <NotificationCenter />

                  {/* Messages */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowMessageCenter(true)}
                    className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  >
                    <MessageCircle className="h-5 w-5" />
                  </motion.button>
                </>
              )}
              
              {user ? (
                <div className="relative" ref={profileMenuRef}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    disabled={loading}
                    className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 disabled:opacity-50"
                  >
                    <span className="font-medium">{userProfile?.full_name || userProfile?.username || 'Mi Perfil'}</span>
                    <Avatar
                      src={userProfile?.avatar_url}
                      alt={userProfile?.username || 'Usuario'}
                      size="sm"
                    />
                  </motion.button>
                  
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-large border border-gray-200 dark:border-gray-700 py-1 z-50 backdrop-blur-md"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Ver Perfil
                        </Link>
                        <Link
                          to="/my-questions"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Mis Preguntas
                        </Link>
                        <Link
                          to="/my-answers"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Mis Respuestas
                        </Link>
                        <Link
                          to="/profile/settings"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                        >
                          Configuración
                        </Link>
                        {isAdmin && (
                          <>
                            <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                            <Link
                              to="/admin"
                              onClick={() => setIsProfileMenuOpen(false)}
                              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors duration-200"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
                                <path d="M12 8v8"></path>
                                <path d="M8 12h8"></path>
                              </svg>
                              Panel Admin
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-200 dark:border-gray-600 my-1"></div>
                        <button
                          onClick={handleSignOut}
                          disabled={loading}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/login"
                      className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                    >
                      Iniciar Sesión
                    </Link>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Link
                      to="/register"
                      className="bg-gradient-to-r from-accent-500 to-secondary-500 text-white px-4 py-2 rounded-xl hover:shadow-glow-accent transition-all duration-300 font-medium"
                    >
                      Registrarse
                    </Link>
                  </motion.div>
                </div>
              )}
            </nav>

            {/* Mobile menu button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </motion.button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="md:hidden pb-4 overflow-hidden"
              >
                <div className="space-y-4">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="px-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <input
                        type="text"
                        placeholder="Buscar preguntas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:text-white transition-all duration-200"
                      />
                    </div>
                  </form>

                  {/* Mobile Navigation */}
                  <div className="px-2 space-y-2">
                    <Link
                      to="/categories"
                      onClick={() => setIsMenuOpen(false)}
                      className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                    >
                      Categorías
                    </Link>
                    <Link
                      to="/ask"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2 rounded-xl hover:shadow-glow transition-all duration-300 font-medium"
                    >
                      Hacer Pregunta
                    </Link>

                    {/* Theme Toggle Mobile */}
                    <button
                      onClick={toggleTheme}
                      className="flex items-center space-x-2 py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                    >
                      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                      <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                    </button>
                    
                    {user ? (
                      <>
                        <div className="flex items-center space-x-3 py-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {userProfile?.full_name || userProfile?.username}
                          </span>
                          <Avatar
                            src={userProfile?.avatar_url}
                            alt={userProfile?.username || 'Usuario'}
                            size="sm"
                          />
                        </div>
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Mi Perfil
                        </Link>
                        <Link
                          to="/my-questions"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Mis Preguntas
                        </Link>
                        <Link
                          to="/my-answers"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Mis Respuestas
                        </Link>
                        <Link
                          to="/messages"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Mensajes
                        </Link>
                        <Link
                          to="/profile/settings"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Configuración
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin"
                            onClick={() => setIsMenuOpen(false)}
                            className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium flex items-center transition-colors duration-200"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path>
                              <path d="M12 8v8"></path>
                              <path d="M8 12h8"></path>
                            </svg>
                            Panel Admin
                          </Link>
                        )}
                        <button
                          onClick={handleSignOut}
                          disabled={loading}
                          className="block w-full text-left py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200 disabled:opacity-50"
                        >
                          Cerrar Sesión
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setIsMenuOpen(false)}
                          className="block py-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors duration-200"
                        >
                          Iniciar Sesión
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setIsMenuOpen(false)}
                          className="block w-full text-center bg-gradient-to-r from-accent-500 to-secondary-500 text-white py-2 rounded-xl hover:shadow-glow-accent transition-all duration-300 font-medium"
                        >
                          Registrarse
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Message Center Modal */}
      <AnimatePresence>
        {showMessageCenter && (
          <MessageCenter
            isOpen={showMessageCenter}
            onClose={() => setShowMessageCenter(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}