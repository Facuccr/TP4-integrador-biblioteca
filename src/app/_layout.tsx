import { Stack } from 'expo-router';
import { COLORES } from '../constants/tema';
import { BibliotecaProvider, useBiblioteca } from '../context/BibliotecaContext';

function NavegacionRaiz() {
  const { sesion } = useBiblioteca();
  const haySesion = sesion !== null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.primario },
        headerTintColor: COLORES.textoClaro,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORES.fondo },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="buscar"
        options={{ title: 'Buscar en el catálogo' }}
      />
      <Stack.Screen
        name="escanear"
        options={{ title: 'Escanear código ISBN' }}
      />
      <Stack.Screen
        name="reservar/[isbn]"
        options={{
          presentation: 'modal',
          title: 'Confirmar reserva',
        }}
      />
      <Stack.Screen
        name="permisos/[recurso]"
        options={{
          presentation: 'modal',
          title: 'Permiso requerido',
        }}
      />
      <Stack.Protected guard={!haySesion}>
        <Stack.Screen
          name="login"
          options={{
            presentation: 'modal',
            title: 'Acceso del personal',
          }}
        />
      </Stack.Protected>
      <Stack.Protected guard={haySesion}>
        <Stack.Screen
          name="mostrador"
          options={{
            title: 'Mostrador de entregas',
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <BibliotecaProvider>
      <NavegacionRaiz />
    </BibliotecaProvider>
  );
}