import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send, Image as ImageIcon, Link as LinkIcon, Code, List } from 'lucide-react';
import { Button } from '../ui/Button';
import { ImageUpload } from '../ui/ImageUpload';
import { answerSchema, type AnswerFormData } from '../../utils/validation';
import { handleError, showLoading, dismissToast, showSuccess } from '../../utils/errorHandling';
import { supabase } from '../../lib/supabase';

interface AnswerFormProps {
  questionId: string;
  userId: string;
  onAnswerSubmitted: () => void;
}

export function AnswerForm({ questionId, userId, onAnswerSubmitted }: AnswerFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<AnswerFormData>({
    resolver: zodResolver(answerSchema),
  });

  const onSubmit = async (data: AnswerFormData) => {
    const toastId = showLoading('Enviando respuesta...');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('answers')
        .insert({
          question_id: questionId,
          user_id: userId,
          content: data.content,
          vote_count: 0,
          upvotes: 0,
          downvotes: 0,
          is_best: false,
          image_url: imageUrl
        });

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('¡Respuesta enviada con éxito!');
      reset();
      setImageUrl(null);
      onAnswerSubmitted();
    } catch (error: any) {
      dismissToast(toastId);
      handleError(error, 'AnswerForm.onSubmit');
      setError('root', {
        message: 'Error al enviar la respuesta. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Tu Respuesta</h3>
      
      {errors.root && (
        <div className="mb-4 p-3 bg-error-100 dark:bg-error-900/20 border border-error-300 dark:border-error-700 text-error-700 dark:text-error-400 rounded-lg text-sm">
          {errors.root.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          {/* Formatting Toolbar */}
          <div className="flex items-center space-x-1 mb-2 border border-gray-200 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              title="Insertar imagen"
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              title="Insertar enlace"
            >
              <LinkIcon className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              title="Insertar código"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-gray-600 dark:text-gray-400"
              title="Insertar lista"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          
          <textarea
            {...register('content')}
            rows={6}
            disabled={submitting}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
              errors.content ? 'border-error-300 dark:border-error-500' : 'border-gray-300 dark:border-gray-600'
            } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            placeholder="Escribe tu respuesta aquí. Sé claro, específico y útil. Puedes usar ejemplos para ilustrar tu punto."
          />
          {errors.content && (
            <p className="mt-1 text-sm text-error-600 dark:text-error-400">{errors.content.message}</p>
          )}
        </div>

        {/* Image Upload */}
        <ImageUpload
          onImageUploaded={setImageUrl}
          onImageRemoved={() => setImageUrl(null)}
          currentImage={imageUrl || undefined}
        />

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 px-2 py-1 rounded text-xs font-medium mr-2">
              Tip
            </span>
            Las respuestas detalladas y con ejemplos tienen más probabilidad de ser marcadas como mejores.
          </div>
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting}
            className="px-6"
          >
            <Send className="w-4 h-4 mr-2" />
            Enviar Respuesta
          </Button>
        </div>
      </form>
    </div>
  );
}