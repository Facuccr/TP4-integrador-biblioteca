import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { COLORES } from '../../constants/tema';

export const unstable_settings = {
  anchor: '(catalogo)',
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORES.primario,
        tabBarInactiveTintColor: COLORES.textoSecundario,
        tabBarStyle: {
          backgroundColor: COLORES.superficie,
          borderTopColor: COLORES.borde,
        },
        headerStyle: { backgroundColor: COLORES.primario },
        headerTintColor: COLORES.textoClaro,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="(catalogo)"
        options={{
          title: 'Catálogo',
          headerShown: false,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'library' : 'library-outline'}
              size={size}
              color={focused ? COLORES.primario : COLORES.textoSecundario}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reservas"
        options={{
          title: 'Mis reservas',
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              name={focused ? 'bookmark' : 'bookmark-outline'}
              size={size}
              color={focused ? COLORES.primario : COLORES.textoSecundario}
            />
          ),
        }}
      />
    </Tabs>
  );
}