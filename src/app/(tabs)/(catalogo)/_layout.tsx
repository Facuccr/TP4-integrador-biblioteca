import { Stack } from 'expo-router';
import { COLORES } from '../../../constants/tema';

export default function CatalogoStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: COLORES.primario },
        headerTintColor: COLORES.textoClaro,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: COLORES.fondo },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: 'Biblioteca IPF' }}
      />
      <Stack.Screen
        name="libro/[isbn]"
        options={{ title: 'Detalle del libro' }}
      />
    </Stack>
  );
}