# UI Patterns — Referencia

> Patrones de animación, layouts de pantalla y componentes comunes con código completo.

---

## Microinteracciones y Animaciones

Usar `react-native-reanimated` para todas las animaciones. `withSpring()` para interacciones, `withTiming()` para transiciones.

### Entrada de elementos (Fade + Slide)

```tsx
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';

{
  items.map((item, index) => (
    <Animated.View
      key={item.id}
      entering={FadeInDown.delay(index * 100).springify()}
      layout={Layout.springify()}
    >
      <Card>...</Card>
    </Animated.View>
  ));
}
```

### Botón con feedback háptico

```tsx
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const AnimatedButton: React.FC<{
  onPress: () => void;
  children: React.ReactNode;
}> = ({ onPress, children }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Button
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        {children}
      </Button>
    </Animated.View>
  );
};
```

### Skeleton loader (RNR)

```tsx
import { Skeleton } from '@/components/ui/skeleton';

const CardSkeleton: React.FC = () => (
  <Card className='p-4 gap-3'>
    <Skeleton className='h-40 w-full rounded-xl' />
    <Skeleton className='h-5 w-3/4 rounded-md' />
    <Skeleton className='h-4 w-1/2 rounded-md' />
  </Card>
);
```

### Transiciones de pantalla (Expo Router)

```tsx
// app/_layout.tsx
<Stack
  screenOptions={{
    animation: 'slide_from_right',
    headerShown: false,
  }}
/>
```

---

## Patrones de Pantalla Comunes

### Screen Layout Base

```tsx
const ScreenBase: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <SafeAreaView className='flex-1 bg-background'>
    <ScrollView
      className='flex-1'
      contentContainerClassName='px-4 pt-6 pb-12 gap-6'
      showsVerticalScrollIndicator={false}
    >
      <Text className='text-2xl font-bold text-foreground'>{title}</Text>
      {children}
    </ScrollView>
  </SafeAreaView>
);
```

### Formulario con RNR

```tsx
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

const LoginForm: React.FC = () => (
  <View className='gap-6'>
    <View className='gap-1.5'>
      <Label nativeID='email'>Correo electrónico</Label>
      <Input
        aria-labelledby='email'
        placeholder='tu@email.com'
        keyboardType='email-address'
        autoCapitalize='none'
        className='bg-background'
      />
    </View>

    <View className='gap-1.5'>
      <Label nativeID='password'>Contraseña</Label>
      <Input
        aria-labelledby='password'
        placeholder='••••••••'
        secureTextEntry
        className='bg-background'
      />
    </View>

    <Button className='w-full'>
      <Text className='text-primary-foreground font-semibold'>
        Iniciar sesión
      </Text>
    </Button>
  </View>
);
```

### Card genérica

```tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { Image } from 'expo-image';

const ItemCard: React.FC<{ item: ItemData }> = ({ item }) => (
  <Card className='overflow-hidden'>
    <Image
      source={item.imageUrl}
      style={{ width: '100%', height: 192 }}
      contentFit='cover'
      placeholder={{ blurhash: item.blurhash }}
      transition={200}
      accessibilityLabel={item.title}
    />
    <CardHeader className='pb-2'>
      <View className='flex-row items-center justify-between'>
        <Text className='text-lg font-semibold text-card-foreground'>
          {item.title}
        </Text>
        <Badge variant={item.isAvailable ? 'default' : 'destructive'}>
          <Text>{item.isAvailable ? 'Disponible' : 'No disponible'}</Text>
        </Badge>
      </View>
    </CardHeader>
    <CardContent>
      <Text className='text-sm text-muted-foreground' numberOfLines={2}>
        {item.description}
      </Text>
    </CardContent>
    <CardFooter className='flex-row items-center justify-between'>
      <Text className='text-xl font-bold text-foreground'>${item.price}</Text>
      <Button size='sm'>
        <Text className='text-primary-foreground text-sm'>Agregar</Text>
      </Button>
    </CardFooter>
  </Card>
);
```

### Empty State

```tsx
const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; onPress: () => void };
}> = ({ icon, title, description, action }) => (
  <View className='flex-1 items-center justify-center px-8 gap-4'>
    <View className='w-16 h-16 rounded-full bg-muted items-center justify-center'>
      {icon}
    </View>
    <Text className='text-xl font-semibold text-foreground text-center'>
      {title}
    </Text>
    <Text className='text-sm text-muted-foreground text-center'>
      {description}
    </Text>
    {action && (
      <Button onPress={action.onPress} className='mt-2'>
        <Text className='text-primary-foreground font-semibold'>
          {action.label}
        </Text>
      </Button>
    )}
  </View>
);
```

### Floating Action Button

```tsx
const FloatingButton: React.FC<{
  onPress: () => void;
  icon: React.ReactNode;
}> = ({ onPress, icon }) => (
  <Pressable
    onPress={onPress}
    className='absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary items-center justify-center shadow-lg'
    accessibilityLabel='Acción principal'
    accessibilityRole='button'
  >
    {icon}
  </Pressable>
);
```

---

## Patrones de Estado de UI

### Loading → Content → Error

```tsx
const DataScreen: React.FC = () => {
  const { data, loading, error } = useData();

  if (loading) return <CardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data || data.length === 0) return <EmptyState title='Sin datos' />;

  return (
    <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
  );
};
```

### Pull to Refresh

```tsx
<ScrollView
  refreshControl={
    <RefreshControl
      refreshing={refreshing}
      onRefresh={handleRefresh}
      tintColor='hsl(var(--primary))'
    />
  }
>
  {children}
</ScrollView>
```
