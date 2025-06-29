import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { HelpCircle, Tag, BookOpen, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthGuard } from '../components/auth/AuthGuard';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ImageUpload } from '../components/ui/ImageUpload';
import { LoadingSpinner, ErrorState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { questionSchema, type QuestionFormData } from '../utils/validation';
import { handleError, showSuccess, showLoading, dismissToast } from '../utils/errorHandling';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
}

export function AskQuestion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      educational_level: 'secundaria',
      tags: [],
    },
  });

  useEffect(() => {
    if (user) {
      loadCategories();
    }
  }, [user]);

  useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  const loadCategories = async () => {
    if (!user) return;

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
      handleError(error, 'AskQuestion.loadCategories');
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
    if (!user) {
      handleError(new Error('Debes iniciar sesión para hacer una pregunta'), 'AskQuestion.onSubmit');
      return;
    }

    const toastId = showLoading('Publicando pregunta...');
    setLoading(true);

    try {
      const questionData = {
        user_id: user.id,
        title: data.title,
        content: data.content,
        category_id: data.category_id || null,
        tags: tags,
        educational_level: data.educational_level,
        image_url: imageUrl,
      };

      const { data: question, error } = await supabase
        .from('questions')
        .insert(questionData)
        .select()
        .single();

      if (error) throw error;

      dismissToast(toastId);
      showSuccess('¡Pregunta publicada con éxito!');
      navigate(`/question/${question.id}`);
    } catch (error: any) {
      dismissToast(toastId);
      handleError(error, 'AskQuestion.onSubmit');
      setError('root', {
        message: 'Error al crear la pregunta. Intenta nuevamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            {/* Back button */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Volver al inicio
              </Button>
            </div>
            
            <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
              <HelpCircle className="mr-3 h-8 w-8 text-primary-500" />
              Hacer una Pregunta
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Comparte tu duda con la comunidad y obtén ayuda de otros estudiantes
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              <Card className="p-8">
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
                      disabled={loading}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.title ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      placeholder="¿Cuál es tu pregunta? Sé específico y claro"
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
                      disabled={loading}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.content ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                        disabled={loading}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                          errors.category_id ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                        } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                      disabled={loading}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                        errors.educational_level ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                            disabled={loading}
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
                        disabled={loading || tags.length >= 5}
                        className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                          loading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        placeholder="Agregar etiqueta..."
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        disabled={!tagInput.trim() || tags.length >= 5 || loading}
                      >
                        Agregar
                      </Button>
                    </div>
                    {errors.tags && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.tags.message}</p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      loading={loading}
                      disabled={loading}
                      className="flex-1"
                    >
                      Publicar Pregunta
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate('/')}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Tips */}
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <BookOpen className="mr-2 h-5 w-5 text-primary-500" />
                  Consejos para una buena pregunta
                </h3>
                <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">1</span>
                    Sé específico y claro en tu título
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">2</span>
                    Explica qué has intentado hasta ahora
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">3</span>
                    Incluye ejemplos o contexto relevante
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">4</span>
                    Usa etiquetas para categorizar tu pregunta
                  </li>
                  <li className="flex items-start">
                    <span className="bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">5</span>
                    Agrega una imagen si ayuda a explicar el problema
                  </li>
                </ul>
              </Card>

              {/* Community Guidelines */}
              <Card className="bg-gradient-to-br from-accent-50 to-secondary-50 dark:from-accent-900/20 dark:to-secondary-900/20">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  📋 Normas de la comunidad
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                  Mantén un ambiente respetuoso y colaborativo:
                </p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                  <li>• Sé respetuoso con otros usuarios</li>
                  <li>• No hagas trampa en tareas</li>
                  <li>• Busca antes de preguntar</li>
                  <li>• Agradece las respuestas útiles</li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}