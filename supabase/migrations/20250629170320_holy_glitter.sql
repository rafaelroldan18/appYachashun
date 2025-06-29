/*
  # Add Educational Categories

  1. Changes
    - Add comprehensive list of educational categories for Ecuador's education system
    - Organize categories by educational level (Primary, Secondary, University)
    - Include specialized fields and cross-cutting categories
    - Ensure proper color coding and icons for visual distinction

  2. Structure
    - Primary Education (Educación General Básica)
    - Secondary Education (Bachillerato)
    - Higher Education (Universidad)
    - Cross-cutting categories
*/

-- Clear existing categories to start fresh
DELETE FROM categories;

-- Reset sequence if needed
-- ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- Primary Education Categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Matemática Básica', 'Aritmética, geometría básica y resolución de problemas', '🔢', '#3B82F6'),
  ('Lengua y Literatura', 'Lectura, escritura, gramática y comprensión lectora', '📝', '#10B981'),
  ('Ciencias Naturales', 'Biología básica, medio ambiente y ciencias de la vida', '🌱', '#3B82F6'),
  ('Estudios Sociales', 'Historia, geografía y cultura del Ecuador', '🌎', '#10B981'),
  ('Educación Cultural y Artística', 'Expresión artística, música y cultura', '🎨', '#3B82F6'),
  ('Educación Física', 'Deportes, actividad física y salud', '⚽', '#10B981'),
  ('Inglés Básico', 'Vocabulario básico, gramática elemental y conversación', '🇬🇧', '#3B82F6'),
  ('Informática Básica', 'Uso de computadoras y tecnología básica', '💻', '#10B981'),
  ('Valores y Ciudadanía', 'Ética, valores y educación ciudadana', '🤝', '#3B82F6');

-- Secondary Education Categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Matemáticas Avanzadas', 'Álgebra, geometría, trigonometría y cálculo básico', '📊', '#10B981'),
  ('Literatura y Composición', 'Análisis literario, redacción y literatura universal', '📚', '#3B82F6'),
  ('Física', 'Mecánica, electricidad, ondas y termodinámica', '⚛️', '#10B981'),
  ('Química', 'Química orgánica e inorgánica, estequiometría', '🧪', '#3B82F6'),
  ('Biología', 'Anatomía, genética, ecología y evolución', '🔬', '#10B981'),
  ('Historia', 'Historia del Ecuador y del mundo', '🏛️', '#3B82F6'),
  ('Filosofía', 'Pensamiento crítico y filosofía básica', '🤔', '#10B981'),
  ('Inglés Intermedio', 'Gramática avanzada, comprensión y expresión oral', '🇺🇸', '#3B82F6'),
  ('Emprendimiento', 'Gestión de proyectos y emprendimiento', '💼', '#10B981'),
  ('Educación Ciudadana', 'Derechos, deberes y participación ciudadana', '⚖️', '#3B82F6'),
  ('TIC', 'Tecnologías de la información y comunicación', '📱', '#10B981');

-- Technical Education Categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Contabilidad', 'Principios contables y gestión financiera', '📒', '#3B82F6'),
  ('Administración', 'Gestión empresarial y administración', '📈', '#10B981'),
  ('Electricidad', 'Circuitos eléctricos y electrotecnia', '⚡', '#3B82F6'),
  ('Electrónica', 'Componentes electrónicos y circuitos', '🔌', '#10B981'),
  ('Mecánica Automotriz', 'Sistemas automotrices y mantenimiento', '🚗', '#3B82F6'),
  ('Turismo', 'Gestión turística y patrimonio cultural', '🏞️', '#10B981');

-- Higher Education Categories
INSERT INTO categories (name, description, icon, color) VALUES
  -- Exact Sciences
  ('Álgebra Lineal', 'Matrices, espacios vectoriales y transformaciones lineales', '🧮', '#3B82F6'),
  ('Cálculo', 'Cálculo diferencial e integral, series y ecuaciones', '📉', '#10B981'),
  ('Estadística', 'Probabilidad, inferencia estadística y análisis de datos', '📊', '#3B82F6'),
  ('Física Universitaria', 'Mecánica clásica, electromagnetismo y física moderna', '🔭', '#10B981'),
  ('Química General', 'Química avanzada para nivel universitario', '⚗️', '#3B82F6'),
  ('Programación', 'Lenguajes de programación y algoritmos', '👨‍💻', '#10B981'),
  ('Bases de Datos', 'Diseño y gestión de bases de datos', '🗄️', '#3B82F6'),
  ('Sistemas Operativos', 'Arquitectura y administración de sistemas', '🖥️', '#10B981'),
  ('Ingeniería de Software', 'Desarrollo y arquitectura de software', '🔧', '#3B82F6'),
  
  -- Social Sciences
  ('Derecho', 'Derecho constitucional, civil y otras ramas jurídicas', '⚖️', '#10B981'),
  ('Psicología', 'Psicología general, clínica y educativa', '🧠', '#3B82F6'),
  ('Sociología', 'Teoría social y análisis sociológico', '👥', '#10B981'),
  ('Economía', 'Teoría económica, micro y macroeconomía', '💰', '#3B82F6'),
  ('Pedagogía', 'Teorías educativas y didáctica', '👨‍🏫', '#10B981'),
  ('Historia del Ecuador', 'Historia nacional profundizada', '🇪🇨', '#3B82F6'),
  ('Lingüística', 'Estudio del lenguaje y la comunicación', '🗣️', '#10B981'),
  
  -- Health Sciences
  ('Anatomía', 'Estructura del cuerpo humano', '🦴', '#3B82F6'),
  ('Fisiología', 'Funcionamiento de órganos y sistemas', '❤️', '#10B981'),
  ('Bioquímica', 'Procesos químicos en organismos vivos', '🧬', '#3B82F6'),
  ('Enfermería', 'Cuidados y atención de enfermería', '👨‍⚕️', '#10B981'),
  ('Farmacología', 'Estudio de medicamentos y su acción', '💊', '#3B82F6'),
  ('Nutrición', 'Alimentación y nutrición humana', '🥗', '#10B981'),
  ('Salud Pública', 'Prevención y promoción de la salud', '🏥', '#3B82F6'),
  
  -- Business and Economics
  ('Contabilidad General', 'Contabilidad avanzada y auditoría', '📊', '#10B981'),
  ('Administración Empresarial', 'Gestión y dirección de empresas', '👔', '#3B82F6'),
  ('Finanzas', 'Gestión financiera y mercados', '💹', '#10B981'),
  ('Marketing', 'Estrategias de mercadeo y publicidad', '📣', '#3B82F6'),
  ('Microeconomía', 'Comportamiento económico a nivel individual', '📉', '#10B981'),
  ('Macroeconomía', 'Economía a nivel nacional y global', '📈', '#3B82F6'),
  ('Comercio Internacional', 'Intercambio comercial entre países', '🌐', '#10B981'),
  
  -- Languages
  ('Español Avanzado', 'Gramática avanzada y literatura', '🇪🇸', '#3B82F6'),
  ('Inglés Avanzado', 'Dominio del idioma inglés', '🇬🇧', '#10B981'),
  ('Francés', 'Idioma y cultura francesa', '🇫🇷', '#3B82F6'),
  ('Quechua', 'Idioma ancestral andino', '🌄', '#10B981');

-- Cross-cutting Categories
INSERT INTO categories (name, description, icon, color) VALUES
  ('Tareas y Deberes', 'Ayuda con tareas escolares y universitarias', '📝', '#3B82F6'),
  ('Ortografía', 'Reglas ortográficas y gramática', '✏️', '#10B981'),
  ('Lógica y Razonamiento', 'Pensamiento lógico y resolución de problemas', '🧩', '#3B82F6'),
  ('Álgebra de Baldor', 'Ejercicios y problemas del famoso libro', '📘', '#10B981'),
  ('Ética', 'Principios éticos y morales', '⚖️', '#3B82F6'),
  ('Preparación para Exámenes', 'Ayuda para pruebas de ingreso y evaluaciones', '📄', '#10B981'),
  ('Preguntas Tipo Test', 'Preparación para exámenes de opción múltiple', '✅', '#3B82F6');

-- Run the refresh function to update all category counts
SELECT refresh_all_category_counts();