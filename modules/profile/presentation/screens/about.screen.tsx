import { AppPressable } from '@/shared/presentation/components/ui/app-pressable';
import { useAppTheme } from '@/shared/presentation/hooks/use-app-theme';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  DollarSign,
  Globe,
  ShieldCheck,
  ShoppingBag,
  Wallet,
  Zap,
} from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Orb flotante ────────────────────────────────────────────────────────────

interface OrbProps {
  size: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  color: string;
  opacity?: number;
  delay: number;
  distance: number;
  duration: number;
}

function FloatingOrb({
  size,
  top,
  left,
  right,
  bottom,
  color,
  opacity = 0.18,
  delay,
  distance,
  duration,
}: OrbProps) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-distance, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    tx.value = withDelay(
      delay + 400,
      withRepeat(
        withSequence(
          withTiming(distance * 0.35, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 1.3, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      ),
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }, { translateX: tx.value }],
  }));

  return (
    <Animated.View
      pointerEvents='none'
      style={[
        styles.orb,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity, top, left, right, bottom },
        style,
      ]}
    />
  );
}

// ─── Feature card con entrada escalonada ─────────────────────────────────────

interface FeatureCardProps {
  Icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
  index: number;
}

function AnimatedFeatureCard({ Icon, iconColor, bgColor, title, description, colors, index }: FeatureCardProps) {
  // Entrada
  const opacity = useSharedValue(0);
  const entranceTy = useSharedValue(30);

  // Flotación continua de la card
  const floatY = useSharedValue(0);

  // Orb decorativo interior
  const orbY = useSharedValue(0);
  const orbX = useSharedValue(0);

  // Pulso del ícono
  const iconScale = useSharedValue(1);

  useEffect(() => {
    const entranceDelay = 350 + index * 90;
    const afterEntrance = entranceDelay + 560;
    const cardDuration = 2500 + index * 200;
    const orbDuration  = 1700 + index * 160;
    const iconDuration = 1500 + index * 90;

    // Entrada
    opacity.value = withDelay(entranceDelay, withTiming(1, { duration: 480 }));
    entranceTy.value = withDelay(
      entranceDelay,
      withTiming(0, { duration: 480, easing: Easing.out(Easing.quad) }),
    );

    // Flotación de la card (Y suave, fases distintas por índice)
    floatY.value = withDelay(
      afterEntrance + index * 80,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: cardDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: cardDuration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    // Orb decorativo — movimiento X+Y independiente
    orbY.value = withDelay(
      afterEntrance,
      withRepeat(
        withSequence(
          withTiming(-7, { duration: orbDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(2, { duration: orbDuration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: orbDuration * 0.6, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
    orbX.value = withDelay(
      afterEntrance + 250,
      withRepeat(
        withSequence(
          withTiming(5, { duration: orbDuration * 1.3, easing: Easing.inOut(Easing.ease) }),
          withTiming(-3, { duration: orbDuration * 1.1, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: orbDuration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );

    // Pulso del ícono
    iconScale.value = withDelay(
      afterEntrance + 200,
      withRepeat(
        withSequence(
          withTiming(1.14, { duration: iconDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1.0, { duration: iconDuration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: entranceTy.value + floatY.value }],
  }));

  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: orbY.value }, { translateX: orbX.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const orbSize = 16 + (index % 3) * 7;

  return (
    <Animated.View style={[styles.featureCardWrapper, cardStyle]}>
      <View style={[styles.featureCard, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Orb flotante decorativo */}
        <Animated.View
          pointerEvents='none'
          style={[
            styles.cardOrb,
            { width: orbSize, height: orbSize, borderRadius: orbSize / 2, backgroundColor: iconColor },
            orbStyle,
          ]}
        />
        {/* Ícono con pulso */}
        <Animated.View style={[styles.featureIconWrap, { backgroundColor: bgColor }, iconStyle]}>
          <Icon size={20} color={iconColor} pointerEvents='none' />
        </Animated.View>
        <Text style={[styles.featureTitle, { color: colors.textOnSurface }]}>{title}</Text>
        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{description}</Text>
      </View>
    </Animated.View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function AboutScreen() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Scroll handler para parallax
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (e) => {
      scrollY.value = e.contentOffset.y;
    },
  });

  // Parallax + fade del hero al bajar
  const heroContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scrollY.value * 0.3 }],
    opacity: interpolate(scrollY.value, [0, 200], [1, 0.15], Extrapolation.CLAMP),
  }));

  // Pulso continuo del logo
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, []);
  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  // Entrada de la descripción
  const descOp = useSharedValue(0);
  const descTy = useSharedValue(20);
  useEffect(() => {
    descOp.value = withDelay(120, withTiming(1, { duration: 600 }));
    descTy.value = withDelay(120, withTiming(0, { duration: 600 }));
  }, []);
  const descStyle = useAnimatedStyle(() => ({
    opacity: descOp.value,
    transform: [{ translateY: descTy.value }],
  }));

  // Entrada del título de sección
  const titleOp = useSharedValue(0);
  useEffect(() => {
    titleOp.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []);
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOp.value }));

  const features = [
    {
      Icon: ShoppingBag,
      iconColor: colors.primary,
      bgColor: colors.primaryLight,
      title: 'Listas inteligentes',
      description: 'Crea listas con precios en Bs y ve el total en USD al instante',
    },
    {
      Icon: DollarSign,
      iconColor: colors.warning,
      bgColor: colors.warningLight,
      title: 'Tasa en tiempo real',
      description: 'Conversión automática con la tasa del día actualizada',
    },
    {
      Icon: Wallet,
      iconColor: colors.danger,
      bgColor: colors.dangerLight,
      title: 'Control de deudas',
      description: 'Organiza lo que debes y lo que te deben con recordatorios',
    },
    {
      Icon: Zap,
      iconColor: colors.primary,
      bgColor: colors.primaryLight,
      title: 'Modo rápido',
      description: 'Usa la app sin cuenta. Regístrate cuando quieras guardar',
    },
    {
      Icon: Globe,
      iconColor: colors.warning,
      bgColor: colors.warningLight,
      title: 'Multi-mercado',
      description: 'Pensada para Venezuela, Argentina, Chile y Perú',
    },
    {
      Icon: ShieldCheck,
      iconColor: colors.success,
      bgColor: colors.successLight,
      title: 'Datos seguros',
      description: 'Autenticación con Firebase y datos encriptados en tránsito',
    },
  ];

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 },
      ]}
      showsVerticalScrollIndicator={false}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <AppPressable
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: 'rgba(255,255,255,0.12)' }]}
        >
          <ArrowLeft pointerEvents='none' size={20} color={colors.text} />
        </AppPressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Acerca de</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Hero con orbs flotantes */}
      <View style={styles.heroWrapper}>
        {/* Orbs flotantes — diferentes tamaños, posiciones y ritmos */}
        <FloatingOrb size={95}  top={-20}   left={-28}  color={colors.primary} opacity={0.14} delay={0}    distance={16} duration={3700} />
        <FloatingOrb size={52}  top={15}    right={-12} color={colors.warning} opacity={0.20} delay={700}  distance={13} duration={2900} />
        <FloatingOrb size={36}  top={105}   right={22}  color={colors.success} opacity={0.18} delay={350}  distance={10} duration={2400} />
        <FloatingOrb size={68}  bottom={-8} left={18}   color={colors.danger}  opacity={0.12} delay={1100} distance={18} duration={4200} />
        <FloatingOrb size={28}  top={65}    left={80}   color={colors.primary} opacity={0.22} delay={1500} distance={8}  duration={3100} />
        <FloatingOrb size={44}  bottom={22} right={52}  color={colors.warning} opacity={0.14} delay={250}  distance={12} duration={2700} />
        <FloatingOrb size={20}  top={40}    left={140}  color={colors.success} opacity={0.25} delay={900}  distance={6}  duration={2100} />

        {/* Contenido del hero con parallax */}
        <Animated.View style={[styles.heroContent, heroContentStyle]}>
          <Animated.View style={logoStyle}>
            <View style={[styles.heroLogo, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.heroLogoText, { color: colors.primary }]}>K</Text>
            </View>
          </Animated.View>
          <Text style={[styles.heroName, { color: colors.text }]}>Kashy</Text>
          <Text style={[styles.heroTagline, { color: colors.text }]}>
            Tu aliado financiero del día a día
          </Text>
        </Animated.View>
      </View>

      {/* Descripción */}
      <Animated.View style={descStyle}>
        <View style={[styles.descCard, { backgroundColor: colors.backgroundSecondary }]}>
          <Text style={[styles.descText, { color: colors.textOnSurface }]}>
            Kashy nació para resolver un problema real: llevar el control de tus
            compras en un país donde los precios cambian constantemente. Convierte
            entre moneda local y dólares al instante, organiza tus listas de
            supermercado y mantén tus deudas en orden — todo desde un solo lugar.
          </Text>
        </View>
      </Animated.View>

      {/* Grid de features */}
      <View style={styles.section}>
        <Animated.Text style={[styles.sectionTitle, { color: colors.textTertiary }, titleStyle]}>
          LO QUE PUEDES HACER
        </Animated.Text>
        <View style={styles.featuresGrid}>
          {features.map((f, i) => (
            <AnimatedFeatureCard key={f.title} index={i} colors={colors} {...f} />
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerVersion, { color: colors.textTertiary }]}>
          Versión 1.0.0
        </Text>
        <Text style={[styles.footerCopy, { color: colors.textTertiary }]}>
          Hecho con cariño para Latinoamérica 💚
        </Text>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 24 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  // Hero
  heroWrapper: {
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderRadius: 28,
  },
  orb: { position: 'absolute' },
  heroContent: { alignItems: 'center', gap: 8, paddingVertical: 24, paddingHorizontal: 20 },
  heroLogo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroLogoText: { fontSize: 42, fontWeight: '800' },
  heroName: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  heroTagline: { fontSize: 15, fontWeight: '400', textAlign: 'center', opacity: 0.72 },

  // Description
  descCard: { borderRadius: 16, padding: 18 },
  descText: { fontSize: 15, fontWeight: '400', lineHeight: 23 },

  // Section
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5, paddingHorizontal: 4 },

  // Feature grid
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureCardWrapper: { width: '48%', flexGrow: 1 },
  featureCard: { borderRadius: 16, padding: 14, gap: 8, flex: 1, overflow: 'hidden' },
  cardOrb: { position: 'absolute', top: 8, right: 10, opacity: 0.18 },
  featureIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  featureTitle: { fontSize: 14, fontWeight: '700' },
  featureDesc: { fontSize: 12, fontWeight: '400', lineHeight: 17 },

  // Footer
  footer: { alignItems: 'center', gap: 4, paddingTop: 8 },
  footerVersion: { fontSize: 13, fontWeight: '600' },
  footerCopy: { fontSize: 12 },
});
