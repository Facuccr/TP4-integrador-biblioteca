import { Ionicons } from '@expo/vector-icons';
import { Stack, router, usePathname } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';

export default function NotFoundScreen() {
  const rutaInexistente = usePathname();

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ title: 'Página no encontrada' }} />

      <Ionicons name="compass-outline" size={64} color={COLORES.primario} />
      <Text style={styles.titulo}>Ruta no encontrada (404)</Text>
      <Text style={styles.descripcion}>
        La dirección solicitada no existe en Biblioteca IPF:
      </Text>
      <View style={styles.cajaRuta}>
        <Text style={styles.textoRuta}>{rutaInexistente}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al Catálogo"
        onPress={() => router.replace('/')}
        style={({ pressed }) => [
          styles.botonVolver,
          pressed && styles.botonPresionado,
        ]}
      >
        <Text style={styles.textoBoton}>Ir al Catálogo</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.lg,
    gap: ESPACIADO.md,
  },
  titulo: {
    fontSize: FUENTES.titulo,
    fontWeight: '700',
    color: COLORES.texto,
    textAlign: 'center',
  },
  descripcion: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  cajaRuta: {
    backgroundColor: COLORES.superficie,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoRuta: {
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
    color: COLORES.error,
  },
  botonVolver: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: ESPACIADO.sm,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBoton: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
});