# Dependencias del Proyecto - Guía Completa

## Tabla de Contenidos

1. [Dependencias Principales](#dependencias-principales)
2. [Dependencias de Desarrollo](#dependencias-de-desarrollo)
3. [Guía de Uso](#guía-de-uso)

---

## Dependencias Principales

### React y React DOM

**Versión:** `^19.2.0`

**Descripción:** 
Framework principal de JavaScript para construir interfaces de usuario con componentes reutilizables basados en componentes reactivos.

**Uso:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

// Crear un componente funcional
function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div>
      <p>Contador: {count}</p>
      <button onClick={() => setCount(count + 1)}>Incrementar</button>
    </div>
  );
}

// Renderizar la aplicación
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
```

---

### TailwindCSS y @tailwindcss/vite

**Versión:** `^4.1.18`

**Descripción:** 
Framework de CSS utilitario que permite construir diseños personalizados sin escribir CSS personalizado. La versión vite es el plugin que integra Tailwind con Vite.

**Uso:**
```tsx
export function Button() {
  return (
    <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition">
      Haz clic
    </button>
  );
}
```

**Configuración en `tailwind.config.ts`:**
```ts
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3B82F6',
      },
    },
  },
};
```

---

### Radix UI

**Versión:** `^1.4.3`

**Descripción:** 
Librería de componentes accesibles sin estilos predeterminados (unstyled). Proporciona primitivos de UI de bajo nivel que pueden ser estilizados con Tailwind.

**Uso:**
```tsx
import * as Dialog from '@radix-ui/react-dialog';

export function MyDialog() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button className="px-4 py-2 bg-blue-500 text-white rounded">
          Abrir Diálogo
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg">
          <Dialog.Title>Contenido del Diálogo</Dialog.Title>
          <Dialog.Close asChild>
            <button>Cerrar</button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

---

### @base-ui/react

**Versión:** `^1.2.0`

**Descripción:** 
Suite de componentes accesibles sin estilos. Alternativa a Radix UI con documentación más completa y mejor soporte para patrones complejos.

**Uso:**
```tsx
import { Tabs } from '@base-ui/react/Tabs';

export function MyTabs() {
  return (
    <Tabs.Root defaultValue="tab1">
      <Tabs.List>
        <Tabs.Tab value="tab1">Tab 1</Tabs.Tab>
        <Tabs.Tab value="tab2">Tab 2</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="tab1">Contenido Tab 1</Tabs.Panel>
      <Tabs.Panel value="tab2">Contenido Tab 2</Tabs.Panel>
    </Tabs.Root>
  );
}
```

---

### Lucide React

**Versión:** `^0.575.0`

**Descripción:** 
Librería de iconos SVG hermosos y consistentes, fáciles de personalizar y altamente optimizados.

**Uso:**
```tsx
import { Heart, Search, Menu } from 'lucide-react';

export function IconExample() {
  return (
    <div className="flex gap-4">
      <Heart className="w-6 h-6 text-red-500" />
      <Search className="w-6 h-6 text-gray-500" />
      <Menu className="w-6 h-6 text-gray-800" />
    </div>
  );
}
```

---

### Sonner

**Versión:** `^2.0.7`

**Descripción:** 
Librería para mostrar notificaciones toast (notificaciones emergentes) con soporte para React.

**Uso:**
```tsx
import { Toaster, toast } from 'sonner';

export function Notifications() {
  return (
    <>
      <Toaster />
      <button 
        onClick={() => {
          toast.success('¡Éxito!');
          toast.error('Error!');
          toast.loading('Cargando...');
          toast('Mensaje normal');
        }}
      >
        Mostrar Notificaciones
      </button>
    </>
  );
}
```

---

### Axios

**Versión:** `^1.13.5`

**Descripción:** 
Cliente HTTP basado en promesas para realizar peticiones a APIs. Alternativa mejorada a fetch con interceptores, cancelación de peticiones y transformación de datos.

**Uso:**
```tsx
import axios from 'axios';

// Crear instancia personalizada
const api = axios.create({
  baseURL: 'https://api.ejemplo.com',
  timeout: 5000,
});

// Realizar peticiones
async function fetchUsers() {
  try {
    const response = await api.get('/users');
    console.log(response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Petición POST con datos
async function createUser(userData) {
  const response = await api.post('/users', userData);
  return response.data;
}
```

---

### dotenv

**Versión:** `^17.3.1`

**Descripción:** 
Carga variables de entorno desde un archivo `.env` al `process.env`.

**Uso:**
```bash
# Archivo .env
VITE_API_URL=https://api.ejemplo.com
VITE_API_KEY=tu_clave_api
```

```tsx
const apiUrl = import.meta.env.VITE_API_URL;
const apiKey = import.meta.env.VITE_API_KEY;
```

**Nota:** En Vite, las variables deben comenzar con `VITE_` para ser expuestas al cliente.

---

### Next Themes

**Versión:** `^0.4.6`

**Descripción:** 
Librería para manejar temas (dark mode / light mode) en aplicaciones React con persistencia en localStorage.

**Uso:**
```tsx
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';

// Envolver la aplicación
function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MainApp />
    </ThemeProvider>
  );
}

// Usar el hook de tema
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Tema actual: {theme}
    </button>
  );
}
```

---

### Class Variance Authority (CVA)

**Versión:** `^0.7.1`

**Descripción:** 
Utilidad para crear componentes con variantes de CSS de forma segura y reutilizable.

**Uso:**
```tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  'px-4 py-2 rounded-lg font-medium transition',
  {
    variants: {
      variant: {
        primary: 'bg-blue-500 text-white hover:bg-blue-600',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        small: 'text-sm px-2 py-1',
        medium: 'text-base px-4 py-2',
        large: 'text-lg px-6 py-3',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
}

export function Button({ variant, size, children }: ButtonProps) {
  return <button className={buttonVariants({ variant, size })}>{children}</button>;
}
```

---

### clsx y tailwind-merge

**Versiones:** `^2.1.1` y `^3.5.0`

**Descripción:** 
- **clsx:** Utilidad para concatenar clases CSS de forma condicional.
- **tailwind-merge:** Fusiona clases de Tailwind resolviendo conflictos de especificidad.

**Uso:**
```tsx
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  variant?: 'primary' | 'secondary';
  className?: string;
  children: React.ReactNode;
}

export function Card({ variant = 'primary', className, children }: CardProps) {
  const baseClasses = 'p-4 rounded-lg border';
  const variantClasses = clsx({
    'bg-blue-500 text-white': variant === 'primary',
    'bg-gray-100 text-gray-800': variant === 'secondary',
  });
  
  // Fusionar clases evitando conflictos
  const finalClasses = twMerge(baseClasses, variantClasses, className);
  
  return <div className={finalClasses}>{children}</div>;
}
```

---

## Dependencias de Desarrollo

### TypeScript

**Versión:** `~5.9.3`

**Descripción:** 
Superset de JavaScript que agrega tipado estático, mejorando la seguridad y la experiencia de desarrollo.

**Uso:**
```tsx
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): Promise<User> {
  return fetch(`/api/users/${id}`).then(res => res.json());
}
```

---

### Vite

**Versión:** `^7.2.4`

**Descripción:** 
Herramienta de construcción y servidor de desarrollo extremadamente rápida para aplicaciones web modernas.

**Uso:**
```bash
# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Previsualizar construcción de producción
npm run preview
```

---

### Vite React Plugin (@vitejs/plugin-react)

**Versión:** `^5.1.1`

**Descripción:** 
Plugin oficial de Vite para React que proporciona Fast Refresh (recarga instantánea sin perder estado).

**Configuración en `vite.config.ts`:**
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
```

---

### ESLint y TypeScript ESLint

**Versiones:** `^9.39.1` y `^8.46.4`

**Descripción:** 
Herramientas de análisis estático para identificar errores y patrones problemáticos en el código.

**Plugins:**
- `eslint-plugin-react-hooks`: Valida las reglas de los Hooks de React
- `eslint-plugin-react-refresh`: Valida patrones de React Refresh
- `eslint-plugin-react-dom`: Valida patrones de ReactDOM
- `eslint-plugin-react-x`: Validaciones adicionales de React

**Uso:**
```bash
# Ejecutar linter
npm run lint

# Ejecutar y corregir automáticamente
npm run lint -- --fix
```

---

### shadcn

**Versión:** `^3.8.5`

**Descripción:** 
CLI para agregar componentes pre-construidos y estilizados con Tailwind e Radix UI al proyecto.

**Uso:**
```bash
# Inicializar shadcn en el proyecto
npx shadcn-ui@latest init

# Agregar un componente
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog

# Los componentes se agregarán a src/components/ui/
```

---

### tw-animate-css

**Versión:** `^1.4.0`

**Descripción:** 
Extensión de animaciones CSS para Tailwind, proporcionando animaciones predefinidas y personalizables.

**Uso:**
```tsx
export function AnimatedCard() {
  return (
    <div className="animate-fade-in">
      Contenido animado
    </div>
  );
}
```

---

### globals

**Versión:** `^16.5.0`

**Descripción:** 
Proporciona variables globales de Node.js y navegador como tipos para TypeScript.

**Configuración en `eslint.config.js`:**
```js
import globals from 'globals';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
];
```

---

### @types/* (Type Definitions)

**Dependencias de tipos:**
- `@types/react`: Tipos para React
- `@types/react-dom`: Tipos para React DOM
- `@types/node`: Tipos para APIs de Node.js

**Uso:**
Proporcionan autocompletado y validación de tipos en TypeScript.

---

## Guía de Uso

### Estructura Típica de un Componente

```tsx
// src/components/modules/MyComponent.tsx
import React from 'react';
import { Heart } from 'lucide-react';
import { toast } from 'sonner';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { Button } from '@/components/ui/button';

const cardVariants = cva('p-4 rounded-lg', {
  variants: {
    variant: {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-200 text-gray-800',
    },
  },
});

interface MyComponentProps extends VariantProps<typeof cardVariants> {
  title: string;
  description: string;
  onAction?: () => void;
  className?: string;
}

export function MyComponent({
  title,
  description,
  variant = 'primary',
  onAction,
  className,
}: MyComponentProps) {
  const [liked, setLiked] = React.useState(false);

  const handleAction = () => {
    setLiked(!liked);
    toast.success(`¡${title} ${liked ? 'desfavorecido' : 'favorecido'}!`);
    onAction?.();
  };

  return (
    <div className={twMerge(cardVariants({ variant }), className)}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm opacity-80">{description}</p>
        </div>
        <Heart
          className={`w-6 h-6 cursor-pointer transition ${
            liked ? 'fill-current' : ''
          }`}
          onClick={() => setLiked(!liked)}
        />
      </div>
      <Button onClick={handleAction} className="mt-4 w-full">
        Realizar Acción
      </Button>
    </div>
  );
}
```

### Peticiones a API con Axios

```tsx
// src/core/applications/userService.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const userService = {
  getUsers: () => api.get('/users'),
  getUser: (id: string) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id: string, data) => api.put(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
};
```

### Manejo de Tema

```tsx
// En tu componente raíz (App.tsx)
import { ThemeProvider } from 'next-themes';
import { useTheme } from 'next-themes';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <MainApp />
    </ThemeProvider>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800"
    >
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## Referencias y Documentación Oficial

- **React:** https://react.dev
- **TailwindCSS:** https://tailwindcss.com
- **Radix UI:** https://www.radix-ui.com
- **Base UI:** https://base-ui.com
- **Lucide Icons:** https://lucide.dev
- **Sonner:** https://sonner.emilkowal.ski
- **Axios:** https://axios-http.com
- **CVA:** https://cva.style
- **Next Themes:** https://github.com/pacocoursey/next-themes
- **shadcn:** https://ui.shadcn.com

---

*Última actualización: Febrero 2026*
