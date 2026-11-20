import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORES, ESPACIADO, FUENTES } from '../constants/tema';

type Props = {
  mensaje?: string;
};

export function EstadoCarga({ mensaje = 'Cargando datos...' }: Props) {
  return (
    <View style={styles.contenedor}>
      <ActivityIndicator size="large" color={COLORES.primario} />
      <Text style={styles.texto}>{mensaje}</Text>
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
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
});