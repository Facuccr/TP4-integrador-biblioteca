import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EstadoError } from '../../components/EstadoError';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { LIBROS } from '../../data/libros';

const REGEX_ISBN_13 = /^\d{13}$/;

export default function ReservarModalScreen() {
  const { isbn } = useLocalSearchParams<{ isbn?: string | string[] }>();
  const isbnNormalizado = Array.isArray(isbn) ? (isbn[0] ?? '') : (isbn ?? '');
  const formatoValido = REGEX_ISBN_13.test(isbnNormalizado);
  const libro = formatoValido
    ? LIBROS.find((item) => item.isbn === isbnNormalizado)
    : undefined;

  const {
    calcularDisponibles,
    colasEspera,
    tieneReservaActiva,
    reservarLibro,
  } = useBiblioteca();

  const [mensajeError, setMensajeError] = useState<string | null>(null);

  if (!formatoValido || !libro) {
    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ title: 'Reserva inválida' }} />
        <EstadoError
          mensaje="El libro seleccionado no es válido o no existe en el catálogo."
          textoBoton="Cerrar"
          onAccion={() => router.back()}
        />
      </View>
    );
  }

  const disponibles = calcularDisponibles(libro);
  const enEspera = colasEspera[libro.isbn]?.tamanio ?? 0;
  const yaReservado = tieneReservaActiva(libro.isbn);

  const confirmarReserva = () => {
    const resultado = reservarLibro(libro);
    if (resultado.tipo === 'duplicado') {
      setMensajeError('Ya tenés una reserva o préstamo activo para este libro.');
      return;
    }

    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/reservas');
  };

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ title: 'Confirmar reserva' }} />

      <View style={styles.tarjeta}>
        <Text style={styles.titulo}>{libro.titulo}</Text>
        <Text style={styles.autor}>
          {libro.autor} · {libro.anio}
        </Text>

        <View style={styles.separador} />

        {disponibles > 0 ? (
          <View style={styles.bloqueInfo}>
            <Text style={styles.estadoDisponible}>
              Ejemplar disponible en estante
            </Text>
            <Text style={styles.descripcion}>
              Al confirmar, se registrará un préstamo inmediato por 7 días.
            </Text>
          </View>
        ) : (
          <View style={styles.bloqueInfo}>
            <Text style={styles.estadoEspera}>
              Sin ejemplares disponibles por el momento
            </Text>
            <Text style={styles.descripcion}>
              Ingresarás a la lista de espera en la posición #{enEspera + 1}.
            </Text>
          </View>
        )}
      </View>

      {mensajeError && (
        <View style={styles.alertaError}>
          <Text style={styles.textoError}>{mensajeError}</Text>
        </View>
      )}

      <View style={styles.acciones}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Confirmar reserva"
          disabled={yaReservado}
          onPress={confirmarReserva}
          style={({ pressed }) => [
            styles.botonConfirmar,
            yaReservado && styles.botonDeshabilitado,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoConfirmar}>
            {yaReservado ? 'Ya reservado' : 'Confirmar'}
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar y volver"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.botonCancelar,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADO.md,
    justifyContent: 'space-between',
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
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
  },
  separador: {
    height: 1,
    backgroundColor: COLORES.borde,
    marginVertical: ESPACIADO.sm,
  },
  bloqueInfo: {
    gap: ESPACIADO.xs,
  },
  estadoDisponible: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.exito,
  },
  estadoEspera: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.advertencia,
  },
  descripcion: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.texto,
    lineHeight: 22,
  },
  alertaError: {
    backgroundColor: COLORES.errorFondo,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
  },
  textoError: {
    color: COLORES.error,
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
  },
  acciones: {
    gap: ESPACIADO.sm,
    paddingBottom: ESPACIADO.md,
  },
  botonConfirmar: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
  },
  botonDeshabilitado: {
    opacity: 0.5,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoConfirmar: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
  botonCancelar: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
  },
  textoCancelar: {
    color: COLORES.texto,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
});