# Test Criteria — Criterios de Aceptación (UI)

> Test cases para validar que el código generado cumple con los principios de diseño y accesibilidad.
> Usar como checklist al revisar componentes y pantallas.

---

## TC-1: Uso Correcto de Componentes RNR

**Prompt:** "Crea una pantalla de perfil con avatar, nombre, email, y lista de opciones tipo settings."

**Criterios:**

- `Avatar` de RNR (no `<Image>` con borderRadius).
- `Card` para secciones.
- `Separator` entre opciones.
- `Text` de RNR.
- Imports de `@/components/ui/`.
- No recrea lo que RNR ya ofrece.

---

## TC-2: Tokens de Color Semánticos

**Prompt:** "Crea una card de alerta con versiones de éxito, error y advertencia."

**Criterios:**

- SOLO tokens semánticos, NUNCA colores directos (`bg-red-500` ❌).
- Tokens nuevos definidos en `global.css` con HSL.
- Ambas variantes light/dark definidas.
- Contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande).

---

## TC-3: Accesibilidad Completa

**Prompt:** "Crea un formulario con campos de texto, selector y botón de envío."

**Criterios:**

- `<Label>` con `nativeID` + `aria-labelledby` en cada input.
- `accessibilityLabel` en botones e íconos.
- Touch targets ≥44pt (iOS) / ≥48dp (Android).
- Errores con `accessibilityLiveRegion`.
- Orden de foco lógico (arriba → abajo).
- Contraste verificado en ambos temas.

---

## TC-4: Compatibilidad iOS y Android

**Prompt:** "Crea una card con sombra y efecto de press."

**Criterios:**

- Sombras con `Platform.select()` (shadow iOS / elevation Android).
- SafeArea respetada.
- Touch targets por plataforma.
- Fuentes del sistema respetadas.
- Probado visualmente en ambas plataformas.

---

## TC-5: Microinteracciones con Reanimated

**Prompt:** "Agrega animaciones de entrada a una lista y feedback háptico al botón de eliminar."

**Criterios verificables:**

- `react-native-reanimated` (no `Animated` de RN).
- `FadeInDown` con delay escalonado.
- `withSpring` en scale para el botón.
- `expo-haptics` sincronizado con la acción.
- Animaciones corren en hilo nativo (worklets).

**Criterios subjetivos:**

- Suaves y naturales, no robóticas.
- Háptico sincronizado con la acción visual.

---

## TC-6: Dark Mode Correcto

**Prompt:** "Crea una pantalla con switch para cambiar entre light y dark mode."

**Criterios:**

- `Switch` de RNR.
- Cambio de tema vía CSS variables (no lógica condicional `isDark ?`).
- Bordes, fondos y textos correctos en ambos modos.
- Status bar actualizada según tema.
- No hay colores hardcodeados que rompan en un modo.

---

## TC-7: Herencia de Estilos (Error Común)

**Prompt:** "Crea un componente de lista con items que tengan título y descripción."

**Criterios:**

- Cada `<Text>` con su PROPIA clase de color.
- Ningún `<View>` con `text-*` esperando herencia.
- Texto visible y con color correcto en ambos temas.
- Verificado: remover la clase de color de un Text → el texto pierde su color (confirma que no hereda).

---

## TC-8: Pantalla Completa

**Prompt:** "Dashboard con saludo, card de resumen, lista de actividad con badges, y botón flotante."

**Criterios verificables:**

- `Card`, `Badge`, `Button`, `Text`, `Separator` de RNR.
- `SafeAreaView` + `ScrollView`.
- 3+ niveles tipográficos.
- Botón flotante con safe area.
- Tokens semánticos en todos los colores.
- Empty state si no hay datos.
- Skeleton loader durante carga.

**Criterios subjetivos:**

- Jerarquía visual: saludo → resumen → actividad → acción.
- Espaciado balanceado.
- Se siente como una app real, no un ejercicio de código.

---

## Checklist Rápido

| #   | Verificación                                             | ✅  |
| :-- | :------------------------------------------------------- | :-: |
| 1   | ¿Se usaron componentes RNR antes de crear custom?        |     |
| 2   | ¿Todos los colores son tokens semánticos?                |     |
| 3   | ¿Cada `<Text>` tiene su propia clase de color?           |     |
| 4   | ¿Los touch targets son ≥44pt (iOS) / ≥48dp (Android)?    |     |
| 5   | ¿`accessibilityLabel` en interactivos sin texto visible? |     |
| 6   | ¿Contraste mínimo 4.5:1 verificado?                      |     |
| 7   | ¿Sombras con `Platform.select()` (iOS/Android)?          |     |
| 8   | ¿SafeArea respetada?                                     |     |
| 9   | ¿Animaciones con Reanimated, no con Animated de RN?      |     |
| 10  | ¿`cn()` usado para clases condicionales?                 |     |
| 11  | ¿Dark mode funciona correctamente?                       |     |
| 12  | ¿`<PortalHost />` en root layout si hay overlays?        |     |
| 13  | ¿Jerarquía visual clara (3+ niveles tipográficos)?       |     |
| 14  | ¿Empty state y skeleton loader implementados?            |     |
