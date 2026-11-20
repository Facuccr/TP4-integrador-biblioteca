# Biblioteca IPF — Trabajo Práctico N.º 4 (React Native II)

**Instituto Politécnico Formosa · Tecnicatura Superior en Desarrollo de Software Multiplataforma**

Aplicación móvil desarrollada con **Expo**, **React Native**, **TypeScript** y **Expo Router** para la gestión de préstamos, reservas y listas de espera de la biblioteca institucional. Permite a los estudiantes consultar el catálogo, buscar por título o autor, escanear códigos de barras ISBN-13 y programar recordatorios locales de devolución, mientras que el personal habilitado gestiona la entrega de ejemplares por orden de llegada.

---

## Requisitos previos

- **Node.js** 20 LTS o superior
- **npm** 10 o superior
- **Expo Go** instalado en un dispositivo físico Android o iOS (o emulador Android / simulador iOS)

---

## Instalación y ejecución

1. Clonar el repositorio e instalar dependencias:

```bash
npm install
```

2. Verificar compatibilidad de dependencias con el SDK:

```bash
npx expo install --check
```

3. Iniciar el servidor de desarrollo:

```bash
npx expo start
```

4. Escanear el código QR con la aplicación **Expo Go** en el teléfono (en la misma red Wi-Fi) o presionar `a` para abrir en Android.

---

## Versión del SDK y módulos principales

- **Expo SDK:** `~58.0.26`
- **Expo Router:** `~58.0.32`
- **React / React Native:** `19.3.0` / `0.88.1`
- **TypeScript:** `~6.0.3`
- **Módulos nativos utilizados:**
  - `expo-camera` (`~58.0.14`)
  - `expo-notifications` (`~58.1.9`)
  - `@expo/vector-icons` (`^15.0.2`)

---

## Árbol de rutas (`src/app`) y navegadores

```text
src/app/
├── _layout.tsx                  # Stack raíz + BibliotecaProvider + Stack.Protected + modales
├── +not-found.tsx               # Pantalla 404 para rutas inexistentes
├── buscar.tsx                   # Buscador con parámetro q en URL (Stack raíz)
├── escanear.tsx                 # Escáner EAN-13 y entrada manual de ISBN (Stack raíz)
├── login.tsx                    # Modal de acceso del personal (solo sin sesión)
├── mostrador.tsx                # Cola de espera y entrega de ejemplares (solo con sesión)
├── reserva.tsx                  # <Redirect href="/reservas"/> (compatibilidad URL anterior)
├── permisos/
│   └── [recurso].tsx            # Modal explicativo previo (camara | notificaciones)
├── reservar/
│   └── [isbn].tsx               # Modal de confirmación de préstamo o ingreso a lista de espera
└── (tabs)/
    ├── _layout.tsx              # Bottom Tabs (Catálogo y Mis reservas) con anchor: '(catalogo)'
    ├── reservas.tsx             # Pestaña Mis reservas (préstamos, recordatorios, esperas y avisos)
    └── (catalogo)/
        ├── _layout.tsx          # Stack propio de la pestaña Catálogo
        ├── index.tsx            # Catálogo principal, vistos recientes y accesos rápidos
        └── libro/
            └── [isbn].tsx       # Detalle validado del libro y botón Reservar
```

### Organización de navegadores

1. **Stack raíz (`src/app/_layout.tsx`):** Envuelve toda la aplicación en `BibliotecaProvider`. Aloja el grupo `(tabs)` sin cabecera propia (`headerShown: false`), las pantallas apilables `/buscar` y `/escanear`, los modales `/reservar/[isbn]` y `/permisos/[recurso]` (`presentation: 'modal'`), y dos grupos protegidos mediante `Stack.Protected`:
   - `guard={!haySesion}`: habilita `/login` (modal) únicamente cuando no hay sesión activa.
   - `guard={haySesion}`: habilita `/mostrador` únicamente cuando el personal inició sesión; al cerrar sesión, la ruta desaparece automáticamente del historial.
2. **Tabs (`src/app/(tabs)/_layout.tsx`):** Configura las dos pestañas principales con íconos de `Ionicons` (`@expo/vector-icons`) y define `unstable_settings = { anchor: '(catalogo)' }` para que al abrir un deep link hacia otra ruta del Stack raíz, la pila subyacente conserve las pestañas cargadas.
3. **Stack de Catálogo (`src/app/(tabs)/(catalogo)/_layout.tsx`):** Mantiene la navegación entre la lista principal (`/`) y el detalle (`/libro/[isbn]`) dentro de la pestaña Catálogo sin ocultar la barra inferior de pestañas.

---

## Configuración nativa en `app.json`

### Bloque `plugins` comentado

```jsonc
"plugins": [
  // Habilita el enrutamiento basado en sistema de archivos y rutas tipadas
  "expo-router",
  [
    "expo-camera",
    {
      // Texto de propósito requerido por iOS/Android con el formato institucional
      "cameraPermission": "Usamos tu cámara para escanear el código de barras ISBN de los libros.",
      // Principio de mínimo privilegio: la app solo escanea códigos, nunca graba audio
      "microphonePermission": false,
      "recordAudioAndroid": false
    }
  ],
  [
    "expo-notifications",
    {
      // Ícono y color de acento para las notificaciones locales programadas en Android
      "icon": "./assets/images/icon.png",
      "color": "#1B4332"
    }
  ]
]
```

### Tabla de permisos

| Recurso | Módulo | Cuándo se pide | Alternativa sin permiso |
| :--- | :--- | :--- | :--- |
| **Cámara** | `expo-camera` | Al tocar **Escanear**, mostrar la pantalla explicativa `/permisos/camara` y presionar **Continuar** (o desde el estado preguntable en `/escanear`). | Ingresar el código ISBN de 13 dígitos manualmente en el campo de texto de `/escanear`. |
| **Notificaciones** | `expo-notifications` | Únicamente cuando la persona usuaria activa el interruptor **Recordarme** en un préstamo activo dentro de `/reservas`. | Todos los avisos de disponibilidad y vencimientos se muestran directamente dentro de la pantalla `/reservas`. |

### Justificación de `microphonePermission: false`, `recordAudioAndroid: false` y `blockedPermissions`

Siguiendo el principio de **mínimo privilegio**:
- El plugin `expo-camera` agrega por defecto permisos de grabación de micrófono (`RECORD_AUDIO` en Android y `NSMicrophoneUsageDescription` en iOS) pensando en apps que graban video. Como Biblioteca IPF únicamente lee códigos de barras EAN-13, se desactivó explícitamente el micrófono en el plugin (`microphonePermission: false` y `recordAudioAndroid: false`).
- Además, en `android.blockedPermissions` de `app.json` se bloquearon `RECORD_AUDIO`, `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE` y `READ_MEDIA_IMAGES` para evitar que dependencias transitivas incorporen permisos de ubicación, audio o galería que la aplicación no utiliza.

---

## Deep links de prueba

El esquema configurado en `app.json` es `"scheme": "bibliotecaipf"`. Para probar en Expo Go desde la terminal (reemplazando `<IP:PUERTO>` por la dirección que muestra `npx expo start`):

```bash
# Detalle de libro existente ("Ficciones")
npx uri-scheme open "exp://<IP:PUERTO>/--/libro/9789500426404" --android

# Detalle con ISBN inválido (muestra mensaje de validación y vuelta al Catálogo)
npx uri-scheme open "exp://<IP:PUERTO>/--/libro/123" --android

# Buscador con parámetro inicial en URL
npx uri-scheme open "exp://<IP:PUERTO>/--/buscar?q=borges" --android

# Ruta protegida sin sesión activa (Stack.Protected impide entrar a /mostrador)
npx uri-scheme open "exp://<IP:PUERTO>/--/mostrador" --android

# Redirección desde ruta antigua /reserva hacia /reservas
npx uri-scheme open "exp://<IP:PUERTO>/--/reserva" --android

# Escáner (con cámara bloqueada muestra estado bloqueado y acceso a Ajustes + ingreso manual)
npx uri-scheme open "exp://<IP:PUERTO>/--/escanear" --android
```

---

## Verificación de calidad estática

- **`npx tsc --noEmit`:** Finaliza con salida limpia (`0` errores de tipos, sin uso de `any`).
- **`npx eslint .`:** Finaliza con salida limpia (`0` errores y `0` advertencias, sin reglas desactivadas).

---

## Evidencias

Las capturas de pantalla de cada flujo obligatorio se encuentran en la carpeta `evidencias/`:

1. **Catálogo inicial / cargando:** `evidencias/01-catalogo.jpeg`
2. **Catálogo con error y botón Reintentar:** `evidencias/02-catalogo-error.jpeg`
3. **Catálogo con datos y vistos recientemente:** `evidencias/03-catalogo-datos.jpeg`
4. **Buscador con filtro activo:** `evidencias/04-buscador.jpeg`
5. **Detalle de libro inexistente / ISBN inválido:** `evidencias/05-detalle-inexistente.jpeg`
6. **Pestaña Mis reservas:** `evidencias/06-reservas.jpeg`
7. **Confirmación de reserva sin ejemplares (lista de espera):** `evidencias/07-reservas-sin-ejemplares.jpeg`
8. **Confirmación de reserva con ejemplares disponibles:** `evidencias/08-reserva-con-ejemplares.jpeg`
9. **Escáner con permiso de cámara concedido:** `evidencias/09-escanear-concedido.jpeg`
10. **Notificación local recibida tras 15 segundos:** `evidencias/10-notificacion.jpeg`
11. **Escáner con cámara bloqueada e ingreso manual:** `evidencias/11-escanear-bloqueado.jpeg`
12. **Mostrador antes de entregar al siguiente:** `evidencias/12-mostrador-antes.jpeg`
13. **Mostrador después de entregar al siguiente:** `evidencias/13-mostrador-despues.jpeg`
14. **Pantalla 404 (`+not-found.tsx`):** `evidencias/14-pantalla-404.jpeg`