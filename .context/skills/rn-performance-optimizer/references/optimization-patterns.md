# Optimization Patterns — Código de Referencia

> Patterns detallados con ejemplos ❌/✅ para cada área de optimización.

---

## Listas — FlashList

```typescript
// ❌ FlatList sin optimizaciones
const OrderList: React.FC<{ data: Order[] }> = ({ data }) => (
  <FlatList
    data={data}
    renderItem={({ item }) => (
      <View style={{ padding: 16 }}>
        <Text>{item.title}</Text>
        <Image source={{ uri: item.imageUrl }} />
      </View>
    )}
  />
);

// ✅ FlashList con todas las optimizaciones
const OrderItem = React.memo<{ item: Order; onPress: (id: string) => void }>(
  ({ item, onPress }) => (
    <Pressable onPress={() => onPress(item.id)} style={styles.item}>
      <Text>{item.title}</Text>
      <Image
        source={item.imageUrl}
        style={styles.image}
        recyclingKey={item.id}
        placeholder={{ blurhash: item.blurhash }}
        contentFit="cover"
        transition={200}
      />
    </Pressable>
  ),
);

const OrderList: React.FC<{ data: Order[] }> = ({ data }) => {
  const handlePress = useCallback((id: string) => {
    router.push(`/orders/${id}`);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Order }) => <OrderItem item={item} onPress={handlePress} />,
    [handlePress],
  );

  const keyExtractor = useCallback((item: Order) => item.id, []);

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={80}
    />
  );
};
```

**Checklist de listas:**

- FlashList en vez de FlatList.
- `estimatedItemSize` siempre (medir con layout inspector).
- Item envuelto en `React.memo`.
- `renderItem` con `useCallback`.
- `keyExtractor` estable con `useCallback`.
- Sin funciones inline ni objetos inline dentro del item.
- Imágenes con `expo-image` + `recyclingKey`.

---

## Listas — Paginación Infinita

```typescript
const OrderListScreen: React.FC = () => {
  const orders = useOrderStore((s) => s.orders);
  const meta = useOrderStore((s) => s.meta);
  const [loading, setLoading] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    setLoading(true);
    try {
      await searchOrdersUseCase.execute({ page, limit: 20, filters: {} });
    } catch {
      showToast('Error al cargar');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadPage(1); }, [loadPage]);

  const loadMore = useCallback(() => {
    if (meta && meta.page < meta.total_pages && !loading) {
      loadPage(meta.page + 1);
    }
  }, [meta, loading, loadPage]);

  return (
    <FlashList
      data={orders}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={80}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <LoadingSpinner /> : null}
    />
  );
};
```

---

## Memoización — Cuándo Sí y Cuándo No

### React.memo

```typescript
// ❌ memo inútil — props inestables (objeto nuevo cada render)
const Parent = () => {
  const config = { theme: 'dark', size: 'lg' };
  return <MemoChild config={config} />;
};
const MemoChild = React.memo(({ config }) => <Text>{config.theme}</Text>);

// ✅ memo útil — props estables
const Parent = () => {
  const config = useMemo(() => ({ theme: 'dark', size: 'lg' }), []);
  return <MemoChild config={config} />;
};
const MemoChild = React.memo(({ config }) => <Text>{config.theme}</Text>);
```

**Regla:** si el hijo no es `React.memo`, `useMemo`/`useCallback` en las props no sirve.

### useMemo

```typescript
// ❌ useMemo trivial — no lo necesita
const name = useMemo(() => `${first} ${last}`, [first, last]);

// ✅ useMemo para cálculo costoso
const sortedItems = useMemo(
  () => items.sort((a, b) => b.amount - a.amount).slice(0, 10),
  [items],
);

// ✅ useMemo para filtrado pesado
const filtered = useMemo(
  () => items.filter((i) => i.category === selected && i.amount > threshold),
  [items, selected, threshold],
);
```

### useCallback

```typescript
// ❌ useCallback inútil — el hijo no es memo
const Parent = () => {
  const handlePress = useCallback(() => doSomething(), []);
  return <Child onPress={handlePress} />; // Child no es memo → no sirve
};

// ✅ useCallback útil — el hijo es memo
const MemoChild = React.memo<{ onPress: () => void }>(({ onPress }) => (
  <Pressable onPress={onPress}><Text>Tap</Text></Pressable>
));

const Parent = () => {
  const handlePress = useCallback(() => doSomething(), []);
  return <MemoChild onPress={handlePress} />;
};
```

---

## Imágenes — expo-image

```typescript
// ❌ Image de RN sin optimizaciones
<Image source={{ uri: url }} style={{ flex: 1 }} />

// ✅ expo-image con todas las optimizaciones
import { Image } from 'expo-image';

<Image
  source={url}
  style={{ width: 120, height: 120 }}
  recyclingKey={item.id}
  placeholder={{ blurhash: 'LEHV6nWB2yk8pyoJadR*.7kCMdnj' }}
  contentFit="cover"
  transition={200}
/>
```

**Checklist de imágenes:**

- `expo-image` siempre, nunca `Image` de RN.
- Dimensiones explícitas (`width`/`height`), nunca solo `flex`.
- `recyclingKey` en listas (evita mostrar imagen anterior al reciclar celda).
- `placeholder` con blurhash para loading suave.
- `contentFit` explícito.
- `transition` para fade-in al cargar.

---

## Startup — Optimización de Arranque

```typescript
// ❌ Secuencial — cada await espera al anterior
const init = async () => {
  await loadFonts();
  await checkAuth();
  await fetchConfig();
  await SplashScreen.hideAsync();
};

// ✅ Paralelo con splash controlado
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const init = async () => {
  const results = await Promise.allSettled([
    loadFonts(),
    checkAuth(),
    fetchConfig(),
  ]);

  // Verificar resultados individualmente
  const [fonts, auth, config] = results;

  if (fonts.status === 'rejected') {
    logger.warn('Fonts failed, using system fonts');
  }

  await SplashScreen.hideAsync();
};
```

### Lazy Loading de Screens

```typescript
// ❌ Import directo — se evalúa al arrancar
import { HeavyScreen } from './screens/HeavyScreen';

// ✅ Lazy — se evalúa cuando se navega
import { lazy, Suspense } from 'react';

const HeavyScreen = lazy(() => import('./screens/HeavyScreen'));

const Screen = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <HeavyScreen />
  </Suspense>
);
```

### Imports directos vs barrels

```typescript
// ❌ Barrel — evalúa TODOS los exports
import { Button } from '@/shared-kernel/components';

// ✅ Import directo — solo evalúa lo necesario
import { Button } from '@/shared-kernel/components/Button';
```

---

## Animaciones — Reanimated

```typescript
// ❌ Animated de RN — corre en JS thread
const opacity = useRef(new Animated.Value(0)).current;
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true,
}).start();

// ✅ Reanimated — corre en UI thread (worklet)
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';

const opacity = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: withTiming(opacity.value, { duration: 300 }),
}));

// Solo animar transform y opacity
const slideStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: withTiming(position.value) }],
  opacity: withTiming(visible.value ? 1 : 0),
}));
```

**Reglas de animación:**

- Reanimated siempre, nunca `Animated` de RN para interacciones.
- Solo animar `transform` y `opacity` (no layout props como width/height/margin).
- Nunca `useState` para valores animados.
- `useSharedValue` + `useAnimatedStyle` = worklet en UI thread.

---

## Re-renders — Zustand Selectors

```typescript
// ❌ Sin selector — re-renderiza cuando CUALQUIER cosa del store cambia
const Component = () => {
  const store = useOrderStore();
  return <Text>{store.orders.length}</Text>;
};

// ✅ Con selector — re-renderiza solo cuando orders cambia
const Component = () => {
  const orders = useOrderStore((s) => s.orders);
  return <Text>{orders.length}</Text>;
};

// ✅ Selector derivado
const Component = () => {
  const count = useOrderStore((s) => s.orders.length);
  return <Badge count={count} />;
};
```

---

## Resiliencia — Error Boundaries

```typescript
// Error Boundary por sección
import { ErrorBoundary } from 'react-error-boundary';

const FallbackComponent = ({ error, resetErrorBoundary }) => (
  <View style={styles.errorContainer}>
    <Text>Algo salió mal</Text>
    <Button title="Reintentar" onPress={resetErrorBoundary} />
  </View>
);

// ✅ Envolver por sección, no solo en la raíz
const DashboardScreen = () => (
  <ScrollView>
    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <BalanceSummary />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <UpcomingExpenses />
    </ErrorBoundary>

    <ErrorBoundary FallbackComponent={FallbackComponent}>
      <RecentActivity />
    </ErrorBoundary>
  </ScrollView>
);
```

### Parseo defensivo

```typescript
// ❌ Sin protección — JSON corrupto crashea la app
const data = JSON.parse(await AsyncStorage.getItem('cached_data'));

// ✅ Parseo defensivo con fallback
const loadCachedData = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    await AsyncStorage.removeItem(key); // Limpiar dato corrupto
    return fallback;
  }
};
```
