import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADO, FUENTES } from '../constants/tema';

type Props = {
  mensaje: string;
};

export function EstadoVacio({ mensaje }: Props) {
  return (
    <View style={styles.contenedor}>
      <Ionicons name="book-outline" size={40} color={COLORES.textoSecundario} />
      <Text style={styles.texto}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    padding: ESPACIADO.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.sm,
  },
  texto: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
});