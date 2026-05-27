# KASHY FRONTEND SPEC

**RESUMEN**: Cliente móvil para herramienta de control predictivo de finanzas personales.
**META**: Proveer al usuario una interfaz intuitiva para gestionar ingresos, egresos y compras con automatización y visibilidad predictiva.

## 🛠 TECH STACK

| COMPONENTE       | TECNOLOGÍA               | NOTAS                                                |
| :--------------- | :----------------------- | :--------------------------------------------------- |
| **Framework**    | React Native             | Clean Architecture                                   |
| **UI**           | shadcn                   | Componentes reutilizables                            |
| **Estado**       | Zustand                  | Store global                                         |
| **Persistencia** | expo-secure-store        | Sesión, prefs y modo guest (wrapper `secureStorage`) |
| **Auth**         | Firebase Authentication  | Email/password + Google                              |
| **Push**         | Firebase Cloud Messaging | Notificaciones iOS & Android                         |
| **Navegación**   | React Navigation         | Bottom tabs + stack                                  |

## 🎯 MVP SCOPE & RULES

### ALCANCE (IN-SCOPE)

| FEATURE            | DETALLE                                                                                                                                                                      |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Auth/Perfil**    | Registro, login, Google, cambio y restablecimiento de contraseña.                                                                                                            |
| **Dashboard**      | Balance neto, ingresos, egresos, próximos 3 vencimientos, notificaciones, toggle light/dark.                                                                                 |
| **Finanzas**       | Registro de ingresos/egresos, recordatorios, automatización de fijos.                                                                                                        |
| **Listas**         | Ciclo Borrador (TEMPLATE) → Compra activa (RECEIPT) → Recibo (COMPLETED). Edición, eliminación, comparación. Guest local con cap de 2 listas + sync automática al loguearse. |
| **Notificaciones** | Recepción push iOS/Android vía FCM. Configuración desde perfil.                                                                                                              |

### FUERA DE ALCANCE (OUT-SCOPE)

- **NO Multi-país**: MVP solo Venezuela. Post-MVP: Argentina, Colombia, Chile.
- **NO IA**: Post-MVP se integra IA para análisis de gastos, plan de ahorro y metas.
- **NO Backend**: Este documento cubre exclusivamente la capa frontend/mobile.

### NAVEGACIÓN

| TAB          | DESCRIPCIÓN                                                          |
| :----------- | :------------------------------------------------------------------- |
| **Home**     | Dashboard principal. Balance, vencimientos, notificaciones, tema.    |
| **Compras**  | Listas de compras. Guest crea y guarda local (máx 2); sync al login. |
| **Finanzas** | Ingresos y egresos. Guest solo visualiza.                            |
| **Perfil**   | Datos de cuenta o invitado. Config de notificaciones.                |

### ROLES DE USUARIO

| ROL       | DESCRIPCIÓN                                                                                                                                  |
| :-------- | :------------------------------------------------------------------------------------------------------------------------------------------- |
| **GUEST** | Sin sesión. Navega, ve dashboard, crea listas temporales y marca productos. No persiste en BD. Toda acción bloqueada dispara modal de login. |
| **KASHY** | Autenticado. Acceso completo a finanzas, listas con persistencia, perfil, notificaciones y configuración.                                    |

### REGLAS DE NEGOCIO

1. **Región**: Venezuela únicamente para fase de prueba antes de salir al mercado.
2. **Predicción**: El valor diferencial es el control predictivo, no solo el registro histórico.
3. **Automatización**: Los ingresos/egresos fijos se registran automáticamente según programación del usuario.
4. **Guest local**: Ningún dato del guest llega al backend mientras es invitado. Todo vive en `expo-secure-store`. Al loguearse se promueve via `syncGuestData` (auto, silencioso).
5. **Modal de login**: Toda acción bloqueada del guest dispara el modal contextualmente, nunca un error genérico.
6. **Tema**: Toggle light/dark disponible en Dashboard y Perfil.
