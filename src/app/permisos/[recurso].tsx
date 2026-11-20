import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { EstadoCarga } from '../../components/EstadoCarga';
import { EstadoError } from '../../components/EstadoError';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../../constants/tema';
import { usePermisoCamara } from '../../hooks/usePermiso';
import { solicitarPermisoNotificaciones } from '../../lib/notificaciones';

export default function PermisoRecursoModal() {
  const { recurso } = useLocalSearchParams<{ recurso?: string | string[] }>();
  const recursoNormalizado = Array.isArray(recurso)
    ? (recurso[0] ?? '')
    : (recurso ?? '');

  const { estado, solicitar, abrirAjustes } = usePermisoCamara();

  if (
    recursoNormalizado !== 'camara' &&
    recursoNormalizado !== 'notificaciones'
  ) {
    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ title: 'Permiso desconocido' }} />
        <EstadoError
          mensaje="El recurso solicitado no existe en esta aplicación."
          textoBoton="Cerrar"
          onAccion={() => router.back()}
        />
      </View>
    );
  }

  if (recursoNormalizado === 'notificaciones') {
    const manejarNotificaciones = async () => {
      await solicitarPermisoNotificaciones();
      router.back();
    };

    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ title: 'Permiso de notificaciones' }} />
        <View style={styles.contenido}>
          <Ionicons
            name="notifications-outline"
            size={56}
            color={COLORES.primario}
          />
          <Text style={styles.titulo}>Recordatorios de devolución</Text>
          <Text style={styles.beneficio}>
            Usamos tus notificaciones para avisarte antes del vencimiento de
            tus préstamos y cuando se libere un libro que esperás.
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Continuar y habilitar notificaciones"
          onPress={() => void manejarNotificaciones()}
          style={({ pressed }) => [
            styles.botonPrincipal,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonPrincipal}>Continuar</Text>
        </Pressable>
      </View>
    );
  }

  if (estado === 'cargando') {
    return (
      <View style={styles.contenedor}>
        <Stack.Screen options={{ title: 'Permiso de cámara' }} />
        <EstadoCarga mensaje="Verificando estado de la cámara..." />
      </View>
    );
  }

  const estaBloqueado = estado === 'bloqueado';

  const manejarAccionCamara = async () => {
    if (estado === 'concedido') {
      router.replace('/escanear');
      return;
    }
    if (estaBloqueado) {
      await abrirAjustes();
      router.replace('/escanear');
      return;
    }
    await solicitar();
    router.replace('/escanear');
  };

  return (
    <View style={styles.contenedor}>
      <Stack.Screen options={{ title: 'Permiso de cámara' }} />

      <View style={styles.contenido}>
        <Ionicons name="camera-outline" size={56} color={COLORES.primario} />
        <Text style={styles.titulo}>Escáner de códigos ISBN</Text>
        <Text style={styles.beneficio}>
          {estaBloqueado
            ? 'El acceso a la cámara está bloqueado. Habilitalo en Ajustes para escanear códigos de barras o ingresá el ISBN manualmente.'
            : 'Usamos tu cámara para leer el código de barras de los libros y abrir su ficha al instante.'}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          estaBloqueado ? 'Abrir Ajustes del sistema' : 'Continuar al escáner'
        }
        onPress={() => void manejarAccionCamara()}
        style={({ pressed }) => [
          styles.botonPrincipal,
          pressed && styles.botonPresionado,
        ]}
      >
        <Text style={styles.textoBotonPrincipal}>
          {estaBloqueado ? 'Abrir Ajustes' : 'Continuar'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADO.lg,
    justifyContent: 'space-between',
  },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.md,
  },
  titulo: {
    fontSize: FUENTES.titulo,
    fontWeight: '700',
    color: COLORES.texto,
    textAlign: 'center',
  },
  beneficio: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
    lineHeight: 24,
  },
  botonPrincipal: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
    marginBottom: ESPACIADO.md,
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBotonPrincipal: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
});