import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { reportSchema, type ReportFormData } from '../../utils/validation';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'question' | 'answer' | 'user';
  targetId: string;
  targetTitle?: string;
  targetContent?: string;
  targetUsername?: string;
}

export function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetTitle,
  targetContent,
  targetUsername
}: ReportModalProps) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
  });

  const onSubmit = async (data: ReportFormData) => {
    if (!user) return;

    try {
      setSubmitting(true);

      const reportData: any = {
        reporter_id: user.id,
        reason: data.reason,
        description: data.description || null,
      };

      // Set the appropriate target field
      if (targetType === 'question') {
        reportData.question_id = targetId;
      } else if (targetType === 'answer') {
        reportData.answer_id = targetId;
      } else if (targetType === 'user') {
        reportData.reported_user_id = targetId;
      }

      const { error } = await supabase
        .from('reports')
        .insert(reportData);

      if (error) throw error;

      setSubmitted(true);
      reset();
      
      // Close modal after a delay
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);

    } catch (error: any) {
      setError('root', {
        message: error.message || 'Error al enviar el reporte',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const reportReasons = [
    'Contenido inapropiado',
    'Spam o publicidad',
    'Acoso o intimidación',
    'Información falsa',
    'Violación de derechos de autor',
    'Contenido fuera de tema',
    'Lenguaje ofensivo',
    'Otro'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
            Reportar {targetType === 'question' ? 'Pregunta' : targetType === 'answer' ? 'Respuesta' : 'Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-8">
            <div className="bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Reporte Enviado
            </h3>
            <p className="text-gray-600">
              Gracias por ayudarnos a mantener la comunidad segura. 
              Revisaremos tu reporte lo antes posible.
            </p>
          </div>
        ) : (
          <>
            {/* Target Info */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-900 mb-2">
                {targetType === 'question' ? 'Pregunta a reportar:' :
                 targetType === 'answer' ? 'Respuesta a reportar:' :
                 'Usuario a reportar:'}
              </h3>
              {targetTitle && (
                <p className="text-sm text-gray-700 font-medium mb-1">{targetTitle}</p>
              )}
              {targetContent && (
                <p className="text-sm text-gray-600 line-clamp-3">{targetContent}</p>
              )}
              {targetUsername && (
                <p className="text-sm text-gray-700">@{targetUsername}</p>
              )}
            </div>

            {errors.root && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Razón del reporte *
                </label>
                <select
                  {...register('reason')}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.reason ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecciona una razón</option>
                  {reportReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
                {errors.reason && (
                  <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción adicional (opcional)
                </label>
                <textarea
                  {...register('description')}
                  rows={4}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Proporciona más detalles sobre el problema..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Nota:</strong> Los reportes falsos o malintencionados pueden resultar 
                  en acciones disciplinarias contra tu cuenta.
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  loading={submitting}
                  className="flex-1"
                >
                  Enviar Reporte
                </Button>
              </div>
            </form>
          </>
        )}
      </Card>
    </div>
  );
}