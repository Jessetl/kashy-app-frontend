---
name: rnr-ui-designer
description: >
  Guía para diseñar UI/UX en React Native con react-native-reusables (RNR), NativeWind v4
  y principios de diseño visual. Usa esta skill siempre que el usuario pida crear pantallas,
  componentes visuales, layouts, temas, animaciones, microinteracciones, o cualquier elemento
  de interfaz en React Native. También cuando mencione colores, tipografía, jerarquía visual,
  espaciado, dark mode, accesibilidad, diseño responsive para iOS y Android, NativeWind,
  Tailwind en mobile, theming con CSS variables HSL, o estilos consistentes.
  Actívala cuando el usuario diga "diseña una pantalla", "crea un componente bonito",
  "hazlo más visual", "mejora el diseño", "agrega animaciones", "ponle dark mode",
  "hazlo accesible", "crea un theme", "dale estilo a esto", "necesito un formulario atractivo",
  "hazme un bottom sheet", "diseña un onboarding", "crea una card", "agrega transiciones",
  "mejora la tipografía", "ajusta los colores", "hazlo responsive", "crea tabs con estilo",
  "diseña el login", "agrega un skeleton loader", o cualquier petición que implique la
  apariencia visual, estética, accesibilidad, o experiencia de usuario en React Native.
  Incluso si el usuario no dice "UI" o "diseño", actívala si la tarea involucra
  cómo se VE o cómo se SIENTE la interfaz.
---

# React Native UI Designer — Skill

> Guía genérica para diseñar interfaces en React Native con react-native-reusables (RNR) y NativeWind.
> Cubre componentes, tokens de color, tipografía, espaciado, accesibilidad, dark mode y animaciones.
> Aplica a cualquier proyecto React Native independientemente de su arquitectura.

---

## Principio

**Lo que se ve bien, se siente bien, y se usa sin pensar — en cualquier dispositivo.** Cada pantalla debe sentirse nativa, pulida y accesible tanto en iOS como en Android.

---

## Stack de UI

| Herramienta                        | Rol                                                               |
| :--------------------------------- | :---------------------------------------------------------------- |
| **react-native-reusables (RNR)**   | Librería de componentes UI (port de shadcn/ui para React Native). |
| **NativeWind v4**                  | Estilos utility-first (Tailwind CSS para React Native).           |
| **@rn-primitives**                 | Primitivos universales (port de Radix UI) para accesibilidad.     |
| **React Native Reanimated**        | Animaciones y microinteracciones de alto rendimiento.             |
| **class-variance-authority (CVA)** | Variantes de componentes tipadas.                                 |
| **clsx + tailwind-merge**          | Merge inteligente de clases NativeWind.                           |
| **Lucide React Native**            | Iconografía consistente.                                          |
| **Expo**                           | Plataforma de desarrollo.                                         |

---

## Componentes Disponibles en RNR

Antes de crear un componente custom, verificar si RNR ya lo ofrece. Se instalan vía CLI: `npx @react-native-reusables/cli@latest add [nombre]`

| Categoría                 | Componentes                                                                                     |
| :------------------------ | :---------------------------------------------------------------------------------------------- |
| **Layout y Contenedores** | Accordion, AspectRatio, Card, Collapsible, Separator, Table, Tabs                               |
| **Formularios e Inputs**  | Button, Checkbox, Input, Label, RadioGroup, Select, Switch, Text, Textarea, Toggle, ToggleGroup |
| **Feedback y Estados**    | Alert, AlertDialog, Badge, Dialog, Skeleton, Tooltip, Typography                                |
| **Navegación y Overlays** | ContextMenu, DropdownMenu, HoverCard, Menubar, NavigationMenu, Popover                          |
| **Media**                 | Avatar                                                                                          |

> **Regla:** si el usuario pide un componente que RNR ya tiene, SIEMPRE usar el de RNR y personalizarlo. Nunca recrear lo que ya existe.

---

## Principios de Diseño Visual

### 1. Jerarquía Visual

Cada pantalla debe tener una jerarquía clara que guíe el ojo del usuario:

```
NIVEL 1: Título / Acción Principal  ← Lo más grande, prominente
NIVEL 2: Subtítulos / Secciones     ← Tamaño medio, contraste menor
NIVEL 3: Contenido / Body text      ← Tamaño base, legible
NIVEL 4: Metadata / Timestamps      ← Pequeño, muted-foreground
NIVEL 5: Acciones Secundarias       ← Iconos, enlaces sutiles
```

### 2. Color — Solo Tokens Semánticos

NUNCA colores hardcodeados (`bg-red-500`). SIEMPRE tokens semánticos (`bg-primary`, `text-destructive`). Colores concretos solo en `global.css`.

### 3. Tipografía — Sin Herencia

React Native **NO** hereda estilos de texto. Cada `<Text>` necesita su PROPIA clase de color.

| Uso                | Clase NativeWind                | Tamaño aprox. |
| :----------------- | :------------------------------ | :------------ |
| Hero / Display     | `text-4xl font-bold`            | 36px          |
| Título de pantalla | `text-2xl font-bold`            | 24px          |
| Título de sección  | `text-xl font-semibold`         | 20px          |
| Subtítulo          | `text-lg font-medium`           | 18px          |
| Body               | `text-base`                     | 16px          |
| Caption / Metadata | `text-sm text-muted-foreground` | 14px          |
| Micro / Labels     | `text-xs text-muted-foreground` | 12px          |

```tsx
// ❌ INCORRECTO — React Native no hereda estilos de texto
<View className="text-foreground">
  <Text>Este texto NO tendrá color</Text>
</View>

// ✅ CORRECTO — cada Text tiene su propio estilo
<View>
  <Text className="text-foreground">Este texto SÍ tendrá color</Text>
</View>
```

### 4. Espaciado

Unidad base: 4px. Padding de pantalla: `px-4`. Gap entre secciones: `gap-6`. Cards: `p-4`. Labels → inputs: `gap-1.5`.

### 5. Accesibilidad

| Requisito            | Detalle                                                      |
| :------------------- | :----------------------------------------------------------- |
| `accessibilityLabel` | En interactivos sin texto visible.                           |
| `accessibilityRole`  | `button`, `link`, `header`, `image`, `checkbox`, etc.        |
| Contraste mínimo     | 4.5:1 (texto normal), 3:1 (texto grande >18px bold o >24px). |
| Touch targets        | Mínimo 44x44 (iOS) / 48x48 (Android).                        |

### 6. Animaciones

Reanimated siempre. `withSpring()` para interacciones, `withTiming()` para transiciones. Animar para GUIAR, no para decorar.

| Animar ✅                             | NO Animar ❌                       |
| :------------------------------------ | :--------------------------------- |
| Entrada/salida de elementos en listas | Cambios de texto/números triviales |
| Feedback de press en botones          | Contenido que ya está en pantalla  |
| Transiciones entre pantallas          | Cada re-render de estado           |
| Apertura/cierre de modals/sheets      | Scroll normal (ya es nativo)       |
| Skeleton → contenido real             | Colores de fondo estáticos         |
| Expansión de acordeones               | Labels, badges estáticos           |
| Swipe actions                         | Íconos decorativos                 |

---

## Utilidad `cn()` para Merge de Clases

SIEMPRE usar `cn()` cuando se combinen clases NativeWind de forma condicional:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
<View className={cn(
  'rounded-xl p-4 border border-border',
  isActive && 'border-primary bg-primary/5',
  isDisabled && 'opacity-50',
)}>
```

---

## PortalHost para Overlays

RNR requiere `<PortalHost />` en el root layout para Dialog, DropdownMenu, Popover, Tooltip y ContextMenu:

```tsx
// app/_layout.tsx
import { PortalHost } from '@rn-primitives/portal';

export default function RootLayout() {
  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <Stack />
      <PortalHost />
    </ThemeProvider>
  );
}
```

> Sin `<PortalHost />`, los overlays no aparecen.

---

## Formato de Salida

Cuando se solicite trabajo visual, estructurar la respuesta así:

### 1. Análisis Visual

Principios de diseño aplicados, componentes RNR seleccionados, decisiones de jerarquía visual.

### 2. Código del Componente/Pantalla

TSX con NativeWind. Imports (RNR → Reanimated → utils). Cada archivo indica ruta.

### 3. Notas de Accesibilidad

Atributos aplicados y consideraciones para screen readers.

### 4. Notas de Plataforma

Diferencias iOS/Android con `Platform.select()`.

### 5. Tokens de Tema Requeridos

Cambios en `global.css` y `tailwind.config.js` si se necesitan tokens nuevos.

---

## References

| Archivo                                                        | Cuándo consultarlo                                                                                                       |
| :------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| [`references/design-system.md`](./references/design-system.md) | Al implementar tokens de color HSL, tipografía, espaciado, diferencias iOS/Android, accesibilidad o setup de PortalHost. |
| [`references/ui-patterns.md`](./references/ui-patterns.md)     | Al implementar animaciones, screen layouts base, formularios RNR, cards o skeleton loaders.                              |
| [`references/test-criteria.md`](./references/test-criteria.md) | Al validar que el código generado cumple con los principios de diseño y accesibilidad.                                   |
