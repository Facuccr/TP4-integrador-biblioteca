import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
    AppState,
    Linking,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { EstadoVacio } from '../../components/EstadoVacio';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../../constants/tema';
import { useBiblioteca } from '../../context/BibliotecaContext';
import { LIBROS } from '../../data/libros';
import { consultarPermisoNotificaciones } from '../../lib/notificaciones';

export default function MisReservasScreen() {
  const {
    prestamos,
    colasEspera,
    avisos,
    devolverPrestamo,
    alternarRecordatorio,
    descartarAviso,
  } = useBiblioteca();

  const [permisoNotifConcedido, setPermisoNotifConcedido] =
    useState<boolean>(false);
  const [puedePreguntarNotif, setPuedePreguntarNotif] = useState<boolean>(true);
  const [avisoPermiso, setAvisoPermiso] = useState<string | null>(null);

  const refrescarPermisoNotificaciones = useCallback(async () => {
    const estado = await consultarPermisoNotificaciones();
    setPermisoNotifConcedido(estado.granted);
    setPuedePreguntarNotif(estado.canAskAgain);
    if (estado.granted) {
      setAvisoPermiso(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refrescarPermisoNotificaciones();
    }, [refrescarPermisoNotificaciones]),
  );

  useEffect(() => {
    const suscripcion = AppState.addEventListener('change', (estadoApp) => {
      if (estadoApp === 'active') {
        void refrescarPermisoNotificaciones();
      }
    });
    return () => {
      suscripcion.remove();
    };
  }, [refrescarPermisoNotificaciones]);

  const misEsperas = Object.entries(colasEspera)
    .map(([isbn, cola]) => {
      const items = cola.aArray();
      const indice = items.findIndex((item) => item.esUsuarioActual);
      if (indice < 0) return null;
      const libro = LIBROS.find((l) => l.isbn === isbn);
      return {
        isbn,
        titulo: libro ? libro.titulo : `Libro ${isbn}`,
        autor: libro ? libro.autor : 'Autor desconocido',
        posicion: indice + 1,
        totalEnCola: items.length,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const manejarCambioRecordatorio = async (prestamoId: string) => {
    const resultado = await alternarRecordatorio(prestamoId);
    await refrescarPermisoNotificaciones();
    if (!resultado.ok && resultado.motivo === 'permiso_denegado') {
      setAvisoPermiso(
        'No se otorgó permiso para notificaciones. Podés habilitarlas en Ajustes del sistema o revisar tus vencimientos aquí mismo.',
      );
    } else {
      setAvisoPermiso(null);
    }
  };

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenido}
    >
      <View style={styles.barraEstadoPermiso}>
        <Ionicons
          name={
            permisoNotifConcedido
              ? 'notifications-outline'
              : 'notifications-off-outline'
          }
          size={20}
          color={
            permisoNotifConcedido ? COLORES.exito : COLORES.textoSecundario
          }
        />
        <Text style={styles.textoEstadoPermiso}>
          {permisoNotifConcedido
            ? 'Notificaciones de recordatorio habilitadas'
            : 'Notificaciones desactivadas (los avisos se muestran aquí)'}
        </Text>
      </View>

      {avisoPermiso && (
        <View style={styles.tarjetaAdvertencia}>
          <Text style={styles.textoAdvertencia}>{avisoPermiso}</Text>
          {!puedePreguntarNotif ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Abrir Ajustes del teléfono"
              onPress={() => void Linking.openSettings()}
              style={styles.botonAjustes}
            >
              <Text style={styles.textoBotonAjustes}>Abrir Ajustes</Text>
            </Pressable>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Ver información sobre permisos de notificaciones"
              onPress={() => router.push('/permisos/notificaciones')}
              style={styles.botonAjustes}
            >
              <Text style={styles.textoBotonAjustes}>¿Para qué se usan?</Text>
            </Pressable>
          )}
        </View>
      )}

      {avisos.length > 0 && (
        <View style={styles.seccion}>
          <Text style={styles.tituloSeccion}>Avisos de la biblioteca</Text>
          {avisos.map((aviso) => (
            <View key={aviso.id} style={styles.tarjetaAviso}>
              <View style={styles.infoAviso}>
                <Text style={styles.textoAviso}>{aviso.mensaje}</Text>
                <Text style={styles.horaAviso}>{aviso.fecha}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Descartar aviso"
                onPress={() => descartarAviso(aviso.id)}
                style={styles.botonCerrarAviso}
              >
                <Ionicons name="close" size={20} color={COLORES.primario} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>
          Préstamos activos ({prestamos.length})
        </Text>
        {prestamos.length === 0 ? (
          <EstadoVacio mensaje="Todavía no tenés libros en préstamo." />
        ) : (
          prestamos.map((prestamo) => {
            const recordatorioActivo = prestamo.recordatorioId !== null;
            return (
              <View key={prestamo.id} style={styles.tarjeta}>
                <Text style={styles.tituloLibro}>{prestamo.libro.titulo}</Text>
                <Text style={styles.autorLibro}>{prestamo.libro.autor}</Text>
                <Text style={styles.fechaDevolucion}>
                  Devolución antes del: {prestamo.fechaDevolucion}
                </Text>

                <View style={styles.filaSwitch}>
                  <Text style={styles.etiquetaSwitch}>
                    Recordarme (demo 15 s)
                  </Text>
                  <Switch
                    accessibilityLabel={`Activar recordatorio para ${prestamo.libro.titulo}`}
                    value={recordatorioActivo}
                    onValueChange={() =>
                      void manejarCambioRecordatorio(prestamo.id)
                    }
                    trackColor={{
                      false: COLORES.borde,
                      true: COLORES.primarioClaro,
                    }}
                    thumbColor={COLORES.superficie}
                  />
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Devolver ${prestamo.libro.titulo}`}
                  onPress={() => void devolverPrestamo(prestamo.id)}
                  style={({ pressed }) => [
                    styles.botonDevolver,
                    pressed && styles.botonPresionado,
                  ]}
                >
                  <Text style={styles.textoBotonDevolver}>Devolver libro</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.seccion}>
        <Text style={styles.tituloSeccion}>
          En lista de espera ({misEsperas.length})
        </Text>
        {misEsperas.length === 0 ? (
          <EstadoVacio mensaje="No estás anotado en ninguna lista de espera." />
        ) : (
          misEsperas.map((espera) => (
            <View key={espera.isbn} style={styles.tarjeta}>
              <Text style={styles.tituloLibro}>{espera.titulo}</Text>
              <Text style={styles.autorLibro}>{espera.autor}</Text>
              <View style={styles.insigniaPosicion}>
                <Text style={styles.textoPosicion}>
                  Posición #{espera.posicion} de {espera.totalEnCola} en espera
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
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
    paddingBottom: ESPACIADO.xl,
  },
  barraEstadoPermiso: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.sm,
    backgroundColor: COLORES.superficie,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
  },
  textoEstadoPermiso: {
    flex: 1,
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
  },
  tarjetaAdvertencia: {
    backgroundColor: COLORES.advertenciaFondo,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
    gap: ESPACIADO.sm,
  },
  textoAdvertencia: {
    fontSize: FUENTES.pequeno,
    color: COLORES.advertencia,
  },
  botonAjustes: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: ESPACIADO.md,
  },
  textoBotonAjustes: {
    color: COLORES.primario,
    fontWeight: '700',
    fontSize: FUENTES.pequeno,
  },
  seccion: {
    gap: ESPACIADO.sm,
  },
  tituloSeccion: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  tarjetaAviso: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.acento,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
    gap: ESPACIADO.sm,
  },
  infoAviso: {
    flex: 1,
    gap: ESPACIADO.xs,
  },
  textoAviso: {
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
    color: COLORES.primario,
  },
  horaAviso: {
    fontSize: FUENTES.etiqueta,
    color: COLORES.textoSecundario,
  },
  botonCerrarAviso: {
    minWidth: TACTIL_MINIMO,
    minHeight: TACTIL_MINIMO,
    justifyContent: 'center',
    alignItems: 'center',
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
  fechaDevolucion: {
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
    color: COLORES.primario,
  },
  filaSwitch: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: TACTIL_MINIMO,
    borderTopWidth: 1,
    borderTopColor: COLORES.borde,
    paddingTop: ESPACIADO.sm,
  },
  etiquetaSwitch: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.texto,
  },
  botonDevolver: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.sm,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBotonDevolver: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
  insigniaPosicion: {
    backgroundColor: COLORES.advertenciaFondo,
    padding: ESPACIADO.sm,
    borderRadius: RADIOS.sm,
  },
  textoPosicion: {
    color: COLORES.advertencia,
    fontWeight: '700',
    fontSize: FUENTES.pequeno,
  },
});