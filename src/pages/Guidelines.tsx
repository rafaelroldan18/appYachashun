import React from 'react';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';
import { Check, AlertTriangle, MessageCircle, Users, BookOpen } from 'lucide-react';

export function Guidelines() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <BackButton label="Volver" />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-6 flex items-center">
          <BookOpen className="mr-3 h-8 w-8 text-primary-500" />
          Normas de la Comunidad
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          En Yachashun, creemos en el poder del aprendizaje colaborativo. Estas normas están diseñadas para 
          crear un espacio seguro, respetuoso y productivo para todos los estudiantes.
        </p>
        
        <div className="space-y-6">
          <Card className="p-6 border-l-4 border-primary-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Users className="mr-2 h-6 w-6 text-primary-500" />
              Respeto Mutuo
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Trata a todos los miembros con respeto y cortesía, independientemente de su nivel educativo o experiencia.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Valora la diversidad de opiniones y perspectivas.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>No se tolerará el acoso, discriminación, insultos o lenguaje ofensivo.</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6 border-l-4 border-secondary-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <MessageCircle className="mr-2 h-6 w-6 text-secondary-500" />
              Calidad del Contenido
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Haz preguntas claras y específicas, proporcionando contexto suficiente.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Proporciona respuestas detalladas y útiles que realmente ayuden a resolver la duda.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Evita respuestas vagas, incorrectas o que simplemente repitan lo que otros ya han dicho.</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6 border-l-4 border-accent-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <BookOpen className="mr-2 h-6 w-6 text-accent-500" />
              Integridad Académica
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Busca entender los conceptos, no solo obtener respuestas.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Cita adecuadamente las fuentes cuando compartas información.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>No solicites ni proporciones respuestas completas a exámenes o tareas evaluadas.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>No promuevas el plagio o la deshonestidad académica.</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6 border-l-4 border-purple-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Seguridad y Privacidad
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Protege tu información personal y la de otros usuarios.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Reporta contenido inapropiado o comportamiento que viole estas normas.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>No compartas información personal identificable como números de teléfono o direcciones.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>No publiques enlaces a sitios maliciosos o contenido inapropiado.</span>
              </li>
            </ul>
          </Card>
          
          <Card className="p-6 border-l-4 border-green-500">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
              </svg>
              Participación Constructiva
            </h2>
            <ul className="space-y-3 text-gray-700 dark:text-gray-300">
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Vota positivamente el contenido útil y de calidad.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Proporciona retroalimentación constructiva cuando sea necesario.</span>
              </li>
              <li className="flex items-start">
                <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Agradece a quienes te ayudan y marca las mejores respuestas.</span>
              </li>
              <li className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                <span>Evita respuestas que no contribuyan a la discusión o que sean deliberadamente incorrectas.</span>
              </li>
            </ul>
          </Card>
        </div>
        
        <div className="mt-8 p-6 bg-primary-50 dark:bg-primary-900/20 rounded-xl border border-primary-100 dark:border-primary-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Consecuencias del incumplimiento
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            El incumplimiento de estas normas puede resultar en:
          </p>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
            <li className="flex items-start">
              <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-xs font-medium mr-2">Nivel 1</span>
              <span>Advertencia y solicitud de modificación del contenido</span>
            </li>
            <li className="flex items-start">
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 px-2 py-1 rounded text-xs font-medium mr-2">Nivel 2</span>
              <span>Restricción temporal de ciertas funcionalidades</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 px-2 py-1 rounded text-xs font-medium mr-2">Nivel 3</span>
              <span>Suspensión temporal o permanente de la cuenta</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}