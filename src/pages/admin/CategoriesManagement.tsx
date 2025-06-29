import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Search,
  TrendingUp
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast } from '../../utils/errorHandling';

interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  question_count: number;
  created_at: string;
}

const categorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido').max(100, 'El nombre no puede exceder 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede exceder 500 caracteres').optional(),
  icon: z.string().max(10, 'El icono no puede exceder 10 caracteres').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Debe ser un color hexadecimal válido'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoriesManagement() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    setError,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      color: '#3B82F6',
    },
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('question_count', { ascending: false });

      if (error) throw error;
      
      // Update question counts to ensure they're accurate
      const updatedCategories = await updateCategoryCounts(data || []);
      setCategories(updatedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
      handleError(error, 'CategoriesManagement.loadCategories');
    } finally {
      setLoading(false);
    }
  };

  // Function to update category question counts
  const updateCategoryCounts = async (categoriesData: Category[]): Promise<Category[]> => {
    try {
      // For each category, get the actual count of questions
      const updatedCategories = await Promise.all(
        categoriesData.map(async (category) => {
          const { count, error } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id);
          
          if (error) {
            console.warn(`Error getting count for category ${category.id}:`, error);
            return category;
          }
          
          // Update the question_count if it's different
          if (count !== category.question_count) {
            const { error: updateError } = await supabase
              .from('categories')
              .update({ question_count: count || 0 })
              .eq('id', category.id);
            
            if (updateError) {
              console.warn(`Error updating count for category ${category.id}:`, updateError);
            }
            
            return { ...category, question_count: count || 0 };
          }
          
          return category;
        })
      );
      
      return updatedCategories;
    } catch (error) {
      console.error('Error updating category counts:', error);
      return categoriesData;
    }
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setSubmitting(true);
      const toastId = showLoading(editingCategory ? 'Actualizando categoría...' : 'Creando categoría...');

      if (editingCategory) {
        // Update existing category
        const { error } = await supabase
          .from('categories')
          .update({
            name: data.name,
            description: data.description || null,
            icon: data.icon || null,
            color: data.color,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        dismissToast(toastId);
        showSuccess('Categoría actualizada correctamente');
      } else {
        // Create new category
        const { error } = await supabase
          .from('categories')
          .insert({
            name: data.name,
            description: data.description || null,
            icon: data.icon || null,
            color: data.color,
          });

        if (error) throw error;
        dismissToast(toastId);
        showSuccess('Categoría creada correctamente');
      }

      await loadCategories();
      resetForm();
    } catch (error: any) {
      setError('root', {
        message: error.message || 'Error al guardar la categoría',
      });
      handleError(error, 'CategoriesManagement.onSubmit');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCategory = async (categoryId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría? Las preguntas asociadas quedarán sin categoría.')) {
      return;
    }

    try {
      const toastId = showLoading('Eliminando categoría...');
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (error) throw error;
      dismissToast(toastId);
      showSuccess('Categoría eliminada correctamente');
      await loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      handleError(error, 'CategoriesManagement.deleteCategory');
    }
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setShowCreateForm(true);
    setValue('name', category.name);
    setValue('description', category.description || '');
    setValue('icon', category.icon || '');
    setValue('color', category.color);
  };

  const resetForm = () => {
    setEditingCategory(null);
    setShowCreateForm(false);
    reset({
      name: '',
      description: '',
      icon: '',
      color: '#3B82F6',
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const predefinedColors = [
    '#3B82F6', '#10B981', '#0EA5E9', '#22C55E', '#6366F1',
    '#0891B2', '#16A34A', '#2563EB', '#059669', '#0D9488'
  ];

  const predefinedIcons = [
    '📚', '🔬', '📐', '🎨', '🏃‍♂️', '🌍', '💻', '🎵', '📖', '🧮',
    '⚗️', '🔭', '🎭', '📝', '🏛️', '🌱', '💡', '🎯', '🔍', '⚡'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center">
                <BookOpen className="mr-3 h-8 w-8 text-primary-500" />
                Gestión de Categorías
              </h1>
              <p className="mt-2 text-gray-600">
                Administra las categorías de preguntas de la plataforma
              </p>
            </div>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nueva Categoría
            </Button>
          </div>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <Card className="p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h2>
              <Button variant="ghost" onClick={resetForm}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {errors.root && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm">
                {errors.root.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                      errors.name ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Nombre de la categoría"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color *
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      {...register('color')}
                      type="color"
                      className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      {...register('color')}
                      type="text"
                      className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                        errors.color ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="#3B82F6"
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setValue('color', color)}
                        className="w-6 h-6 rounded border-2 border-gray-300 hover:border-gray-400"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  {errors.color && (
                    <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.description ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Descripción de la categoría (opcional)"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icono (Emoji)
                </label>
                <input
                  {...register('icon')}
                  type="text"
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.icon ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="📚"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {predefinedIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setValue('icon', icon)}
                      className="w-8 h-8 text-lg hover:bg-gray-100 rounded border border-gray-300"
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                {errors.icon && (
                  <p className="mt-1 text-sm text-red-600">{errors.icon.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit" loading={submitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {editingCategory ? 'Actualizar' : 'Crear'} Categoría
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Search */}
        <Card className="p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </Card>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl"
                    style={{ 
                      backgroundColor: category.name.toLowerCase().includes('matemáticas') ? '#3B82F6' : 
                                      category.name.toLowerCase().includes('ciencias') ? '#10B981' : 
                                      category.name.toLowerCase().includes('historia') ? '#3B82F6' : 
                                      category.name.toLowerCase().includes('inglés') ? '#10B981' : 
                                      category.name.toLowerCase().includes('literatura') ? '#3B82F6' : 
                                      category.name.toLowerCase().includes('geografía') ? '#10B981' : 
                                      category.name.toLowerCase().includes('filosofía') ? '#3B82F6' : 
                                      category.name.toLowerCase().includes('arte') ? '#10B981' : 
                                      category.name.toLowerCase().includes('tecnología') ? '#3B82F6' : 
                                      '#10B981'
                    }}
                  >
                    {category.icon || '📚'}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {category.name}
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="primary" size="sm">
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {category.question_count} preguntas
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {category.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {category.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                <span>Creada: {new Date(category.created_at).toLocaleDateString()}</span>
                <span style={{ color: category.color }}>●</span>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => startEdit(category)}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => deleteCategory(category.id)}
                  disabled={category.question_count > 0}
                  title={category.question_count > 0 ? 'No se puede eliminar una categoría con preguntas' : 'Eliminar categoría'}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <Card className="p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay categorías
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'No se encontraron categorías que coincidan con tu búsqueda.' : 'Aún no hay categorías creadas.'}
            </p>
            {!searchTerm && (
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Categoría
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}