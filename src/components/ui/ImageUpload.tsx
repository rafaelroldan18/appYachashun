import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { handleError, showSuccess, showLoading, dismissToast } from '../../utils/errorHandling';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  currentImage?: string;
  maxSizeMB?: number;
  className?: string;
  folderPath?: string;
}

export function ImageUpload({
  onImageUploaded,
  onImageRemoved,
  currentImage,
  maxSizeMB = 5,
  className = '',
  folderPath = 'questions'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      handleError(new Error('Solo se permiten archivos de imagen'), 'ImageUpload.validateFile');
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      handleError(new Error(`El archivo no puede ser mayor a ${maxSizeMB}MB`), 'ImageUpload.validateFile');
      return false;
    }

    return true;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    if (!validateFile(file)) return null;

    const toastId = showLoading('Subiendo imagen...');
    setUploading(true);

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      dismissToast(toastId);
      showSuccess('Imagen subida correctamente');
      
      return publicUrl;
    } catch (error) {
      dismissToast(toastId);
      handleError(error, 'ImageUpload.uploadImage');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Create preview
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);

    // Upload file
    const uploadedUrl = await uploadImage(file);
    if (uploadedUrl) {
      onImageUploaded(uploadedUrl);
    } else {
      // Remove preview if upload failed
      setPreview(null);
      URL.revokeObjectURL(previewUrl);
    }
  };

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    if (preview && preview.startsWith('blob:')) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    onImageRemoved();
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Imagen opcional
        </label>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={uploading}
            className="text-red-600 hover:text-red-700"
          >
            <X className="w-4 h-4 mr-1" />
            Quitar
          </Button>
        )}
      </div>

      <AnimatePresence>
        {preview ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative"
          >
            <img
              src={preview}
              alt="Vista previa"
              className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Subiendo...</p>
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center"
          >
            <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Agrega una imagen para ayudar a explicar tu respuesta
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={uploading}
                className="flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                Subir archivo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openCameraDialog}
                disabled={uploading}
                className="flex items-center"
              >
                <Camera className="w-4 h-4 mr-2" />
                Tomar foto
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Formatos soportados: JPG, PNG, GIF. Tamaño máximo: {maxSizeMB}MB
      </p>
    </div>
  );
}