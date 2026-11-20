import {
    CameraView,
    type BarcodeScanningResult,
} from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { EstadoCarga } from '../components/EstadoCarga';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';
import { LIBROS } from '../data/libros';
import { usePermisoCamara } from '../hooks/usePermiso';

const REGEX_ISBN_13 = /^\d{13}$/;

export default function EscanearScreen() {
  const { estado, solicitar, abrirAjustes } = usePermisoCamara();
  const [isbnManual, setIsbnManual] = useState<string>('');
  const [avisoEscaneo, setAvisoEscaneo] = useState<string | null>(null);

  const navegacionEnCursoRef = useRef<boolean>(false);
  const ultimoIsbnInexistenteRef = useRef<string | null>(null);

  const manejarCodigoDetectado = (resultado: BarcodeScanningResult) => {
    if (navegacionEnCursoRef.current) return;

    const codigoLimpio = resultado.data.trim();
    if (!REGEX_ISBN_13.test(codigoLimpio)) return;

    const libroEncontrado = LIBROS.find((item) => item.isbn === codigoLimpio);

    if (libroEncontrado) {
      navegacionEnCursoRef.current = true;
      router.replace(`/libro/${libroEncontrado.isbn}`);
      return;
    }

    if (ultimoIsbnInexistenteRef.current !== codigoLimpio) {
      ultimoIsbnInexistenteRef.current = codigoLimpio;
      setAvisoEscaneo(
        `El código ${codigoLimpio} no pertenece a ningún libro del catálogo. Podés seguir escaneando.`,
      );
    }
  };

  const buscarManualmente = () => {
    const limpio = isbnManual.trim();
    if (!REGEX_ISBN_13.test(limpio)) {
      setAvisoEscaneo('Ingresá un ISBN válido de exactamente 13 dígitos.');
      return;
    }
    router.replace(`/libro/${limpio}`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.bloqueCamara}>
          {estado === 'cargando' && (
            <EstadoCarga mensaje="Comprobando permiso de cámara..." />
          )}

          {estado === 'concedido' && (
            <View style={styles.contenedorVisor}>
              <CameraView
                style={styles.visor}
                facing="back"
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13'],
                }}
                onBarcodeScanned={manejarCodigoDetectado}
              />
              <Text style={styles.ayudaVisor}>
                Apuntá la cámara al código de barras EAN-13 del libro
              </Text>
            </View>
          )}

          {estado === 'preguntable' && (
            <View style={styles.estadoPermisoBox}>
              <Text style={styles.tituloEstado}>Cámara no habilitada</Text>
              <Text style={styles.textoEstado}>
                Necesitamos permiso de cámara para leer el código de barras de
                la contratapa.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Permitir acceso a la cámara"
                onPress={() => void solicitar()}
                style={styles.botonPrimario}
              >
                <Text style={styles.textoBotonPrimario}>Permitir cámara</Text>
              </Pressable>
            </View>
          )}

          {estado === 'bloqueado' && (
            <View style={styles.estadoPermisoBox}>
              <Text style={styles.tituloEstado}>Cámara bloqueada</Text>
              <Text style={styles.textoEstado}>
                El permiso fue denegado permanentemente. Podés habilitarlo en
                Ajustes o escribir el ISBN abajo.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Abrir Ajustes para habilitar la cámara"
                onPress={() => void abrirAjustes()}
                style={styles.botonPrimario}
              >
                <Text style={styles.textoBotonPrimario}>Abrir Ajustes</Text>
              </Pressable>
            </View>
          )}
        </View>

        {avisoEscaneo && (
          <View style={styles.alerta}>
            <Text style={styles.textoAlerta}>{avisoEscaneo}</Text>
          </View>
        )}

        <View style={styles.tarjetaManual}>
          <Text style={styles.tituloManual}>Ingresar ISBN manualmente</Text>
          <TextInput
            style={styles.input}
            value={isbnManual}
            onChangeText={(texto) => {
              setIsbnManual(texto);
              if (avisoEscaneo) setAvisoEscaneo(null);
            }}
            placeholder="Ej: 9789500426404"
            placeholderTextColor={COLORES.textoSecundario}
            keyboardType="number-pad"
            maxLength={13}
            accessibilityLabel="Ingresar ISBN de 13 dígitos manualmente"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar libro por ISBN ingresado"
            onPress={buscarManualmente}
            style={({ pressed }) => [
              styles.botonSecundario,
              pressed && styles.botonPresionado,
            ]}
          >
            <Text style={styles.textoBotonSecundario}>Buscar ISBN</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  contenido: {
    padding: ESPACIADO.md,
    gap: ESPACIADO.md,
  },
  bloqueCamara: {
    minHeight: 280,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  contenedorVisor: {
    height: 300,
  },
  visor: {
    flex: 1,
  },
  ayudaVisor: {
    padding: ESPACIADO.sm,
    textAlign: 'center',
    fontSize: FUENTES.pequeno,
    color: COLORES.texto,
    backgroundColor: COLORES.superficie,
  },
  estadoPermisoBox: {
    padding: ESPACIADO.lg,
    alignItems: 'center',
    gap: ESPACIADO.md,
  },
  tituloEstado: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
    color: COLORES.texto,
    textAlign: 'center',
  },
  textoEstado: {
    fontSize: FUENTES.cuerpo,
    color: COLORES.textoSecundario,
    textAlign: 'center',
  },
  alerta: {
    backgroundColor: COLORES.advertenciaFondo,
    padding: ESPACIADO.md,
    borderRadius: RADIOS.md,
  },
  textoAlerta: {
    color: COLORES.advertencia,
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
  },
  tarjetaManual: {
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    gap: ESPACIADO.sm,
  },
  tituloManual: {
    fontSize: FUENTES.subtitulo,
    fontWeight: '700',
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
  botonPrimario: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.primario,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoBotonPrimario: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
  botonSecundario: {
    minHeight: TACTIL_MINIMO,
    backgroundColor: COLORES.acento,
    borderRadius: RADIOS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonPresionado: {
    opacity: 0.85,
  },
  textoBotonSecundario: {
    color: COLORES.primario,
    fontSize: FUENTES.cuerpo,
    fontWeight: '700',
  },
});