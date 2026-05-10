# Platform Code — Código Específico por Plataforma

> Patterns detallados para implementar diferencias entre iOS y Android.

---

## Mecanismo 1: Platform.select()

Para valores simples: estilos, constantes, configs de 1-5 líneas.

```typescript
import { Platform, StyleSheet } from 'react-native';

// ✅ Sombras (iOS vs Android)
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});

// ✅ Constantes por plataforma
const HIT_SLOP = Platform.select({
  ios: { top: 8, bottom: 8, left: 8, right: 8 },
  android: { top: 12, bottom: 12, left: 12, right: 12 },
});

// ✅ Font family
const FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'Roboto',
});
```

**Cuándo usar:** la diferencia es un valor (número, string, objeto de estilo). Sin lógica condicional.

---

## Mecanismo 2: Platform.OS con condicionales

Para ramas de lógica donde el componente comparte >70% del código.

```typescript
import { Platform } from 'react-native';

// ✅ Permisos diferentes por plataforma
const requestNotificationPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: { allowAlert: true, allowBadge: true, allowSound: true },
    });
    return status === 'granted';
  }

  // Android 13+ requiere POST_NOTIFICATIONS
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }

  return true; // Android <13 no requiere permiso explícito
};

// ✅ Comportamiento de StatusBar
const setupStatusBar = () => {
  if (Platform.OS === 'android') {
    StatusBar.setTranslucent(true);
    StatusBar.setBackgroundColor('transparent');
  }
  // iOS maneja StatusBar automáticamente
};
```

**Cuándo usar:** misma función/componente pero con 1-3 ramas condicionales. El 70%+ del código es compartido.

---

## Mecanismo 3: Archivos .ios.tsx / .android.tsx

Para implementaciones fundamentalmente diferentes (>30% del código difiere).

### Estructura de archivos

```
components/
├── MapView.types.ts        → Interface compartida
├── MapView.ios.tsx          → Implementación iOS
└── MapView.android.tsx      → Implementación Android
```

### Types compartidos

```typescript
// MapView.types.ts
export interface MapViewProps {
  latitude: number;
  longitude: number;
  zoom?: number;
  onMarkerPress?: (id: string) => void;
}
```

### Implementación iOS

```typescript
// MapView.ios.tsx
import { MapViewProps } from './MapView.types';
import MapKit from 'react-native-maps';

export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  zoom = 14,
  onMarkerPress,
}) => (
  <MapKit.MapView
    region={{
      latitude,
      longitude,
      latitudeDelta: 0.01 * (20 - zoom),
      longitudeDelta: 0.01 * (20 - zoom),
    }}
    showsUserLocation
    onMarkerPress={(e) => onMarkerPress?.(e.nativeEvent.id)}
  />
);
```

### Implementación Android

```typescript
// MapView.android.tsx
import { MapViewProps } from './MapView.types';
import { MapView as GoogleMapView, Marker } from 'react-native-maps';

export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  zoom = 14,
  onMarkerPress,
}) => (
  <GoogleMapView
    initialCamera={{
      center: { latitude, longitude },
      zoom,
      heading: 0,
      pitch: 0,
      altitude: 0,
    }}
    showsMyLocationButton
    onMarkerPress={(e) => onMarkerPress?.(e.nativeEvent.id)}
  />
);
```

### Import (sin extensión de plataforma)

```typescript
// El bundler resuelve automáticamente .ios o .android
import { MapView } from '@/shared-kernel/components/MapView';

// React Native/Metro elige automáticamente:
// → MapView.ios.tsx en iOS
// → MapView.android.tsx en Android
```

---

## Reglas de Archivos por Plataforma

| Regla                    | Detalle                                                                                              |
| :----------------------- | :--------------------------------------------------------------------------------------------------- |
| **Props idénticas**      | Ambos archivos deben exportar el mismo componente con las mismas props. Usar `.types.ts` compartido. |
| **Nunca solo uno**       | Nunca `.ios.tsx` sin `.android.tsx` (o un `.tsx` base como fallback).                                |
| **Import sin extensión** | Importar `./MapView`, no `./MapView.ios`. Metro resuelve automáticamente.                            |
| **Nombrar igual**        | El export debe tener el mismo nombre en ambos archivos.                                              |
| **Tests**                | Testear ambas implementaciones por separado. Mock de Platform.OS en tests.                           |

---

## Tabla de Decisión Rápida

| Escenario          | Mecanismo           | Justificación                              |
| :----------------- | :------------------ | :----------------------------------------- |
| Sombras de cards   | `Platform.select()` | Solo valores de estilo.                    |
| Hit slop diferente | `Platform.select()` | Un número por plataforma.                  |
| Font family        | `Platform.select()` | Un string por plataforma.                  |
| Pedir permisos     | `Platform.OS`       | Misma función, 2-3 ramas.                  |
| StatusBar setup    | `Platform.OS`       | Config de 3 líneas por plataforma.         |
| Mapa nativo        | `.ios/.android`     | Implementaciones completamente diferentes. |
| Video player       | `.ios/.android`     | APIs nativas distintas.                    |
| Cámara custom      | `.ios/.android`     | >30% del código difiere.                   |
| Notificación local | `Platform.OS`       | Misma API, config ligeramente diferente.   |
| DatePicker         | `.ios/.android`     | UX fundamentalmente diferente.             |

---

## Ubicación de Archivos por Plataforma

| Tipo                             | Ubicación                            |
| :------------------------------- | :----------------------------------- |
| Componentes UI platform-specific | `{dominio}/presentation/components/` |
| Helpers/utils platform-specific  | `shared-kernel/utils/`               |
| Constantes platform-specific     | `shared-kernel/constants/`           |
| Adapters platform-specific       | `{dominio}/infrastructure/adapters/` |

> El skill de arquitectura decide la ubicación. El skill de performance decide qué mecanismo de plataforma usar.
