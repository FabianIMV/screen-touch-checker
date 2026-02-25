# 🚀 Mejoras Futuras (Roadmap)

Este documento detalla las mejoras planificadas para la aplicación **Touch Diagnostics**.

## 1. Funcionalidades Core
- [ ] **Soporte Multi-Touch:** Añadir una pantalla dedicada para probar hasta 5-10 toques simultáneos.
- [ ] **Prueba de Presión (3D Touch / Haptic Touch):** Medir y visualizar la intensidad de la presión en dispositivos compatibles.
- [ ] **Exportación de Reportes:** Generar un PDF detallado con el mapa de calor y el diagnóstico para entregar a clientes o técnicos.
- [ ] **Calibración de Sensibilidad:** Permitir ajustar el umbral de tiempo (`GHOST_TOUCH_THRESHOLD_MS`) desde la UI.

## 2. UI / UX
- [ ] **Modo Claro/Oscuro:** Soporte completo para el tema del sistema (actualmente forzado a oscuro).
- [ ] **Animaciones Fluidas:** Mejorar las transiciones entre pantallas usando `react-native-reanimated` v4.
- [ ] **Onboarding:** Un tutorial interactivo la primera vez que se abre la app explicando cómo usar las herramientas.

## 3. Backend y Sincronización
- [ ] **Sincronización en la Nube:** Conectar la base de datos local SQLite con un backend PostgreSQL (Supabase/Firebase).
- [ ] **Autenticación de Técnicos:** Login para que los técnicos de reparación puedan guardar el historial de dispositivos de sus clientes.

## 4. Rendimiento
- [ ] **Optimización del Grid:** Usar `FlashList` o componentes nativos si la cuadrícula se vuelve muy densa.
- [ ] **Reducción del Bundle:** Analizar y reducir el tamaño del bundle de JavaScript.
