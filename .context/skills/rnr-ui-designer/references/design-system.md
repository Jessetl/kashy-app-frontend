# Design System — Referencia

> Guía detallada del sistema de diseño: colores HSL, tipografía, espaciado, diferencias iOS/Android y accesibilidad.

---

## Sistema de Color con CSS Variables HSL

RNR usa CSS variables con valores HSL definidas en `global.css` y mapeadas en `tailwind.config.js`. Todos los colores se referencian a través de tokens semánticos, NUNCA con colores directos.

### Tokens semánticos (global.css)

```css
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    /* ... valores invertidos para dark mode */
  }
}
```

### Mapeo en tailwind.config.js

```javascript
colors: {
  background: 'hsl(var(--background))',
  foreground: 'hsl(var(--foreground))',
  primary: {
    DEFAULT: 'hsl(var(--primary))',
    foreground: 'hsl(var(--primary-foreground))',
  },
  secondary: {
    DEFAULT: 'hsl(var(--secondary))',
    foreground: 'hsl(var(--secondary-foreground))',
  },
  muted: {
    DEFAULT: 'hsl(var(--muted))',
    foreground: 'hsl(var(--muted-foreground))',
  },
  accent: {
    DEFAULT: 'hsl(var(--accent))',
    foreground: 'hsl(var(--accent-foreground))',
  },
  destructive: {
    DEFAULT: 'hsl(var(--destructive))',
    foreground: 'hsl(var(--destructive-foreground))',
  },
  border: 'hsl(var(--border))',
  input: 'hsl(var(--input))',
  ring: 'hsl(var(--ring))',
}
```

### Reglas de color

- NUNCA colores hardcodeados (`bg-red-500`, `text-blue-600`). SIEMPRE tokens semánticos (`bg-primary`, `text-destructive`).
- El único lugar donde se definen colores concretos es `global.css`.
- Para colores custom del negocio (éxito, warning), crear nuevos tokens en `global.css` y registrarlos en `tailwind.config.js`.
- Para opacidad, usar el modificador: `bg-primary/80` (80% de opacidad del primary).

---

## Tipografía

React Native **NO tiene herencia de estilos en cascada**. Cada `<Text>` debe tener sus clases aplicadas directamente.

### Escala tipográfica

| Uso                | Clase NativeWind                | Tamaño aprox. |
| :----------------- | :------------------------------ | :------------ |
| Hero / Display     | `text-4xl font-bold`            | 36px          |
| Título de pantalla | `text-2xl font-bold`            | 24px          |
| Título de sección  | `text-xl font-semibold`         | 20px          |
| Subtítulo          | `text-lg font-medium`           | 18px          |
| Body               | `text-base`                     | 16px          |
| Caption / Metadata | `text-sm text-muted-foreground` | 14px          |
| Micro / Labels     | `text-xs text-muted-foreground` | 12px          |

### Implementación de jerarquía

```tsx
// ✅ Cada Text con su propio estilo
<Text className="text-3xl font-bold text-foreground">Título Principal</Text>
<Text className="text-lg font-semibold text-foreground">Subtítulo</Text>
<Text className="text-base text-foreground">Contenido del body</Text>
<Text className="text-sm text-muted-foreground">Hace 5 minutos</Text>
```

```tsx
// ❌ INCORRECTO — React Native no hereda estilos de texto
<View className="text-foreground">
  <Text>Este texto NO tendrá color</Text>
</View>

// ✅ CORRECTO
<View>
  <Text className="text-foreground">Este texto SÍ tendrá color</Text>
</View>
```

---

## Espaciado y Layout

Escala de Tailwind. Unidad base: 4px.

### Reglas de espaciado

| Elemento                      | Clase             | Valor   |
| :---------------------------- | :---------------- | :------ |
| Padding lateral de pantalla   | `px-4`            | 16px    |
| Padding superior (con header) | `pt-6`            | 24px    |
| Padding superior (sin header) | `pt-12`           | 48px    |
| Gap entre secciones           | `gap-6` o `gap-8` | 24-32px |
| Gap entre items de lista      | `gap-3` o `gap-4` | 12-16px |
| Padding interno de cards      | `p-4` o `p-6`     | 16-24px |
| Margen label → input          | `gap-1.5`         | 6px     |

### Screen Layout Base

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export function ScreenLayout({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView className='flex-1 bg-background' edges={['top']}>
      <ScrollView
        className='flex-1'
        contentContainerClassName='px-4 pt-6 pb-8 gap-6'
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}
```

> SIEMPRE usar `SafeAreaView` para respetar notch, island y barras de navegación.

---

## Diferencias iOS vs Android

| Aspecto          | iOS                                              | Android                                      |
| :--------------- | :----------------------------------------------- | :------------------------------------------- |
| Shadows          | `shadow-sm`, `shadow-md` (box-shadow nativo)     | `elevation-2`, `elevation-4` (elevation API) |
| Haptics          | `Haptics.impactAsync(ImpactFeedbackStyle.Light)` | `Haptics.impactAsync()` (más limitado)       |
| Status bar       | Light/dark content automático                    | Necesita `StatusBar` explícito               |
| Bottom safe area | Home indicator (34px)                            | Navigation bar (variable)                    |
| Scroll behavior  | Bounce natural                                   | OverScroll glow                              |
| Fonts            | SF Pro (sistema)                                 | Roboto (sistema)                             |

### Sombras cross-platform

```tsx
import { Platform } from 'react-native';

const cardShadow = Platform.select({
  ios: 'shadow-sm shadow-black/5',
  android: 'elevation-2',
});

<Card className={`bg-card ${cardShadow}`}>
```

> Diseñar componentes que se sientan nativos en AMBAS plataformas. `Platform.select()` solo para ajustes visuales específicos.

---

## Accesibilidad

Cada componente DEBE ser accesible. RNR ya incluye accesibilidad vía `@rn-primitives`, pero al componer o personalizar verificar:

### Checklist obligatorio

| Requisito            | Detalle                                                         |
| :------------------- | :-------------------------------------------------------------- |
| `accessibilityLabel` | En todo interactivo sin texto visible.                          |
| `accessibilityRole`  | `button`, `link`, `header`, `image`, `checkbox`, etc.           |
| `accessibilityState` | Para `disabled`, `checked`, `selected`, `expanded`.             |
| `accessibilityHint`  | Para acciones no obvias.                                        |
| Contraste            | 4.5:1 texto normal, 3:1 texto grande.                           |
| Touch targets        | ≥44pt iOS, ≥48dp Android.                                       |
| Orden de foco        | Sigue la jerarquía visual: arriba → abajo, izquierda → derecha. |

### Ejemplo

```tsx
<Button
  className='h-12 px-6'
  accessibilityLabel='Agregar producto al carrito'
  accessibilityRole='button'
  accessibilityHint='Agrega este producto a tu carrito de compras'
>
  <Text className='text-primary-foreground font-semibold'>
    Agregar al carrito
  </Text>
</Button>
```
