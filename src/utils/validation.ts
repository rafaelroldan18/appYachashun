import { z } from 'zod';

// User validation schemas
export const signUpSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  email: z
    .string()
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export const signInSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo electrónico válido'),
  password: z
    .string()
    .min(1, 'La contraseña es requerida'),
});

// Question validation schemas
export const questionSchema = z.object({
  title: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(255, 'El título no puede exceder 255 caracteres'),
  content: z
    .string()
    .min(20, 'El contenido debe tener al menos 20 caracteres')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
  category_id: z
    .string()
    .uuid('Selecciona una categoría válida')
    .optional(),
  tags: z
    .array(z.string())
    .max(5, 'No puedes agregar más de 5 etiquetas')
    .optional(),
  educational_level: z
    .enum(['primaria', 'secundaria', 'universidad', 'otro'], {
      errorMap: () => ({ message: 'Selecciona un nivel educativo válido' }),
    }),
  image_url: z
    .string()
    .url('La URL de la imagen no es válida')
    .optional()
    .or(z.literal('')),
});

// Answer validation schema
export const answerSchema = z.object({
  content: z
    .string()
    .min(10, 'La respuesta debe tener al menos 10 caracteres')
    .max(3000, 'La respuesta no puede exceder 3000 caracteres'),
  image_url: z
    .string()
    .url('La URL de la imagen no es válida')
    .optional()
    .or(z.literal('')),
});

// Profile validation schema
export const profileSchema = z.object({
  username: z
    .string()
    .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
    .max(50, 'El nombre de usuario no puede exceder 50 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'),
  bio: z
    .string()
    .max(500, 'La biografía no puede exceder 500 caracteres')
    .optional(),
  avatar_url: z
    .string()
    .url('Ingresa una URL válida')
    .optional()
    .or(z.literal('')),
  full_name: z
    .string()
    .max(100, 'El nombre completo no puede exceder 100 caracteres')
    .optional()
    .or(z.literal('')),
});

// Report validation schema
export const reportSchema = z.object({
  reason: z
    .string()
    .min(1, 'Selecciona una razón para el reporte'),
  description: z
    .string()
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional(),
});

// Search validation schema
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Ingresa un término de búsqueda')
    .max(100, 'El término de búsqueda no puede exceder 100 caracteres')
    .optional(),
  category: z
    .string()
    .optional(),
  educational_level: z
    .enum(['primaria', 'secundaria', 'universidad', 'otro'])
    .optional(),
  sort_by: z
    .enum(['relevance', 'date', 'votes', 'answers'])
    .optional(),
});

// Type exports for TypeScript
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type QuestionFormData = z.infer<typeof questionSchema>;
export type AnswerFormData = z.infer<typeof answerSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
export type ReportFormData = z.infer<typeof reportSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;