import React from 'react';
import { Card } from '../components/ui/Card';
import { BackButton } from '../components/ui/BackButton';

export function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <BackButton label="Volver" />
        </div>
        
        <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white mb-6">
          Política de Privacidad
        </h1>
        
        <Card className="p-8 mb-8">
          <div className="prose max-w-none dark:prose-invert">
            <h2>Introducción</h2>
            <p>
              En Yachashun, respetamos su privacidad y nos comprometemos a proteger sus datos personales. 
              Esta política de privacidad le informará sobre cómo cuidamos sus datos personales cuando 
              visita nuestra plataforma y le informará sobre sus derechos de privacidad.
            </p>
            
            <h2>Datos que recopilamos</h2>
            <p>
              Recopilamos los siguientes tipos de información:
            </p>
            <ul>
              <li>Información de registro (nombre, correo electrónico, nombre de usuario)</li>
              <li>Contenido generado por el usuario (preguntas, respuestas, comentarios)</li>
              <li>Datos de uso (interacciones con la plataforma, preferencias)</li>
              <li>Información técnica (dirección IP, tipo de navegador, dispositivo)</li>
            </ul>
            
            <h2>Cómo utilizamos sus datos</h2>
            <p>
              Utilizamos sus datos personales para:
            </p>
            <ul>
              <li>Proporcionar y mantener nuestro servicio</li>
              <li>Mejorar y personalizar su experiencia</li>
              <li>Comunicarnos con usted sobre actualizaciones o cambios</li>
              <li>Detectar y prevenir actividades fraudulentas</li>
            </ul>
            
            <h2>Compartición de datos</h2>
            <p>
              No vendemos ni alquilamos sus datos personales a terceros. Podemos compartir información en las siguientes circunstancias:
            </p>
            <ul>
              <li>Con proveedores de servicios que nos ayudan a operar la plataforma</li>
              <li>Cuando sea requerido por ley o para proteger nuestros derechos</li>
              <li>Con su consentimiento explícito</li>
            </ul>
            
            <h2>Seguridad de datos</h2>
            <p>
              Implementamos medidas de seguridad técnicas y organizativas para proteger sus datos personales contra acceso no autorizado, 
              pérdida o alteración.
            </p>
            
            <h2>Sus derechos</h2>
            <p>
              Dependiendo de su ubicación, puede tener los siguientes derechos:
            </p>
            <ul>
              <li>Acceder a sus datos personales</li>
              <li>Corregir datos inexactos</li>
              <li>Solicitar la eliminación de sus datos</li>
              <li>Oponerse al procesamiento de sus datos</li>
              <li>Solicitar la portabilidad de sus datos</li>
            </ul>
            
            <h2>Cambios a esta política</h2>
            <p>
              Podemos actualizar nuestra política de privacidad periódicamente. Le notificaremos cualquier cambio 
              publicando la nueva política de privacidad en esta página.
            </p>
            
            <h2>Contacto</h2>
            <p>
              Si tiene preguntas sobre esta política de privacidad, puede contactarnos en:
            </p>
            <p>
              <a href="mailto:rp12112001@gmail.com" className="text-primary-600 dark:text-primary-400 hover:underline">
                rp12112001@gmail.com
              </a>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}