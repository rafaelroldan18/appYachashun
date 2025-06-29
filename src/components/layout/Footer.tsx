import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export function Footer() {
  return (
    <footer className="bg-primary-900 dark:bg-gray-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-800/50 to-primary-900/50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <motion.div 
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="md:col-span-2"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-16 w-16">
                <img src="/2.png" alt="Yachashun Logo" className="h-full w-full object-contain" />
              </div>
              <span className="text-xl font-display font-bold">Yachashun</span>
            </div>
            <p className="text-gray-300 max-w-md mb-4 leading-relaxed">
              Una plataforma educativa colaborativa donde estudiantes pueden hacer preguntas, 
              responder y aprender juntos.
            </p>
            <div className="bg-gradient-to-r from-primary-700/30 to-primary-800/30 p-4 rounded-xl border border-primary-700/30">
              <p className="text-sm text-primary-200 italic">
                "Yachashun" significa "Aprendamos juntos".
              </p>
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h3 className="font-semibold mb-4 text-lg">Enlaces Rápidos</h3>
            <ul className="space-y-3">
              {[
                { to: '/categories', label: 'Categorías' },
                { to: '/ask', label: 'Hacer Pregunta' },
                { to: '/leaderboard', label: 'Ranking' },
                { to: '/badges', label: 'Logros' }
              ].map((link, index) => (
                <motion.li 
                  key={link.to}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={link.to} 
                    className="text-gray-300 hover:text-primary-400 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-primary-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h3 className="font-semibold mb-4 text-lg">Soporte</h3>
            <ul className="space-y-3">
              <motion.li 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <a 
                  href="mailto:rp12112001@gmail.com" 
                  className="text-gray-300 hover:text-accent-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-accent-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Centro de Ayuda
                </a>
              </motion.li>
              <motion.li 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  to="/guidelines" 
                  className="text-gray-300 hover:text-accent-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-accent-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Normas de Comunidad
                </Link>
              </motion.li>
              <motion.li 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <a 
                  href="mailto:rp12112001@gmail.com" 
                  className="text-gray-300 hover:text-accent-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-accent-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Contacto
                </a>
              </motion.li>
              <motion.li 
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <Link 
                  to="/privacy" 
                  className="text-gray-300 hover:text-accent-400 transition-colors duration-200 flex items-center group"
                >
                  <span className="w-1 h-1 bg-accent-500 rounded-full mr-3 group-hover:w-2 transition-all duration-200"></span>
                  Privacidad
                </Link>
              </motion.li>
            </ul>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="border-t border-primary-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center"
        >
          <p className="text-gray-400 text-sm">
            © 2025 Yachashun. Todos los derechos reservados.
          </p>
          <motion.div 
            className="flex items-center space-x-2 text-gray-400 text-sm mt-4 md:mt-0"
            whileHover={{ scale: 1.05 }}
          >
            <span>Hecho con</span>
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Heart className="h-4 w-4 text-error-500" />
            </motion.div>
            <span>para la educación</span>
          </motion.div>
        </motion.div>
      </div>
    </footer>
  );
}