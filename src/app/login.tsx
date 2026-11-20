import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';

export default function LoginScreen() {
  const { iniciarSesion } = useBiblioteca();
  const [usuario, setUsuario] = useState<string>('');
  const [clave, setClave] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const manejarIngreso = () => {
    if (usuario.trim().length === 0 || clave.length === 0) {
      setError('Completá tu usuario y clave para ingresar.');
      return;
    }

    const ok = iniciarSesion(usuario, clave);
    if (!ok) {
      setError('Usuario o clave incorrectos. Verificá los datos de acceso.');
      return;
    }

    setError(null);
    router.replace('/mostrador');
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.tarjeta}>
        <View style={styles.encabezado}>
          <Ionicons
            name="shield-checkmark-outline"
            size={40}
            color={COLORES.primario}
          />
          <Text style={styles.titulo}>Acceso del personal</Text>
          <Text style={styles.subtitulo}>
            Credenciales de demostración: usuario "personal" y clave "ipf2026".
          </Text>
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Usuario</Text>
          <TextInput
            style={styles.input}
            value={usuario}
            onChangeText={(texto) => {
              setUsuario(texto);
              if (error) setError(null);
            }}
            placeholder="Ingresá tu usuario"
            placeholderTextColor={COLORES.textoSecundario}
            autoCapitalize="none"
            autoCorrect={false}
            accessibilityLabel="Usuario del personal"
          />
        </View>

        <View style={styles.campo}>
          <Text style={styles.etiqueta}>Clave</Text>
          <TextInput
            style={styles.input}
            value={clave}
            onChangeText={(texto) => {
              setClave(texto);
              if (error) setError(null);
            }}
            placeholder="Ingresá tu clave"
            placeholderTextColor={COLORES.textoSecundario}
            secureTextEntry
            accessibilityLabel="Clave del personal"
          />
        </View>

        {error && (
          <View style={styles.alertaError}>
            <Text style={styles.textoError}>{error}</Text>
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar sesión en el mostrador"
          onPress={manejarIngreso}
          style={({ pressed }) => [
            styles.botonIngresar,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonIngresar}>Ingresar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancelar e ir atrás"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.botonCancelar,
            pressed && styles.botonPresionado,
          ]}
        >
          <Text style={styles.textoBotonCancelar}>Cancelar</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
    padding: ESPACIADO.md,
    justifyContent: 'center',
  },
  tarjeta: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.lg,
    borderWidth: 1,
    borderColor: COLORES.borde,
    gap: ESPACIADO.md,
  },
  encabezado: {
    alignItems: 'center',
    gap: ESPACIADO.xs,
    marginBottom: ESPACIADO.xs,
  },
  titulo: {
    fontSize: FUENTES.titulo,
    fontWeight: '700',
    color: COLORES.texto,
  },
  subtitulo: {
    fontSize: FUENTES.pequeno,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  campo: {
    gap: ESPACIADO.xs,
  },
  etiqueta: {
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
    color: COLORES.texto,
  },
  input: {
    minHeight: TACTIL_MINIMO,
    borderWidth: 1,
    borderColor: COLORES.borde,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.md,
    fontSize: FUENTES.cuerpo,
    color: COLORES.texto,
    backgroundColor: COLORES.fondo,
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
  botonIngresar: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: ESPACIADO.md,
  },
  textoBotonIngresar: {
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
    paddingVertical: ESPACIADO.sm,
  },
  textoBotonCancelar: {
    color: COLORES.texto,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
  botonPresionado: {
    opacity: 0.85,
  },
});