import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';
import type { Libro } from '../types';

type Props = {
  libro: Libro;
  disponibles: number;
  enEspera: number;
  onPress: () => void;
};

export function LibroCard({ libro, disponibles, enEspera, onPress }: Props) {
  const hayStock = disponibles > 0;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${libro.titulo}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPresionada]}
    >
      <View style={styles.encabezado}>
        <Text style={styles.titulo}>{libro.titulo}</Text>
        <View
          style={[
            styles.insignia,
            hayStock ? styles.insigniaDisponible : styles.insigniaAgotado,
          ]}
        >
          <Text
            style={[
              styles.textoInsignia,
              hayStock ? styles.textoDisponible : styles.textoAgotado,
            ]}
          >
            {hayStock
              ? `${disponibles} disp.`
              : `Sin stock (${enEspera} en espera)`}
          </Text>
        </View>
      </View>
      <Text style={styles.autor}>
        {libro.autor} · {libro.anio}
      </Text>
      <Text style={styles.isbn}>ISBN: {libro.isbn}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    gap: ESPACIADO.xs,
  },
  cardPresionada: {
    opacity: 0.85,
  },
  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: ESPACIADO.sm,
  },
  titulo: {
    flex: 1,
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
  },
  isbn: {
    fontSize: FUENTES.etiqueta,
    color: COLORES.textoSecundario,
  },
  insignia: {
    paddingHorizontal: ESPACIADO.sm,
    paddingVertical: ESPACIADO.xs,
    borderRadius: RADIOS.pildora,
  },
  insigniaDisponible: {
    backgroundColor: COLORES.exitoFondo,
  },
  insigniaAgotado: {
    backgroundColor: COLORES.advertenciaFondo,
  },
  textoInsignia: {
    fontSize: FUENTES.etiqueta,
    fontWeight: '600',
  },
  textoDisponible: {
    color: COLORES.exito,
  },
  textoAgotado: {
    color: COLORES.advertencia,
  },
});