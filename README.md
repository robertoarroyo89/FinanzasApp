# Flujo — Finanzas personales

Aplicación web de finanzas personales, moderna y lista para producción. Interfaz 100% en español, modo claro/oscuro y datos en tiempo real.

**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Firebase (Auth + Firestore) · Zod · React Hook Form · Recharts

---

## Funcionalidades

- **Panel:** balance total, ingresos/gastos/ahorro del mes, tasa de ahorro, gráfica de flujo de caja (6 meses), gasto por categoría (donut), presupuestos del mes y movimientos recientes. Alta rápida de movimientos.
- **Transacciones:** CRUD completo con importe, concepto, tipo, categoría, fecha, método de pago, notas y flag recurrente. Filtros por búsqueda, tipo, categoría y rango de fechas; orden por fecha/importe/categoría; vista tabla y tarjetas.
- **Categorías:** personalizables con 16 colores, separadas por gastos/ingresos, con categorías por defecto en español creadas en el primer inicio de sesión.
- **Presupuestos:** mensuales por categoría, con progreso, detección de exceso ("Excedido en X €") y navegación entre meses.
- **Metas de ahorro:** objetivo, ahorrado, fecha límite, progreso y ritmo necesario en €/mes.
- **Recurrentes:** reglas semanales/mensuales/anuales que generan transacciones automáticamente al abrir la app (o manualmente con "Generar pendientes"). Pausar/reanudar.
- **Informes:** resumen anual, barras mensuales ingresos vs gastos e insights (categoría con más gasto, mayor gasto individual, ahorro medio, tendencia).
- **Perfil:** editar nombre, cargar/borrar datos de demostración, cerrar sesión.

## Arquitectura

```
app/
  (auth)/          login y registro (layout con panel de marca)
  (app)/           rutas protegidas envueltas en AppShell
    dashboard/  transacciones/  categorias/  presupuestos/
    ahorro/  recurrentes/  informes/  perfil/
components/
  layout/AppShell.tsx    sidebar + topbar móvil + guardia de auth
  ui/                    primitivas (Button, Card, Modal, Progress…)
  dashboard/Charts.tsx   gráficas Recharts tematizadas
  transactions/          modal de alta/edición
hooks/            useAuth (contexto), useUserCollection (onSnapshot), useProfile
lib/              firebase.ts, schemas.ts (Zod), constants.ts, utils.ts, seed.ts, recurring.ts
services/db.ts    helpers CRUD + setup inicial del usuario + limpieza demo
types/            modelos TypeScript
firestore.rules   reglas de seguridad
```

**Decisiones clave:**

- **Datos por usuario:** todo vive bajo `users/{uid}/{transactions|categories|budgets|savingsGoals|recurring}`. Las reglas de Firestore solo permiten leer/escribir al dueño.
- **Tiempo real:** suscripciones `onSnapshot` en todas las vistas; el panel se actualiza al instante.
- **Filtrado en cliente:** los filtros avanzados se aplican en memoria para evitar índices compuestos de Firestore.
- **Offline:** `persistentLocalCache` + `experimentalAutoDetectLongPolling` (compatibilidad Safari).
- **Validación:** Zod + React Hook Form con mensajes en español en todos los formularios.
- **Recurrentes:** `lib/recurring.ts` procesa reglas vencidas al montar el AppShell y avanza `nextRun`.

## Puesta en marcha

### 1. Firebase (una sola vez)

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com).
2. **Authentication → Métodos de acceso:** habilita **Correo/contraseña** y **Google**.
3. **Firestore Database:** crea la base de datos (modo producción).
4. **Reglas:** pega el contenido de `firestore.rules` en Firestore → Reglas y publica.
5. **Configuración del proyecto → Tus apps → Web:** registra una app y copia las credenciales.

### 2. Local o GitHub Codespaces

```bash
# descomprime el proyecto (en Codespaces, sube el zip y ejecuta)
unzip -o flujo-finanzas.zip

cd finanzas
cp .env.example .env.local
# rellena .env.local con tus credenciales de Firebase

npm install
npm run dev
```

Abre `http://localhost:3000` (en Codespaces, el puerto reenviado). Requiere **Node 22**.

> En Codespaces: define también las variables `NEXT_PUBLIC_FIREBASE_*` como secrets del Codespace si prefieres no usar `.env.local`.

### 3. Despliegue en Vercel

1. Sube el repo a GitHub y conéctalo en Vercel.
2. Añade las variables de entorno `NEXT_PUBLIC_FIREBASE_*` en **Settings → Environment Variables**.
3. Deploy. En Firebase → Authentication → Configuración → **Dominios autorizados**, añade tu dominio `*.vercel.app`.

### 4. Probar con datos de ejemplo

Entra en **Perfil → Cargar datos de demostración**: se crean ~3 meses de movimientos, presupuestos, metas y reglas recurrentes (marcados con `demo: true`, borrables desde el mismo sitio).

## Variables de entorno

| Variable | Descripción |
|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key del proyecto |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `<proyecto>.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de Storage |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | App ID |

## Mejoras futuras recomendadas

- **Integración bancaria** (agregadores tipo GoCardless/Tink) para importar movimientos automáticamente.
- **Importación/exportación CSV** de transacciones.
- **Recordatorios de facturas** con notificaciones (FCM o email).
- **Insights con IA:** resúmenes en lenguaje natural, detección de gastos anómalos y sugerencias de ahorro.
- **Multi-divisa** con tipos de cambio actualizados.
- **Cuentas compartidas** (presupuesto familiar con varios usuarios).
- **PWA instalable** con soporte offline completo.
