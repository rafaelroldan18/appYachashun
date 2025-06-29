import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Tag, BookOpen, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { LoadingSpinner, ErrorState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { questionSchema, type QuestionFormData } from '../utils/validation';
import { handleError, showSuccess, showLoading, dismissToast, showWarning } from '../utils/errorHandling';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
}

export function EditQuestion() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [questionData, setQuestionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFormError,
    setValue,
    watch,
    reset
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      educational_level: 'secundaria',
      tags: [],
    },
  });

  useEffect(() => {
    if (!id || !user) return;
    
    loadQuestion();
    loadCategories();
  }, [id, user]);

  useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  const loadQuestion = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      if (!data) {
        setError('Pregunta no encontrada');
        return;
      }

      // Check if user is authorized to edit
      if (!can.editQuestion(data.user_id)) {
        setError('No tienes permiso para editar esta pregunta');
        return;
      }

      setQuestionData(data);
      setTags(data.tags || []);
      setImageUrl(data.image_url);

      // Set form values
      reset({
        title: data.title,
        content: data.content,
        category_id: data.category_id || '',
        educational_level: data.educational_level,
        tags: data.tags,
        image_url: data.image_url || ''
      });

    } catch (error) {
      console.error('Error loading question:', error);
      setError('Error al cargar la pregunta');
      handleError(error, 'EditQuestion.loadQuestion');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      setCategoriesError(null);

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategoriesError('Error al cargar las categorías');
      handleError(error, 'EditQuestion.loadCategories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: QuestionFormData) => {
    if (!user || !id) {
      handleError(new Error('Debes iniciar sesión para editar una pregunta'), 'EditQuestion.onSubmit');
      return;
    }

    if (!questionData || !can.editQuestion(questionData.user_id)) {
      showWarning('No tienes permiso para editar esta pregunta');
      return;
    }

    const toastId = showLoading('Actualizando pregunta...');
    setSubmitting(true);

    try {
      const questionData = {
        title: data.title,
        content: data.content,
        category_id: data.category_id || null,
        tags: tags,
        educational_level: data.educational_level,
        image_url: imageUrl,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('questions')
        .update(questionData)
        .eq('id', id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('¡Pregunta actualizada con éxito!');
      navigate(`/question/${id}`);
    } catch (error: any) {
      dismissToast(toastId);
      handleError(error, 'EditQuestion.onSubmit');
      setFormError('root', {
        message: 'Error al actualizar la pregunta. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !id || !questionData) return;
    
    if (!can.deleteQuestion(questionData.user_id)) {
      showWarning('No tienes permiso para eliminar esta pregunta');
      return;
    }

    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!user || !id || !questionData || !can.deleteQuestion(questionData.user_id)) return;

    const toastId = showLoading('Eliminando pregunta...');
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('Pregunta eliminada correctamente');
      navigate('/');
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'EditQuestion.handleDelete');
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando pregunta..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Error"
          message={error}
          onRetry={error === 'Pregunta no encontrada' ? undefined : loadQuestion}
          showRetry={error !== 'Pregunta no encontrada' && error !== 'No tienes permiso para editar esta pregunta'}
          action={
            <Button onClick={() => navigate('/')} variant="outline">
              Volver al inicio
            </Button>
          }
        />
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
              onClick={() => navigate(`/question/${id}`)}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver a la pregunta
            </Button>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <HelpCircle className="mr-3 h-8 w-8 text-primary-500" />
            Editar Pregunta
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Actualiza los detalles de tu pregunta para obtener mejores respuestas
          </p>
        </div>

        <Card className="p-8 mb-6">
          {errors.root && (
            <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {errors.root.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Título de la pregunta *
              </label>
              <input
                {...register('title')}
                type="text"
                disabled={submitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.title ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Descripción detallada *
              </label>
              <textarea
                {...register('content')}
                rows={8}
                disabled={submitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.content ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                placeholder="Explica tu pregunta en detalle. Incluye lo que has intentado y dónde tienes dificultades..."
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.content.message}</p>
              )}
            </div>

            {/* Image Upload */}
            <ImageUpload
              onImageUploaded={setImageUrl}
              onImageRemoved={() => setImageUrl(null)}
              currentImage={imageUrl || undefined}
            />

            {/* Category */}
            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoría
              </label>
              {categoriesLoading ? (
                <div className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg">
                  <LoadingSpinner size="sm" />
                  <span className="text-gray-600 dark:text-gray-400">Cargando categorías...</span>
                </div>
              ) : categoriesError ? (
                <div className="p-3 border border-red-300 dark:border-red-700 rounded-lg">
                  <ErrorState
                    title="Error al cargar categorías"
                    message={categoriesError}
                    onRetry={loadCategories}
                    showRetry={true}
                    className="p-0"
                  />
                </div>
              ) : (
                <select
                  {...register('category_id')}
                  disabled={submitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                    errors.category_id ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.category_id && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.category_id.message}</p>
              )}
            </div>

            {/* Educational Level */}
            <div>
              <label htmlFor="educational_level" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nivel educativo *
              </label>
              <select
                {...register('educational_level')}
                disabled={submitting}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                  errors.educational_level ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <option value="primaria">Primaria</option>
                <option value="secundaria">Secundaria</option>
                <option value="universidad">Universidad</option>
                <option value="otro">Otro</option>
              </select>
              {errors.educational_level && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.educational_level.message}</p>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Etiquetas (máximo 5)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                  >
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      disabled={submitting}
                      className="ml-2 text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 disabled:opacity-50"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  disabled={submitting || tags.length >= 5}
                  className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  placeholder="Agregar etiqueta..."
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  disabled={!tagInput.trim() || tags.length >= 5 || submitting}
                >
                  Agregar
                </Button>
              </div>
              {errors.tags && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tags.message}</p>
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
                onClick={() => navigate(`/question/${id}`)}
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
                ¿Estás seguro de que deseas eliminar esta pregunta? Esta acción no se puede deshacer y se eliminarán todas las respuestas asociadas.
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