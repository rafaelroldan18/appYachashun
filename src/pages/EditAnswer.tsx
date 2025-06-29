import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { LoadingSpinner, ErrorState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { answerSchema, type AnswerFormData } from '../utils/validation';
import { handleError, showSuccess, showLoading, dismissToast, showWarning } from '../utils/errorHandling';

export function EditAnswer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answerData, setAnswerData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    reset
  } = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
  });

  useEffect(() => {
    if (!id || !user) return;
    
    loadAnswer();
  }, [id, user]);

  const loadAnswer = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('answers')
        .select('*, question:question_id(id, title)')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Respuesta no encontrada');
        return;
      }

      // Check if user is authorized to edit
      if (!can.editAnswer(data.user_id)) {
        setError('No tienes permiso para editar esta respuesta');
        return;
      }

      setAnswerData(data);

      // Set form values
      reset({
        content: data.content
      });

    } catch (error) {
      console.error('Error loading answer:', error);
      setError('Error al cargar la respuesta');
      handleError(error, 'EditAnswer.loadAnswer');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AnswerFormData) => {
    if (!user || !id || !answerData) {
      handleError(new Error('Debes iniciar sesión para editar una respuesta'), 'EditAnswer.onSubmit');
      return;
    }

    if (!can.editAnswer(answerData.user_id)) {
      showWarning('No tienes permiso para editar esta respuesta');
      return;
    }

    const toastId = showLoading('Actualizando respuesta...');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .update({
          content: data.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('¡Respuesta actualizada con éxito!');
      navigate(`/question/${answerData.question.id}`);
    } catch (error: any) {
      dismissToast(toastId);
      handleError(error, 'EditAnswer.onSubmit');
      setFormError('root', {
        message: 'Error al actualizar la respuesta. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id || !answerData) return;
    
    if (!can.deleteAnswer(answerData.user_id)) {
      showWarning('No tienes permiso para eliminar esta respuesta');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user || !id || !answerData || !can.deleteAnswer(answerData.user_id)) return;

    const toastId = showLoading('Eliminando respuesta...');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Respuesta eliminada correctamente');
      navigate(`/question/${answerData.question.id}`);
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'EditAnswer.handleDelete');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando respuesta..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Error"
          message={error}
          onRetry={error === 'Respuesta no encontrada' ? undefined : loadAnswer}
          showRetry={error !== 'Respuesta no encontrada' && error !== 'No tienes permiso para editar esta respuesta'}
          action={
            <Button onClick={() => navigate(-1)} variant="outline">
              Volver
            </Button>
          }
        />
      </div>
    );
  }

  if (!answerData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando datos..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          {/* Back button */}
          <div className="mb-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/question/${answerData.question.id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a la pregunta
            </Button>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <MessageCircle className="mr-3 h-8 w-8 text-primary-500" />
            Editar Respuesta
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Actualiza tu respuesta a la pregunta: <span className="font-medium">{answerData.question.title}</span>
          </p>
        </div>

        <Card className="p-8 mb-6">
          {errors.root && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contenido de la respuesta *
              </label>
              <textarea
                {...register('content')}
                rows={8}
                disabled={submitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.content ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Escribe tu respuesta aquí. Sé claro, específico y útil..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
              )}
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                loading={submitting}
                disabled={submitting}
                className="flex-1"
              >
                Guardar Cambios
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/question/${answerData.question.id}`)}
                disabled={submitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={handleDelete}
                disabled={submitting}
              >
                Eliminar
              </Button>
            </div>
          </form>
        </Card>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center mb-4 text-error-600 dark:text-error-400">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">Confirmar eliminación</h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas eliminar esta respuesta? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmDelete}
                  loading={submitting}
                  className="flex-1"
                >
                  Eliminar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}