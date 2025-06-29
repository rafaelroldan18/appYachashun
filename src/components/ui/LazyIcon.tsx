import React, { Suspense, lazy, ComponentType } from 'react';
import { LucideCrop as LucideProps } from 'lucide-react';
import { Loader2 } from 'lucide-react';

// Lazy load icon components to reduce initial bundle size
const iconCache = new Map<string, ComponentType<LucideProps>>();

interface LazyIconProps extends LucideProps {
  name: string;
  fallback?: ComponentType<LucideProps>;
}

export function LazyIcon({ name, fallback: Fallback = Loader2, ...props }: LazyIconProps) {
  // Check if icon is already cached
  if (iconCache.has(name)) {
    const IconComponent = iconCache.get(name)!;
    return <IconComponent {...props} />;
  }

  // Dynamically import the icon
  const IconComponent = lazy(async () => {
    try {
      const module = await import('lucide-react');
      const icon = (module as any)[name];
      
      if (!icon) {
        console.warn(`Icon "${name}" not found in lucide-react`);
        return { default: Fallback };
      }

      // Cache the icon for future use
      iconCache.set(name, icon);
      return { default: icon };
    } catch (error) {
      console.error(`Failed to load icon "${name}":`, error);
      return { default: Fallback };
    }
  });

  return (
    <Suspense fallback={<Fallback {...props} className={`animate-spin ${props.className || ''}`} />}>
      <IconComponent {...props} />
    </Suspense>
  );
}

// Pre-load commonly used icons
export const preloadIcons = (iconNames: string[]) => {
  iconNames.forEach(async (name) => {
    if (!iconCache.has(name)) {
      try {
        const module = await import('lucide-react');
        const icon = (module as any)[name];
        if (icon) {
          iconCache.set(name, icon);
        }
      } catch (error) {
        console.warn(`Failed to preload icon "${name}":`, error);
      }
    }
  });
};

// Common icons to preload
export const COMMON_ICONS = [
  'BookOpen',
  'User',
  'Search',
  'Menu',
  'X',
  'ChevronDown',
  'ChevronUp',
  'ChevronLeft',
  'ChevronRight',
  'Heart',
  'Star',
  'MessageCircle',
  'ThumbsUp',
  'ThumbsDown',
  'Share',
  'Eye',
  'Calendar',
  'Clock',
  'Settings',
  'Bell',
  'Home',
  'Plus',
  'Minus',
  'Edit',
  'Trash2',
  'Save',
  'Download',
  'Upload',
  'Check',
  'AlertTriangle',
  'Info',
  'HelpCircle',
];