# Respuestas de Análisis Técnico — TP N.º 4: Biblioteca IPF

**Alumno:** Facundo Ezequiel Cristaldo  
**Carrera:** Tecnicatura Superior en Desarrollo de Software Multiplataforma — Instituto Politécnico Formosa  

---

## Parte B — Estado, efectos y renderizado

### B1. El ciclo de vida de `useLibros`

#### a) Secuencia de renders en montaje, éxito, fallo y reintento

En `src/hooks/useLibros.ts` (líneas 5–44) y `src/app/(tabs)/(catalogo)/index.tsx` (línea 23), el ciclo completo de renders ocurre de la siguiente manera:

1. **Render 1 (Montaje inicial):**
   - **Valores:** `libros = []`, `cargando = true`, `error = null`, `intento = 0`.
   - **Causa:** Los `useState` iniciales en `src/hooks/useLibros.ts` (líneas 6–9). En pantalla se muestra `<EstadoCarga />`.
2. **Ejecución del `useEffect` tras el montaje (líneas 15–41):**
   - Se llama a `setCargando(true)` y `setError(null)` (valores idénticos a los iniciales, por lo que React omite un re-render redundante mediante *bailout*) y se invoca `obtenerLibros()`, que demora 800 ms.
3. **Render 2A — Caso de éxito (80 % de probabilidad):**
   - **Valores:** `libros = [16 objetos Libro]`, `cargando = false`, `error = null`.
   - **Causa:** Resolución de `obtenerLibros()` en `src/hooks/useLibros.ts` (líneas 22–24 y 31–33). Se renderiza la `FlatList` del catálogo.
4. **Render 2B — Caso de fallo (20 % de probabilidad, `Math.random() < 0.2` en `src/lib/api.ts`, línea 10):**
   - **Valores:** `libros = []`, `cargando = false`, `error = 'No se pudo cargar el catálogo. Revisá tu conexión e intentá nuevamente.'`.
   - **Causa:** Bloque `catch` y `finally` en `src/hooks/useLibros.ts` (líneas 25–33). Se renderiza `<EstadoError />` con el botón **Reintentar**.
5. **Render 3 y 4 — Al tocar "Reintentar":**
   - **Render 3:** `reintentar()` incrementa `intento` a `1` (línea 12). El `useEffect` se vuelve a disparar, ejecuta `setCargando(true)` y `setError(null)`, mostrando nuevamente `<EstadoCarga />`.
   - **Render 4:** Al resolverse `obtenerLibros()` a los 800 ms, pasa a `cargando = false` y actualiza `libros` con los datos obtenidos (o `error` si vuelve a fallar).

#### b) Desmontaje al cambiar de pestaña o abrir detalle

- **Al cambiar a la pestaña "Mis reservas":** `CatalogoScreen` **no se desmonta**. Bottom Tabs mantiene montadas las pantallas visitadas en memoria para preservar su posición de scroll y estado; solo cambia el foco.
- **Al abrir `/libro/[isbn]`:** `CatalogoScreen` **tampoco se desmonta**; la pantalla de detalle se apila encima dentro del `Stack` propio de `src/app/(tabs)/(catalogo)/_layout.tsx`.
- **Situaciones reales en las que sí se ejecuta la limpieza (`return () => { vigente = false; }` en `src/hooks/useLibros.ts`, líneas 38–40):**
  1. Cuando la persona toca **Reintentar** mientras todavía hay una petición en curso (`intento` cambia, por lo que React ejecuta la limpieza del efecto anterior antes de lanzar el nuevo efecto).
  2. Si la pila de navegación se reinicia por completo (por ejemplo, al navegar con `router.replace('/')` desde `+not-found.tsx` o desde un deep link que reemplaza la ruta raíz).

#### c) Por qué el callback de `useEffect` no puede ser `async`

Una función `async` en JavaScript devuelve implícitamente una `Promise`. Sin embargo, React espera que el valor de retorno de `useEffect` sea únicamente `undefined` o una función síncrona de limpieza (`() => void`). Si se pasara `useEffect(async () => ...)`, React recibiría una promesa en lugar de una función de limpieza y no podría cancelar efectos al desmontar o cambiar dependencias.

En `src/hooks/useLibros.ts` (líneas 15–40) se resuelve definiendo una función interna `const cargar = async () => { ... }` e invocándola con `void cargar()`, devolviendo la función síncrona de limpieza:

```ts
useEffect(() => {
  let vigente = true;
  const cargar = async () => { /* ... */ };
  void cargar();
  return () => {
    vigente = false;
  };
}, [intento]);
```

#### d) Implementación de `reintentar`

Se utiliza un contador numérico `const [intento, setIntento] = useState<number>(0)` (`src/hooks/useLibros.ts`, línea 9) incluido en el array de dependencias `[intento]` (línea 41). Cada llamada a `reintentar()` ejecuta `setIntento((prev) => prev + 1)` (línea 12), garantizando un valor primitivo distinto en cada pulsación (a diferencia de un booleano que solo alternaría entre dos estados o de depender de `error`, que volvería a disparar el efecto al limpiarse a `null`).

---

### B2. La condición de carrera del buscador

| Momento | Qué pasa | Sin limpieza: qué se ve | Con nuestro código (`src/app/buscar.tsx`): qué se ve |
| :--- | :--- | :--- | :--- |
| **$t = 0\text{ ms}$** | Escribe `"bor"` $\rightarrow$ pide `buscarLibros("bor")` (tarda 1.400 ms). | Indicador de carga (`cargando = true`). | Indicador de carga (`cargando = true`). |
| **$t = 200\text{ ms}$** | Escribe `"borges"` $\rightarrow$ pide `buscarLibros("borges")` (tarda 300 ms). | Indicador de carga (`cargando = true`). | Se ejecuta limpieza de `"bor"` (`vigente = false`) y sigue mostrando carga para `"borges"`. |
| **$t = 500\text{ ms}$** | Llega la respuesta de `"borges"`. | Resultados de `"borges"` (*Ficciones*, *El Aleph*). | Resultados de `"borges"` (*Ficciones*, *El Aleph*). |
| **$t = 1.400\text{ ms}$** | Llega la respuesta tardía de `"bor"`. | **Sobrescribe la pantalla** con resultados de `"bor"` (incoherente con el input `"borges"`). | **Se descarta** porque su clausura tiene `vigente === false`; siguen viéndose los resultados de `"borges"`. |

#### a) Funcionamiento de la limpieza

En `src/app/buscar.tsx` (líneas 32–58), cada ejecución del `useEffect` crea su propia variable local `let vigente = true`. Antes de que React ejecute el nuevo efecto provocado por el cambio de `consultaUrl` (en $t = 200\text{ ms}$), ejecuta el retorno del efecto anterior (`vigente = false`, líneas 55–57). Cuando la promesa de `"bor"` finaliza en $t = 1.400\text{ ms}$, evalúa `if (vigente)` (línea 40) y, al ser `false`, omite `setResultados(datos)` y `setCargando(false)`.

#### b) Análisis de la propuesta de comparar `if (texto === q)` dentro de `.then()`

Esa propuesta **no funciona** debido al comportamiento de las **clausuras (closures)** en JavaScript: cuando se crea el callback `.then()`, tanto `texto` como `q` fueron capturados del ámbito léxico de **esa misma ejecución del render**. Por lo tanto, `texto` y `q` son idénticos dentro de esa clausura (`"bor" === "bor"` siempre es `true`), incluso cuando en la pantalla el input ya cambió a `"borges"`.

#### c) URL, botón atrás y diferencia entre `router.setParams` y `router.push`

En `src/app/buscar.tsx` (línea 69) se utiliza `router.setParams({ q: texto })`. Esto actualiza el parámetro de consulta de la entrada actual en la pila de navegación sin apilar nuevas pantallas: cuando la persona presiona **Atrás**, regresa directamente al Catálogo en un solo toque. Si se usara `router.push`, cada letra tipeada apilaría una pantalla nueva (`b` $\rightarrow$ `bo` $\rightarrow$ `bor` $\rightarrow$ `borges`), obligando al usuario a presionar Atrás tantas veces como caracteres haya escrito.

---

### B3. Mutar o reemplazar

#### a) Por qué tocar "Anotarme" tres veces muestra `0`

Al llamar a `espera.encolar('Ana')` sobre la instancia almacenada en `useState`, se muta el array privado `#items` dentro del objeto existente en memoria, pero **no se invoca el setter de `useState`** ni cambia la referencia del objeto `espera`. Como React determina si debe re-renderizar comparando referencias con `Object.is`, no detecta cambios y no vuelve a renderizar el componente.

#### b) Por qué escribir en un `TextInput` hace que el número "salte" a `3`

Al escribir en el `TextInput` controlado, su `onChangeText` actualiza su propio estado y dispara un **re-render** del componente. Durante ese nuevo render, JSX vuelve a evaluar `{espera.tamanio}` leyendo el `#items` que ya había sido mutado tres veces en silencio, mostrando `3` de golpe. Un fallo intermitente es mucho más peligroso que uno determinista porque oculta la causa raíz durante las pruebas manuales, puede pasar desapercibido en desarrollo y rompe la consistencia visual de forma impredecible para el usuario según qué otras acciones realice.

#### c) Solución implementada en `BibliotecaContext` y comparación de alternativas

En `src/context/BibliotecaContext.tsx` (líneas 176–187 y 237–244), cada operación sobre una cola crea una **nueva instancia** de `Cola` copiando los elementos previos con `aArray()`, aplica la mutación controlada (`encolar` o `desencolar`) y reemplaza el objeto diccionario en `setColasEspera`:

```ts
const colaActual = colasEspera[libro.isbn] ?? new Cola<ReservaEspera>();
const nuevaCola = new Cola<ReservaEspera>(colaActual.aArray());
nuevaCola.encolar({ /* ... */ });
setColasEspera((prev) => ({ ...prev, [libro.isbn]: nuevaCola }));
```

| Estrategia | Ventaja | Costo |
| :--- | :--- | :--- |
| **Nueva instancia de `Cola` desde `aArray()` (elegida)** | Inmutabilidad real: cambia la referencia de la cola y del diccionario, compatible con memoización y predecible en React. | Copia superficial del array interno ($O(n)$), despreciable para colas de biblioteca. |
| **Contador de versión (`setVersion(v => v + 1)`)** | Evita copiar el array interno de la cola. | Mantiene estado mutable oculto; si un subcomponente recibe la instancia `cola` por props, `Object.is` dirá que no cambió. |
| **`useReducer`** | Centraliza todas las transiciones de estado en un reducer puro y facilita testing aislado. | Mayor verbosidad de acciones y tipos para un dominio pequeño. |

---

### B4. ¿Dónde vive cada dato?

| Dato | Dónde vive en nuestra app | Por qué ahí y no en otro lugar |
| :--- | :--- | :--- |
| **Texto del buscador (`q`)** | **URL** (`useLocalSearchParams` + `router.setParams` en `src/app/buscar.tsx`, líneas 23 y 69). | Permite abrir búsquedas directamente mediante deep links (`bibliotecaipf://buscar?q=borges`) y compartir el estado de búsqueda en la ruta. |
| **Préstamos y reservas** | **Context** (`prestamos` en `src/context/BibliotecaContext.tsx`, línea 106). | Se crean en `/reservar/[isbn]`, se consultan en `/libro/[isbn]` y se gestionan/devuelven en `/reservas`. |
| **Listas de espera** | **Context** (`colasEspera` en `src/context/BibliotecaContext.tsx`, líneas 107–109). | Se alimentan desde `/reservar/[isbn]`, se muestran en Catálogo/Detalle/Mis reservas y se desencolan desde `/mostrador`. |
| **Vistos recientemente** | **Context** (`pilaRecientes` + `recientes` en `src/context/BibliotecaContext.tsx`, líneas 110–112 y 153–155). | Se apilan al entrar a `/libro/[isbn]` y se consumen en la pantalla principal `/` del Catálogo. |
| **Sesión del personal** | **Context** (`sesion` en `src/context/BibliotecaContext.tsx`, línea 113). | Controla el `guard` de `Stack.Protected` en el layout raíz (`src/app/_layout.tsx`, línea 6) y la cabecera del Catálogo. |
| **Ejemplares disponibles de un libro** | **Se calcula** (`calcularDisponibles` en `src/context/BibliotecaContext.tsx`, líneas 116–124). | Evita inconsistencias manteniendo una única fuente de verdad (`libro.ejemplares - prestamosActivosDelIsbn`). |
| **Estado del permiso de cámara** | **Sistema operativo + Hook local** (`useCameraPermissions` dentro de `usePermisoCamara` en `src/hooks/usePermiso.ts`, línea 11). | El permiso pertenece al SO y solo lo necesitan `/permisos/camara` y `/escanear`. |
| **Identificador de la notificación programada** | **Sistema operativo + Context** (`recordatorioId` dentro de cada `Prestamo` en `src/context/BibliotecaContext.tsx`, línea 218). | El SO programa el disparador y el Context conserva el ID para cancelarlo si se apaga el switch o se devuelve el libro. |

#### Impacto del re-renderizado del Context

Cuando cambia el `value` de `BibliotecaContext`, **todos los componentes que invocan `useBiblioteca()`** se vuelven a renderizar. Por lo tanto, si el usuario activa un recordatorio en `/reservas`, `CatalogoScreen` (que permanece montada en la otra pestaña y consume `useBiblioteca()`) también se re-renderiza aunque solo utilice `recientes`, `colasEspera`, `sesion` y `calcularDisponibles`.

Para evitarlo se podría dividir el Context en contextos más granulares (por ejemplo, `SesionContext`, `RecientesContext` y `ReservasContext`). Sin embargo, en una aplicación de este tamaño (pocas pantallas y listas cortas), el costo de ese re-render en segundo plano es imperceptible (menos de 1 ms) y mantener un único Provider evita complejidad innecesaria.

---

## Parte C — Navegación y rutas

### C1. La pila en nuestra app

| # | Acción | Pilas resultantes (de base a tope) |
| :--- | :--- | :--- |
| **1** | Abre la app. | **Stack raíz:** `[(tabs)]`<br>**Tab activa (`(catalogo)`):** `[index (Catálogo)]` |
| **2** | Toca un libro del Catálogo. | **Stack raíz:** `[(tabs)]`<br>**Stack de tab `(catalogo)`:** `[index (Catálogo), libro/[isbn]]` |
| **3** | Toca "Reservar". | **Stack raíz:** `[(tabs), reservar/[isbn] (modal)]`<br>**Stack de tab `(catalogo)`:** `[index (Catálogo), libro/[isbn]]` |
| **4** | Toca "Confirmar". | **Stack raíz:** `[(tabs)]` (tab activa: `reservas`)<br>**Stack de tab `(catalogo)`:** `[index (Catálogo), libro/[isbn]]` |
| **5** | Toca atrás (Android). | **Stack raíz:** `[(tabs)]` (vuelve a tab inicial `(catalogo)`)<br>**Stack de tab `(catalogo)`:** `[index (Catálogo), libro/[isbn]]` |
| **6** | Toca la tab "Catálogo". | **Stack raíz:** `[(tabs)]`<br>**Stack de tab `(catalogo)`:** `[index (Catálogo), libro/[isbn]]` (si ya estaba en la tab, regresa al inicio del stack de la tab). |

#### a) Método utilizado en el paso 4

En `src/app/reservar/[isbn].tsx` (líneas 54–57) se ejecutó:

```ts
if (router.canDismiss()) {
  router.dismissAll();
}
router.replace('/reservas');
```

- Con **`push('/reservas')`**, el modal `reservar/[isbn]` quedaría debajo en el historial, por lo que tocar Atrás devolvería al usuario a la pantalla de confirmación ya procesada.
- Con **`replace('/reservas')` solo**, desde un modal presentado sobre `(tabs)`, puede duplicar o reemplazar mal el contexto del modal según la plataforma.
- Con **`dismissAll()` + `replace('/reservas')`**, se cierra el modal limpiando la pila modal del Stack raíz y se posiciona directamente en la pestaña `/reservas`.

#### b) Qué se ve al volver a la tab "Catálogo"

Al cambiar entre pestañas, el Stack interno de `(catalogo)` conserva el historial que tenía antes de cambiar de tab (`libro/[isbn]` en el tope), y al volver a tocar la tab estando ya activa hace pop al `index`. Esto es correcto porque permite retomar la lectura de la ficha del libro donde la persona la dejó sin perder contexto.

---

### C2. El escáner que dispara de más

#### a) Qué pasaría con `router.push` sin protección

La cámara procesa fotogramas continuamente (varias veces por segundo) y dispara `onBarcodeScanned` en cada frame donde detecta el código EAN-13. Sin bloqueo, se encolarían múltiples acciones `PUSH` consecutivas en el despachador de navegación, apilando 5 o 10 instancias idénticas de `/libro/[isbn]` una encima de otra.

#### b) Por qué `useRef` y no `useState`

En `src/app/escanear.tsx` (líneas 29 y 33–43) se utiliza `const navegacionEnCursoRef = useRef<boolean>(false)`. Un `useState` es **asíncrono**: actualizar el estado programa un nuevo render, pero las llamadas siguientes a `onBarcodeScanned` que llegan en los milisegundos previos al re-render siguen leyendo la clausura vieja donde el estado todavía vale `false`. En cambio, mutar `navegacionEnCursoRef.current = true` es **síncrono e inmediato** en memoria, bloqueando cualquier callback subsiguiente en el mismo tick.

#### c) Por qué `replace` frente a `push`

En `src/app/escanear.tsx` (línea 43) se usa `router.replace(\`/libro/\${libroEncontrado.isbn}\`)`. Si se usara `push`, al tocar **Atrás** desde el detalle del libro el usuario volvería a la cámara activa (`/escanear`) con el código todavía enfrente, provocando un bucle inmediato de re-escaneo. Con `replace`, `/escanear` se reemplaza por la ficha del libro y **Atrás** regresa limpiamente al Catálogo.

#### d) Manejo de ISBN inexistente sin repetir avisos

Cuando el código EAN-13 no coincide con ningún libro de `LIBROS`, se guarda el código en `ultimoIsbnInexistenteRef.current` (`src/app/escanear.tsx`, líneas 30 y 47–53). Mientras la cámara siga apuntando al mismo código desconocido, la condición `ultimoIsbnInexistenteRef.current !== codigoLimpio` evita actualizar el estado repetidamente; si el usuario apunta a otro código distinto o escribe manualmente, la cámara sigue activa y responde de inmediato.

---

### C3. Deep links y rutas protegidas

| Link | Qué ve la persona | Qué queda debajo en la pila | Qué parte de nuestro código lo decide |
| :--- | :--- | :--- | :--- |
| `bibliotecaipf://libro/9789500426404` | Ficha completa del libro *"Ficciones"* con botón **Reservar**. | `(tabs)` con `index` (Catálogo) en la base del stack de la pestaña. | `src/app/(tabs)/_layout.tsx` (`anchor: '(catalogo)'`) y `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 16–20). |
| `bibliotecaipf://libro/123` | Pantalla de error amigable: *"El código '123' no es un ISBN válido de 13 dígitos"* y botón **Volver al Catálogo**. | `(tabs)` con `index` (Catálogo). | Validación `REGEX_ISBN_13` en `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 13 y 36–49). |
| `bibliotecaipf://buscar?q=borges` | Pantalla `/buscar` con `"borges"` precargado en el input y los libros de Borges filtrados. | `(tabs)` con el Catálogo debajo. | `useLocalSearchParams` en `src/app/buscar.tsx` (líneas 23–24 y 39). |
| `bibliotecaipf://mostrador` (sin sesión) | No accede al mostrador; Expo Router resuelve la ruta no disponible (`+not-found` o redirige al inicio). | `(tabs)` (Catálogo). | `<Stack.Protected guard={haySesion}>` en `src/app/_layout.tsx` (líneas 56–63). |
| `bibliotecaipf://reserva` | Redirección inmediata a la pestaña **Mis reservas** (`/reservas`). | `(tabs)` con la pestaña `reservas` activa. | `<Redirect href="/reservas" />` en `src/app/reserva.tsx` (línea 4). |
| `bibliotecaipf://escanear` (cámara bloqueada) | Pantalla `/escanear` mostrando el estado **Cámara bloqueada**, botón **Abrir Ajustes** e ingreso manual de ISBN. | `(tabs)` (Catálogo). | `usePermisoCamara` (`estado === 'bloqueado'`) en `src/hooks/usePermiso.ts` (líneas 26–34) y `src/app/escanear.tsx` (líneas 109–124). |

#### Por qué `/libro/123` llega a la pantalla de detalle

Expo Router resuelve las rutas únicamente por coincidencia de patrón de URL (`libro/[isbn]`), sin validar semánticamente el contenido del parámetro antes de montar el componente. La responsabilidad de validar que `isbn` tenga exactamente 13 dígitos numéricos y exista en el catálogo recae íntegramente en `DetalleLibroScreen` (`src/app/(tabs)/(catalogo)/libro/[isbn].tsx`, líneas 13–20 y 36–49).

---

### C4. Foco, montaje y primer plano

#### a) Eventos que detecta cada herramienta

- **`useEffect(..., [])`:** Se ejecuta una sola vez cuando el componente se **monta** por primera vez en el árbol de React.
- **`useFocusEffect`:** Se ejecuta cada vez que la pantalla gana el **foco de navegación** (al entrar a la pestaña o volver desde otra pantalla de la app) y limpia al perder el foco.
- **`AppState` (`change` $\rightarrow$ `'active'`):** Detecta cuando la **aplicación completa pasa de segundo plano a primer plano** (por ejemplo, cuando la persona sale a Ajustes del sistema operativo y regresa a Expo Go).

#### b) Escenarios de actualización

- **Sale a Ajustes del teléfono y vuelve:** Solo **`AppState`** se entera, porque la pantalla de React Navigation nunca perdió el foco interno ni se desmontó; fue el proceso completo de la app el que pasó a *background* y volvió a *active*.
- **Cambia a la pestaña "Catálogo" y regresa a "Mis reservas":** Se entera **`useFocusEffect`**, porque cambia la pestaña enfocada dentro del navegador, pero la app nunca pasó a segundo plano (`AppState` permaneció en `'active'`) ni se desmontó (`useEffect([])` no vuelve a correr).

#### c) Elección en nuestra app

En `src/app/(tabs)/reservas.tsx` (líneas 45–60) se combinaron **`useFocusEffect` y `AppState`**. Si se hubiera usado únicamente `useFocusEffect`, el indicador superior de *"Notificaciones desactivadas"* quedaría desactualizado cuando el usuario habilita el permiso en Ajustes del teléfono y regresa directamente a la pantalla abierta; y si se hubiera usado únicamente `useEffect([])`, nunca se actualizaría tras el primer montaje.

---

## Parte D — Permisos en nuestra app

### D1. Recorrido completo de la cámara (Android 14)

| # | Acción | Qué muestra nuestra app | `status` | `canAskAgain` |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Toca **"Escanear"** por primera vez. | Modal `/permisos/camara` con beneficio en una frase y botón **Continuar**. | `'undetermined'` | `true` |
| **2** | Toca **"Continuar"** $\rightarrow$ **"No permitir"** en diálogo Android. | Navega a `/escanear` mostrando el estado **Cámara no habilitada** con botón **Permitir cámara** y entrada manual. | `'denied'` | `true` |
| **3** | Toca **"Escanear"** otra vez (o **"Permitir cámara"**). | Modal `/permisos/camara` vuelve a mostrar el botón **Continuar** porque Android 14 permite una segunda solicitud. | `'denied'` | `true` |
| **4** | Toca **"Continuar"** $\rightarrow$ **"No permitir"** por segunda vez. | Android bloquea el diálogo nativo; `/escanear` muestra **Cámara bloqueada** con botón **Abrir Ajustes**. | `'denied'` | `false` |
| **5** | Toca **"Escanear"** otra vez. | Modal `/permisos/camara` cambia su único botón principal a **Abrir Ajustes**. | `'denied'` | `false` |
| **6** | Toca **"Abrir Ajustes"** $\rightarrow$ habilita cámara $\rightarrow$ vuelve. | `AppState` refresca el permiso y `/escanear` muestra inmediatamente el visor `<CameraView />`. | `'granted'` | `true` |

#### a) Diferencia en iOS

En **iOS**, el sistema operativo no otorga dos oportunidades de diálogo como Android 13/14: tras la **primera denegación** en el paso 2, iOS pasa inmediatamente `status: 'denied'` y `canAskAgain: false`. Por lo tanto, desde el paso 3 en adelante nuestra app ya muestra **Abrir Ajustes** sin volver a intentar el diálogo nativo.

#### b) Condición exacta que decide entre "Continuar" y "Abrir Ajustes"

En `src/hooks/usePermiso.ts` (líneas 26–34) y `src/app/permisos/[recurso].tsx` (líneas 81 y 117):

```ts
if (permiso.granted) {
  estado = 'concedido';
} else if (permiso.canAskAgain) {
  estado = 'preguntable';
} else {
  estado = 'bloqueado';
}
// En el modal:
const estaBloqueado = estado === 'bloqueado';
// Texto del botón: {estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
```

No alcanza con mirar `status === 'denied'` porque tanto tras el primer rechazo como tras el bloqueo definitivo `status` vale `'denied'`; únicamente `canAskAgain` distingue si el sistema operativo aún permite mostrar el diálogo nativo (`true`) o si es obligatorio enviar al usuario a `Linking.openSettings()` (`false`).

#### c) Cómo se entera la app al volver de Ajustes

En `src/hooks/usePermiso.ts` (líneas 13–22), el listener `AppState.addEventListener('change', ...)` detecta `estadoApp === 'active'` e invoca `obtenerPermiso()` (el tercer elemento retornado por `useCameraPermissions()`). Sin este listener, al volver de Ajustes la pantalla `/escanear` seguiría mostrando el cartel de **Cámara bloqueada** hasta que el usuario saliera y volviera a entrar a la ruta.

---

### D2. Notificaciones y consistencia

#### a) Cancelación al devolver antes de los 15 segundos

Si la persona activa **Recordarme** y devuelve el libro antes de los 15 segundos sin cancelar la notificación, el sistema operativo dispararía igual el recordatorio de devolución sobre un libro que ya fue entregado, generando confusión. En `src/context/BibliotecaContext.tsx` (líneas 191–195), `devolverPrestamo` verifica `if (encontrado.recordatorioId)` y llama a `cancelarRecordatorio(encontrado.recordatorioId)` (`Notifications.cancelScheduledNotificationAsync`).

#### b) Dónde se guarda el identificador y qué ocurre al cerrar la app

El `recordatorioId` se guarda en memoria dentro de cada objeto `Prestamo` en el estado de `BibliotecaContext` (`src/context/BibliotecaContext.tsx`, línea 218). Si la app se cierra por completo antes de los 15 segundos, el sistema operativo conserva la notificación agendada en su planificador nativo y la entregará al cumplirse el tiempo, pero al reabrir la app el estado en memoria se reinicia vacío y la app pierde la referencia al `recordatorioId` para cancelarlo. Para resolverlo se persistiría el array `prestamos` (con sus `recordatorioId`) en `AsyncStorage` y se reconciliaría al iniciar con `Notifications.getAllScheduledNotificationsAsync()`.

#### c) Canal de Android 13+ frente a Android 12

A partir de **Android 13 (API 33)**, el sistema exige el permiso en tiempo de ejecución `POST_NOTIFICATIONS` y **no muestra el diálogo de permiso hasta que la app tenga al menos un canal de notificaciones creado** (o solicita permiso al crear el canal). Por eso en `src/lib/notificaciones.ts` (líneas 35–36) se ejecuta `await configurarCanalPrestamos()` antes de `requestPermissionsAsync()`. En **Android 12 (API 31/32)** o inferior, el permiso de notificaciones se otorga automáticamente al instalar la app, pero el canal `prestamos` sigue siendo obligatorio desde Android 8 (API 26) para definir la importancia (`AndroidImportance.HIGH`) y sonido.

#### d) Decisión entre notificación y aviso interno en `entregarAlSiguiente`

En `src/context/BibliotecaContext.tsx` (líneas 255–274):

```ts
const estadoPermiso = await consultarPermisoNotificaciones();
if (estadoPermiso.granted) {
  await notificarEjemplarDisponible(tituloLibro);
} else {
  setAvisos((prev) => [
    {
      id: `aviso-${Date.now()}`,
      mensaje: `¡Buenas noticias! Se te asignó "${tituloLibro}" desde la lista de espera.`,
      fecha: new Date().toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    ...prev,
  ]);
}
```

Se consulta el permiso **en ese preciso instante** mediante `consultarPermisoNotificaciones()` (`Notifications.getPermissionsAsync()`) en lugar de confiar en un booleano guardado en estado, porque la persona pudo haber revocado o habilitado las notificaciones desde Ajustes del sistema operativo en cualquier momento.

---

### D3. Lo que nuestra app pide y lo que no

| Plataforma | Permiso o clave declarada | Función de la app que lo justifica | ¿Quién lo agrega? |
| :--- | :--- | :--- | :--- |
| **Android** | `android.permission.CAMERA` | Escaneo de códigos de barras ISBN-13 en `/escanear`. | Plugin `expo-camera` y `android.permissions` en `app.json`. |
| **Android** | `android.permission.POST_NOTIFICATIONS` | Programación de recordatorios de devolución y avisos de disponibilidad en `/reservas`. | Plugin `expo-notifications` (Android 13+). |
| **iOS** | `NSCameraUsageDescription` (`"Usamos tu cámara para escanear el código de barras ISBN de los libros."`) | Explicación nativa al solicitar acceso a la cámara para escanear códigos ISBN. | Plugin `expo-camera` (`cameraPermission`) e `ios.infoPlist` en `app.json`. |

#### a) Ausencia de `RECORD_AUDIO`

En `app.json` se deshabilitó explícitamente el micrófono en la configuración del plugin `expo-camera` y se reforzó en `blockedPermissions`:

```json
[
  "expo-camera",
  {
    "cameraPermission": "Usamos tu cámara para escanear el código de barras ISBN de los libros.",
    "microphonePermission": false,
    "recordAudioAndroid": false
  }
]
```

#### b) Qué cambiaría para agregar "elegir una foto de portada desde la galería"

Se necesitaría instalar **`expo-image-picker`** (`npx expo install expo-image-picker`). En Android modernos (con el Photo Picker del sistema) no requiere permiso de lectura permanente para seleccionar una sola imagen, pero para compatibilidad amplia declara `READ_MEDIA_IMAGES` / `READ_EXTERNAL_STORAGE` (que actualmente bloqueamos en `blockedPermissions`) y en iOS requiere `NSPhotoLibraryUsageDescription`. **No alcanza con una actualización OTA**: al agregar un módulo nativo nuevo (`expo-image-picker`) y modificar claves nativas de manifiesto/`Info.plist`, se requiere generar una **nueva build nativa** (`eas build` o `npx expo run:android`).

#### c) Límites de verificación en Expo Go

En **Expo Go** no es posible verificar el texto personalizado de `NSCameraUsageDescription` ni el ícono/color nativo del plugin `expo-notifications`, porque Expo Go utiliza su propio binario precompilado con sus propios textos de propósito e ícono de aplicación. Para verificarlos fielmente se genera un **Development Build** (`npx expo prebuild` + `npx expo run:android` / `eas build --profile development`).

---

## Parte E — Buenas prácticas y decisiones de diseño

### E1. Revisión de código del snippet de ejemplo

#### a) Ocho problemas detectados en el código del compañero

1. **Línea 10 — Mala práctica / TypeScript:** `useState<any[]>([])` usa `any[]`, anulando el tipado estático de `Libro[]` y permitiendo acceder a propiedades inexistentes sin error de compilación. **Corrección:** Tipar como `useState<Libro[]>([])` (o delegar en `useLibros()`).
2. **Líneas 13–16 — Mala práctica / Permisos:** Solicita permisos de cámara y notificaciones en `useEffect(..., [])` apenas se abre la pantalla de inicio, sin contexto ni pantalla explicativa previa. **Corrección:** Pedir cámara solo al iniciar el flujo de escaneo (previa pantalla `/permisos/camara`) y notificaciones solo al activar el switch **Recordarme**.
3. **Líneas 18–20 — Error de ejecución / Rendimiento crítico:** `useEffect` sin array de dependencias llama a `obtenerLibros().then(setLibros)` en cada render, generando un bucle infinito de peticiones y re-renders. **Corrección:** Agregar array de dependencias y bandera `vigente` de limpieza dentro de `useLibros()`.
4. **Línea 19 — Error de ejecución / Manejo de errores:** No tiene `.catch()` ni `try/catch`. Como `obtenerLibros()` falla 1 de cada 5 veces, lanza una *Unhandled Promise Rejection* y deja la pantalla vacía sin opción de reintentar. **Corrección:** Manejar estados `cargando`, `error` y botón **Reintentar**.
5. **Línea 19 — Advertencia / Fuga de memoria:** No cancela la actualización de estado si el componente se desmonta antes de resolver `obtenerLibros()`. **Corrección:** Usar `let vigente = true` y limpiarlo en el `return` del `useEffect`.
6. **Líneas 22–30 — Rendimiento / Mala práctica:** El componente `Fila` está declarado **dentro** de `Catalogo`. En cada re-render de `Catalogo` se crea una nueva función `Fila`, obligando a React a desmontar y volver a montar todas las filas en lugar de actualizarlas. **Corrección:** Extraer `LibroCard` a nivel de módulo en `src/components/LibroCard.tsx`.
7. **Línea 24 — Mala práctica de estilos:** Uso de estilos en línea `style={{ fontSize: 16, color: '#333', padding: 12 }}` con colores hardcoded. **Corrección:** Usar `StyleSheet.create` y constantes de `src/constants/tema.ts`.
8. **Líneas 33–36 — Rendimiento y estabilidad de listas:** Usa `<ScrollView>` con `.map()` y `key={i}` (el índice del array) en lugar de `<FlatList>` con `keyExtractor={(item) => item.isbn}`. Además, el botón de cámara (líneas 37–39) carece de `accessibilityRole="button"`, `accessibilityLabel` y área táctil mínima de 44×44.

#### b) Qué ocurre durante el primer minuto sin array de dependencias

1. Al montarse `Catalogo`, corre el `useEffect` y dispara `obtenerLibros()` (800 ms).
2. A los 800 ms se resuelve y ejecuta `setLibros(datos)`. Como `obtenerLibros()` devuelve siempre un **array nuevo** (`LIBROS.map(...)`), `Object.is` detecta una nueva referencia y provoca un **re-render**.
3. Al no tener array de dependencias, el `useEffect` vuelve a ejecutarse tras ese render y dispara otro `obtenerLibros()`, repitiendo el ciclo indefinidamente cada ~800 ms (~75 peticiones por minuto) hasta que ocurre un fallo aleatorio del 20 % que deja promesas rechazadas sin capturar.
4. **¿Cambiaría si `obtenerLibros()` devolviera siempre la misma referencia de array?** Al recibir la primera respuesta (800 ms), `setLibros(mismoArray)` cambiaría `[]` por `mismoArray` (1 re-render). En el segundo ciclo (1.600 ms), `setLibros(mismoArray)` recibiría la **misma referencia** que ya está en estado; React aplicaría *bailout*, no volvería a renderizar y el bucle infinito se detendría.

#### c) Reescritura de la pantalla usando nuestros módulos propios

Nuestra implementación real en `src/app/(tabs)/(catalogo)/index.tsx` (líneas 19–124) reemplaza el código anterior utilizando `useLibros()`, `useBiblioteca()`, `EstadoCarga`, `EstadoError`, `EstadoVacio`, `LibroCard`, `FlatList` con `keyExtractor={(item) => item.isbn}`, `StyleSheet.create` y las constantes de `src/constants/tema.ts`.

#### d) Problema que provoca rechazo en tienda vs. problema que provoca desinstalación

- **Rechazo en tienda (App Store / Google Play):** Pedir permisos de cámara y notificaciones apenas abre la app sin contexto ni justificación previa (líneas 13–16), sumado a la falta de manejo de errores de red (crashes/pantallas congeladas ante errores 20 %), incumple las políticas de privacidad y calidad de revisión de Apple App Store (Guideline 5.1.1) y Google Play.
- **Desinstalación inmediata por el usuario:** El bucle infinito de peticiones cada 800 ms (líneas 18–20) que recarga la lista constantemente, consume batería/datos y deja la pantalla en blanco cuando ocurre el 20 % de error sin botón para reintentar.

---

### E2. Organización y acoplamiento

#### a) Grafo de dependencias entre carpetas

```text
src/app/ (rutas y pantallas)
  ├──► src/components/   ──► src/constants/tema.ts, src/types/
  ├──► src/context/      ──► src/estructuras/, src/lib/notificaciones.ts, src/data/, src/types/
  ├──► src/hooks/        ──► src/lib/api.ts, src/types/
  └──► src/constants/tema.ts, src/data/libros.ts
```

No existe ninguna importación "hacia arriba" (ningún archivo de `components`, `hooks`, `context`, `lib` o `estructuras` importa desde `src/app/`). Si un hook o estructura importara desde `src/app/`, se generarían dependencias circulares y se acoplaría la lógica de negocio a las pantallas de Expo Router, impidiendo reutilizar o testear las piezas de forma aislada.

#### b) Qué cambiaría al pasar a una API real

Cambiarían únicamente **2 archivos**:
1. `src/lib/api.ts`: reemplazar los `esperar()` y el array local `LIBROS` por llamadas `fetch` / `axios` a los endpoints REST reales.
2. `src/hooks/useLibros.ts` (o un hook `useLibroDetalle(isbn)`): para obtener el detalle individual desde la API en lugar de leer `LIBROS` directamente en las pantallas.

Que los cambios de infraestructura de red queden aislados en la capa `src/lib/` confirma un bajo acoplamiento entre la obtención de datos y la interfaz de usuario.

#### c) Evaluación de un wrapper `<ConPermiso recurso="camara">`

- **Qué se ganaría:** Evitar repetir bloques `if (estado === 'cargando') ... if (estado === 'bloqueado') ...` en pantallas que dependen completamente de un permiso.
- **Qué se perdería:** Flexibilidad de UX. En `/escanear`, aunque la cámara esté bloqueada, la pantalla **debe renderizar igual** el formulario de ingreso manual de ISBN; un wrapper que ocultara los `children` bloquearía toda la pantalla. Además, **no serviría para las notificaciones**, porque ese permiso no se solicita al abrir una pantalla sino como respuesta puntual al evento `onValueChange` de un `<Switch>` dentro de `/reservas`.

---

### E3. Mapa de fallas

| Situación | Qué ve la persona | Dónde se maneja (archivo y línea) |
| :--- | :--- | :--- |
| `obtenerLibros()` falla | Icono de alerta, mensaje *"No se pudo cargar el catálogo. Revisá tu conexión e intentá nuevamente."* y botón **Reintentar**. | `src/hooks/useLibros.ts` (líneas 25–30) y `src/app/(tabs)/(catalogo)/index.tsx` (líneas 97–98). |
| Se abre `/libro/abc` | Pantalla con mensaje *"El código 'abc' no es un ISBN válido de 13 dígitos."* y botón **Volver al Catálogo**. | `src/app/(tabs)/(catalogo)/libro/[isbn].tsx` (líneas 13, 16 y 36–49). |
| Se escanea un ISBN que no está en el catálogo | Aviso amarillo en pantalla indicando que el código no pertenece al catálogo y permitiendo seguir escaneando sin navegar. | `src/app/escanear.tsx` (líneas 47–53 y 127–131). |
| La cámara está bloqueada | Recuadro **Cámara bloqueada** con botón **Abrir Ajustes** y acceso completo al campo manual de ISBN. | `src/hooks/usePermiso.ts` (líneas 32–34) y `src/app/escanear.tsx` (líneas 109–124). |
| Las notificaciones están denegadas | Banner superior indicando que están desactivadas, aviso con botón a Ajustes/explicación y avisos internos visibles en pantalla. | `src/app/(tabs)/reservas.tsx` (líneas 74–82 y 95–138) y `src/context/BibliotecaContext.tsx` (líneas 255–274). |
| Se intenta reservar un libro ya reservado | En detalle muestra el aviso de préstamo/posición activa; en el modal deshabilita **Confirmar** y alerta si se intenta duplicar. | `src/context/BibliotecaContext.tsx` (líneas 159–161) y `src/app/reservar/[isbn].tsx` (líneas 47–51 y 106–110). |
| "Entregar al siguiente" con la lista de espera vacía | Mensaje informativo *"No hay personas en la lista de espera para este libro."* sin lanzar excepciones. | `src/context/BibliotecaContext.tsx` (líneas 232–237) y `src/app/mostrador.tsx` (líneas 27–30). |
| Login con clave incorrecta | Alerta roja con el mensaje *"Usuario o clave incorrectos. Verificá los datos de acceso."* permaneciendo en el modal. | `src/context/BibliotecaContext.tsx` (líneas 280–286) y `src/app/login.tsx` (líneas 29–34 y 102–106). |

---

### E4. Decisiones con argumentos

#### a) Identificador: ISBN como parámetro de ruta y `key` frente a ID propio

En nuestra app utilizamos `isbn` (13 dígitos) como `keyExtractor` y parámetro de ruta (`/libro/[isbn]`) porque la consigna modela cada título como una entidad única con un contador `ejemplares` y el escáner lee directamente códigos EAN-13. Sin embargo, en un sistema bibliotecario real convendría un **ID interno propio** (`libroId` o `ejemplarId`), ya que existen libros antiguos o apuntes internos sin ISBN, o distintas ediciones/ejemplares físicos de una misma obra. Además, `useLocalSearchParams()` tipa los parámetros como `string | string[] | undefined`, obligando a normalizar `isbn` (`Array.isArray(isbn) ? isbn[0] : isbn`) antes de validar con regex.

#### b) Estructuras: Clase `Pila` con `#items` frente a array en el estado

Encapsular la lógica LIFO en `class Pila<T>` con el campo privado `#items` (`src/estructuras/Pila.ts`, línea 2) garantiza que ningún componente externo pueda mutar el historial por error mediante métodos arbitrarios de array (como `splice` o `reverse` in-place), exponiendo únicamente `apilar`, `desapilar`, `verTope`, `tamanio` y `aArray()`. El costo al integrarla con React es que no se puede mutar directamente en `useState`, por lo que en `registrarReciente` (`src/context/BibliotecaContext.tsx`, líneas 138–151) reconstruimos una nueva instancia `new Pila<Libro>(...)` para disparar la actualización de estado de forma inmutable.

#### c) Memorización: dónde aporta y dónde sería ruido

- **Dónde aporta:** En el objeto `value` de `BibliotecaContext` (`src/context/BibliotecaContext.tsx`, líneas 296–334), envuelto en `useMemo` junto con funciones estabilizadas con `useCallback`. Sin `useMemo`, cualquier re-render interno del `BibliotecaProvider` crearía un objeto `value` nuevo y forzaría a re-renderizar todos los consumidores del árbol incluso si ningún dato cambió.
- **Dónde sería ruido:** En cálculos triviales de renderizado como `const disponibles = calcularDisponibles(libro)` o `const enEspera = colasEspera[libro.isbn]?.tamanio ?? 0` dentro de `LibroCard` (`src/components/LibroCard.tsx`). Envolver operaciones $O(1)$ en `useMemo` añade consumo de memoria y comparación de dependencias más costoso que ejecutar la suma directamente.
- **Cómo comprobarlo:** Utilizando **React DevTools Profiler** (grabando una interacción y midiendo el *Render duration* y el motivo de cada re-render en el *Flamegraph*) en lugar de optimizar por intuición.

#### d) Datos duplicados: ejemplares disponibles calculados

En nuestro diseño no existe un estado separado `ejemplaresDisponibles`; se calcula dinámicamente en `calcularDisponibles(libro)` (`src/context/BibliotecaContext.tsx`, líneas 116–124) restando los préstamos activos de ese ISBN al inventario base (`libro.ejemplares`). Si el dato viviera duplicado en dos estados (por ejemplo, un diccionario `stockPorIsbn` y el array `prestamos`), al crear o devolver un préstamo habría que sincronizar ambos estados manualmente; cualquier olvido o fallo parcial dejaría el contador de disponibles desfasado respecto a los préstamos reales del usuario.