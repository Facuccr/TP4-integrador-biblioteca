import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { EstadoVacio } from '../components/EstadoVacio';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { LIBROS } from '../data/libros';
import type { Libro } from '../types';

export default function MostradorScreen() {
  const { colasEspera, sesion, entregarAlSiguiente, cerrarSesion } =
    useBiblioteca();
  const [mensajeOperacion, setMensajeOperacion] = useState<string | null>(null);

  const librosConCola: Libro[] = LIBROS.filter(
    (libro) => (colasEspera[libro.isbn]?.tamanio ?? 0) > 0,
  );

  const manejarEntrega = async (isbn: string) => {
    const resultado = await entregarAlSiguiente(isbn);
    setMensajeOperacion(resultado.mensaje);
  };

  return (
    <View style={styles.contenedor}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión del personal"
              onPress={cerrarSesion}
              style={styles.botonHeader}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color={COLORES.textoClaro}
              />
              <Text style={styles.textoHeader}>Cerrar sesión</Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.barraSesion}>
        <Text style={styles.textoSesion}>
          Operador activo: {sesion?.usuario ?? 'Personal'}
        </Text>
      </View>

      {mensajeOperacion && (
        <View style={styles.avisoOperacion}>
          <Text style={styles.textoAviso}>{mensajeOperacion}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar mensaje de entrega"
            onPress={() => setMensajeOperacion(null)}
            style={styles.botonCerrarAviso}
          >
            <Ionicons name="close" size={20} color={COLORES.primario} />
          </Pressable>
        </View>
      )}

      <FlatList
        data={librosConCola}
        keyExtractor={(item) => item.isbn}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <EstadoVacio mensaje="No hay libros con personas en lista de espera en este momento." />
        }
        renderItem={({ item }) => {
          const cola = colasEspera[item.isbn];
          const cantidad = cola?.tamanio ?? 0;
          const primero = cola?.primero();

          return (
            <View style={styles.tarjeta}>
              <Text style={styles.tituloLibro}>{item.titulo}</Text>
              <Text style={styles.autorLibro}>
                {item.autor} · ISBN: {item.isbn}
              </Text>

              <View style={styles.separador} />

              <View style={styles.filaInfo}>
                <Text style={styles.etiqueta}>Personas esperando:</Text>
                <Text style={styles.valor}>{cantidad}</Text>
              </View>

              <View style={styles.filaInfo}>
                <Text style={styles.etiqueta}>Siguiente en turno:</Text>
                <Text style={styles.valorDestacado}>
                  {primero ? primero.nombre : 'Nadie en cola'}
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Entregar ${item.titulo} al siguiente en espera`}
                onPress={() => void manejarEntrega(item.isbn)}
                style={({ pressed }) => [
                  styles.botonEntregar,
                  pressed && styles.botonPresionado,
                ]}
              >
                <Text style={styles.textoBotonEntregar}>
                  Entregar al siguiente
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  botonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
    minHeight: TACTIL_MINIMO,
    paddingHorizontal: ESPACIADO.sm,
  },
  textoHeader: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
  },
  barraSesion: {
    backgroundColor: COLORES.superficie,
    paddingHorizontal: ESPACIADO.md,
    paddingVertical: ESPACIADO.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  textoSesion: {
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
    fontWeight: '600',
  },
  avisoOperacion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.acento,
    marginHorizontal: ESPACIADO.md,
    marginTop: ESPACIADO.md,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
    gap: ESPACIADO.sm,
  },
  textoAviso: {
    flex: 1,
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
    color: COLORES.primario,
  },
  botonCerrarAviso: {
    minWidth: TACTIL_MINIMO,
    minHeight: TACTIL_MINIMO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lista: {
    padding: ESPACIADO.md,
    gap: ESPACIADO.md,
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    gap: ESPACIADO.sm,
  },
  tituloLibro: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autorLibro: {
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: ESPACIADO.xs,
  },
  filaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etiqueta: {
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
  },
  valor: {
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  valorDestacado: {
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
    color: COLORES.primario,
  },
  botonEntregar: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.sm,
    marginTop: ESPACIADO.xs,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBotonEntregar: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
});