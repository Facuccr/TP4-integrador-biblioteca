import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EstadoError } from '../../../../components/EstadoError';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../../../../constants/tema';
import { useBiblioteca } from '../../../../context/BibliotecaContext';
import { LIBROS } from '../../../../data/libros';

const REGEX_ISBN_13 = /^\d{13}$/;

export default function DetalleLibroScreen() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? isbn[0] : (isbn ?? '');
  const formatoValido = REGEX_ISBN_13.test(isbnNormalizado);
  const libro = formatoValido
    ? LIBROS.find((item) => item.isbn === isbnNormalizado)
    : undefined;

  const {
    calcularDisponibles,
    colasEspera,
    tieneReservaActiva,
    obtenerPosicionUsuarioEnEspera,
    registrarReciente,
  } = useBiblioteca();

  useEffect(() => {
    if (libro) {
      registrarReciente(libro);
    }
  }, [libro, registrarReciente]);

  if (!formatoValido || !libro) {
    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ title: 'Libro no encontrado' }} />
        <EstadoError
          mensaje={
            !formatoValido
              ? `El código "${isbnNormalizado}" no es un ISBN válido de 13 dígitos.`
              : `No encontramos ningún libro registrado con el ISBN ${isbnNormalizado}.`
          }
          textoBoton="Volver al Catálogo"
          onAccion={() => router.replace('/')}
        />
      </View>
    );
  }

  const disponibles = calcularDisponibles(libro);
  const enEspera = colasEspera[libro.isbn]?.tamanio ?? 0;
  const yaReservado = tieneReservaActiva(libro.isbn);
  const posicionUsuario = obtenerPosicionUsuarioEnEspera(libro.isbn);

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <Stack.Screen options={{ title: libro.titulo }} />

      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>{libro.titulo}</Text>
        <Text style={styles.autor}>{libro.autor}</Text>

        <View style={styles.separador} />

        <View style={styles.filaDato}>
          <Text style={styles.etiqueta}>Año de publicación</Text>
          <Text style={styles.valor}>{libro.anio}</Text>
        </View>

        <View style={styles.filaDato}>
          <Text style={styles.etiqueta}>ISBN</Text>
          <Text style={styles.valor}>{libro.isbn}</Text>
        </View>

        <View style={styles.filaDato}>
          <Text style={styles.etiqueta}>Ejemplares disponibles</Text>
          <Text
            style={[
              styles.valor,
              disponibles > 0 ? styles.textoExito : styles.textoAdvertencia,
            ]}
          >
            {disponibles} de {libro.ejemplares}
          </Text>
        </View>

        <View style={styles.filaDato}>
          <Text style={styles.etiqueta}>Personas en lista de espera</Text>
          <Text style={styles.valor}>{enEspera}</Text>
        </View>
      </View>

      {yaReservado ? (
        <View style={styles.avisoReservado}>
          <Text style={styles.textoAvisoReservado}>
            {posicionUsuario !== null
              ? `Ya estás anotado en la lista de espera (posición #${posicionUsuario}).`
              : 'Ya tenés un préstamo activo de este libro.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver mis reservas"
            onPress={() => router.push('/reservas')}
            style={styles.botonSecundario}
          >
            <Text style={styles.textoBotonSecundario}>Ir a Mis reservas</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            disponibles > 0
              ? `Reservar ${libro.titulo}`
              : `Anotarme en lista de espera para ${libro.titulo}`
          }
          onPress={() => router.push(`/reservar/${libro.isbn}`)}
          style={({ pressed }) => [
            styles.botonReservar,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonReservar}>
            {disponibles > 0 ? 'Reservar' : 'Anotarme en lista de espera'}
          </Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: ESPACIADO.md,
    gap: ESPACIADO.lg,
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.lg,
    borderWidth: 1,
    borderColor: COLORES.borde,
    gap: ESPACIADO.sm,
  },
  titulo: {
    fontSize: FUENTES.titulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autor: {
    fontSize: FUENTES.subtitulo,
    color: COLORES.textoSecundario,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: ESPACIADO.sm,
  },
  filaDato: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: ESPACIADO.xs,
  },
  etiqueta: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
  },
  valor: {
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
    color: COLORES.texto,
  },
  textoExito: {
    color: COLORES.exito,
  },
  textoAdvertencia: {
    color: COLORES.advertencia,
  },
  botonReservar: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBotonReservar: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
  avisoReservado: {
    backgroundColor: COLORES.acento,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.md,
    gap: ESPACIADO.md,
  },
  textoAvisoReservado: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.primario,
    fontWeight: '600',
  },
  botonSecundario: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.primario,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.sm,
  },
  textoBotonSecundario: {
    color: COLORES.primario,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
});