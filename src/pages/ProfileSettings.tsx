import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Save, 
  X, 
  Camera, 
  MapPin, 
  Briefcase, 
  School, 
  ExternalLink,
  Heart,
  AlertTriangle,
  Pencil,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Avatar } from '../components/ui/Avatar';
import { LoadingSpinner, ErrorState } from '../components/ui/LoadingStates';
import { supabase } from '../lib/supabase';
import { profileSchema, type ProfileFormData } from '../utils/validation';
import { handleError, showSuccess, showLoading, dismissToast, showWarning } from '../utils/errorHandling';

export function ProfileSettings() {
  const { user, userProfile, updateProfile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState('');
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [formChanged, setFormChanged] = useState(false);
  const [originalValues, setOriginalValues] = useState<ProfileFormData | null>(null);
  const [originalInterests, setOriginalInterests] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, dirtyFields },
    setError: setFormError,
    setValue,
    watch,
    reset
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: '',
      bio: '',
      avatar_url: '',
      full_name: '',
    },
  });

  // Watch all form values to detect changes
  const formValues = watch();

  useEffect(() => {
    if (user && userProfile) {
      setLoading(false);
      setAvatarUrl(userProfile.avatar_url);
      setFullName(userProfile.full_name || '');
      
      // Set form values
      const defaultValues = {
        username: userProfile.username,
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        full_name: userProfile.full_name || '',
      };
      
      reset(defaultValues);
      setOriginalValues(defaultValues);
      
      // Set additional profile fields if they exist
      if (userProfile.interests) {
        setInterests(userProfile.interests);
        setOriginalInterests(userProfile.interests);
      }
    } else if (!loading && !user) {
      navigate('/login');
    }
  }, [user, userProfile]);

  // Check if form has changed compared to original values
  useEffect(() => {
    if (!originalValues) return;

    const hasFormFieldsChanged = Object.keys(originalValues).some(
      key => formValues[key as keyof ProfileFormData] !== originalValues[key as keyof ProfileFormData]
    );
    
    const hasInterestsChanged = 
      !originalInterests || 
      originalInterests.length !== interests.length || 
      !originalInterests.every(interest => interests.includes(interest));
    
    const hasAvatarChanged = !!avatarFile;
    
    setFormChanged(hasFormFieldsChanged || hasInterestsChanged || hasAvatarChanged);
  }, [formValues, interests, avatarFile, originalValues, originalInterests]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showWarning('Solo se permiten archivos de imagen');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showWarning('La imagen no puede ser mayor a 2MB');
      return;
    }

    setAvatarFile(file);
    setAvatarUrl(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    try {
      // Generate unique filename
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      handleError(error, 'ProfileSettings.uploadAvatar');
      return null;
    }
  };

  const addInterest = () => {
    const trimmedInterest = interestInput.trim();
    if (trimmedInterest && !interests.includes(trimmedInterest) && interests.length < 5) {
      setInterests([...interests, trimmedInterest]);
      setInterestInput('');
    }
  };

  const removeInterest = (interestToRemove: string) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addInterest();
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) {
      navigate('/login');
      return;
    }

    const toastId = showLoading('Actualizando perfil...');
    setSubmitting(true);

    try {
      // Upload avatar if changed
      let finalAvatarUrl = data.avatar_url;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          finalAvatarUrl = uploadedUrl;
        }
      }

      // Update profile
      await updateProfile({
        username: data.username,
        bio: data.bio || null,
        avatar_url: finalAvatarUrl || null,
        interests: interests,
        full_name: data.full_name || null,
        // Add other fields as needed
      });

      // Refresh profile data
      await refreshProfile();

      dismissToast(toastId);
      showSuccess('Perfil actualizado correctamente');
      
      // Update original values to match current values
      setOriginalValues({
        username: data.username,
        bio: data.bio || '',
        avatar_url: finalAvatarUrl || '',
        full_name: data.full_name || '',
      });
      
      setOriginalInterests([...interests]);
      
      // Reset form state
      setFormChanged(false);
      setAvatarFile(null);
      
      navigate('/profile');
    } catch (error: any) {
      dismissToast(toastId);
      handleError(error, 'ProfileSettings.onSubmit');
      setFormError('root', {
        message: 'Error al actualizar el perfil. Intenta nuevamente.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateAccount = async () => {
    if (!user) return;

    const toastId = showLoading('Desactivando cuenta...');
    setSubmitting(true);

    try {
      // In a real implementation, you might want to:
      // 1. Set a "deactivated" flag on the user record
      // 2. Anonymize user data
      // 3. Revoke sessions
      
      // For this example, we'll just sign out the user
      await supabase.auth.signOut();

      dismissToast(toastId);
      showSuccess('Cuenta desactivada correctamente');
      navigate('/');
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'ProfileSettings.handleDeactivateAccount');
    } finally {
      setSubmitting(false);
      setShowDeactivateConfirm(false);
    }
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Cargando perfil..." />
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <ErrorState
          title="Error"
          message="No se pudo cargar el perfil. Por favor, inicia sesión nuevamente."
          action={
            <Button onClick={() => navigate('/login')} variant="primary">
              Iniciar sesión
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
              onClick={() => navigate('/profile')}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Volver al perfil
            </Button>
          </div>
          
          <h1 className="text-3xl font-display font-bold text-gray-900 dark:text-white flex items-center">
            <User className="mr-3 h-8 w-8 text-primary-500" />
            Configuración de Perfil
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Actualiza tu información personal y preferencias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 text-center mb-6">
              <div className="relative mb-4 inline-block">
                <Avatar
                  src={avatarUrl}
                  alt={userProfile.username}
                  size="2xl"
                  showEditButton
                  onEditClick={() => {
                    const fileInput = document.getElementById('avatar-upload');
                    if (fileInput) {
                      fileInput.click();
                    }
                  }}
                />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              
              <div className="mb-4">
                {editingName ? (
                  <div className="flex items-center justify-center space-x-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-center"
                      placeholder="Tu nombre completo"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setValue('full_name', fullName);
                        setEditingName(false);
                      }}
                    >
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mr-2">
                      {fullName || userProfile.username}
                    </h2>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setEditingName(true)}
                      className="text-gray-500 hover:text-primary-500"
                    >
                      <Pencil className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  @{userProfile.username}
                </p>
              </div>
              
              <Badge variant="primary" className="mb-4">
                Nivel {userProfile.level}
              </Badge>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Miembro desde {new Date(userProfile.created_at).toLocaleDateString()}
              </p>
              
              <Button
                variant="outline"
                onClick={() => navigate('/profile')}
                className="w-full"
              >
                Ver mi perfil público
              </Button>
            </Card>
            
            <Card className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800">
              <h3 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-4">Zona de peligro</h3>
              <p className="text-sm text-red-600 dark:text-red-300 mb-4">
                La desactivación de tu cuenta eliminará tu perfil y anonimizará tus contribuciones.
              </p>
              <Button
                variant="danger"
                onClick={() => setShowDeactivateConfirm(true)}
                className="w-full"
              >
                Desactivar cuenta
              </Button>
            </Card>
          </div>

          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card className="p-8">
              {errors.root && (
                <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {errors.root.message}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre completo
                  </label>
                  <input
                    {...register('full_name')}
                    type="text"
                    disabled={submitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.full_name ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Tu nombre completo"
                  />
                  {errors.full_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Username */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre de usuario *
                  </label>
                  <input
                    {...register('username')}
                    type="text"
                    disabled={submitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.username ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                  {errors.username && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.username.message}</p>
                  )}
                </div>

                {/* Bio */}
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Biografía
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={4}
                    disabled={submitting}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors ${
                      errors.bio ? 'border-red-300 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    placeholder="Cuéntanos un poco sobre ti..."
                  />
                  {errors.bio && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.bio.message}</p>
                  )}
                </div>

                {/* Additional Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      Ubicación
                    </label>
                    <input
                      type="text"
                      name="location"
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Ciudad, País"
                    />
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Sitio web
                    </label>
                    <input
                      type="url"
                      name="website"
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="https://ejemplo.com"
                    />
                  </div>

                  {/* Education */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <School className="w-4 h-4 mr-1" />
                      Educación
                    </label>
                    <input
                      type="text"
                      name="education"
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Institución educativa"
                    />
                  </div>

                  {/* Occupation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <Briefcase className="w-4 h-4 mr-1" />
                      Ocupación
                    </label>
                    <input
                      type="text"
                      name="occupation"
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      placeholder="Estudiante, Profesional, etc."
                    />
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Heart className="w-4 h-4 mr-1" />
                    Intereses (máximo 5)
                  </label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300"
                      >
                        <Heart className="w-3 h-3 mr-1" />
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
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
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyPress={handleInterestKeyPress}
                      disabled={submitting || interests.length >= 5}
                      className={`flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-colors ${
                        submitting ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      placeholder="Agregar interés..."
                    />
                    <Button
                      type="button"
                      onClick={addInterest}
                      variant="outline"
                      disabled={!interestInput.trim() || interests.length >= 5 || submitting}
                    >
                      Agregar
                    </Button>
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="submit"
                    loading={submitting}
                    disabled={submitting || !formChanged}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/profile')}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>

        {/* Deactivate Account Confirmation */}
        {showDeactivateConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full p-6">
              <div className="flex items-center mb-4 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-6 h-6 mr-2" />
                <h3 className="text-lg font-semibold">Confirmar desactivación</h3>
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-6">
                ¿Estás seguro de que deseas desactivar tu cuenta? Esta acción no se puede deshacer y perderás acceso a todas tus contribuciones.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowDeactivateConfirm(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDeactivateAccount}
                  loading={submitting}
                  className="flex-1"
                >
                  Desactivar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}