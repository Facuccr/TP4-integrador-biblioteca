import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';

type Props = {
  mensaje: string;
  textoBoton?: string;
  onAccion: () => void;
};

export function EstadoError({
  mensaje,
  textoBoton = 'Reintentar',
  onAccion,
}: Props) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="alert-circle-outline" size={44} color={COLORES.error} />
      <Text style={styles.texto}>{mensaje}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={textoBoton}
        onPress={onAccion}
        style={({ pressed }) => [styles.boton, pressed && styles.botonPresionado]}
      >
        <Text style={styles.textoBoton}>{textoBoton}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ESPACIADO.lg,
    gap: ESPACIADO.md,
  },
  texto: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.texto,
    textAlign: 'center',
  },
  boton: {
    minHeight: TACTIL_MINIMO,
    minWidth: TACTIL_MINIMO,
    paddingHorizontal: ESPACIADO.lg,
    paddingVertical: ESPACIADO.sm,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBoton: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
});