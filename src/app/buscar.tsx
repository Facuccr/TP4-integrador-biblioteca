import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Pressable,
    StyleSheet,
    TextInput,
    View,
} from 'react-native';
import { EstadoCarga } from '../components/EstadoCarga';
import { EstadoError } from '../components/EstadoError';
import { EstadoVacio } from '../components/EstadoVacio';
import { LibroCard } from '../components/LibroCard';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../constants/tema';
import { useBiblioteca } from '../context/BibliotecaContext';
import { buscarLibros } from '../lib/api';
import type { Libro } from '../types';

export default function BuscarScreen() {
  const { q } = useLocalSearchParams<{ q?: string | string[] }>();
  const consultaUrl = Array.isArray(q) ? (q[0] ?? '') : (q ?? '');

  const [resultados, setResultados] = useState<Libro[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState<number>(0);

  const { calcularDisponibles, colasEspera } = useBiblioteca();

  useEffect(() => {
    let vigente = true;

    const ejecutarBusqueda = async () => {
      setCargando(true);
      setError(null);
      try {
        const datos = await buscarLibros(consultaUrl);
        if (vigente) {
          setResultados(datos);
        }
      } catch {
        if (vigente) {
          setError('No se pudo completar la búsqueda. Intentá nuevamente.');
        }
      } finally {
        if (vigente) {
          setCargando(false);
        }
      }
    };

    void ejecutarBusqueda();

    return () => {
      vigente = false;
    };
  }, [consultaUrl, intento]);

  return (
    <View style={styles.contenedor}>
      <View style={styles.barraBusqueda}>
        <Ionicons
          name="search-outline"
          size={20}
          color={COLORES.textoSecundario}
        />
        <TextInput
          style={styles.input}
          value={consultaUrl}
          onChangeText={(texto) => router.setParams({ q: texto })}
          placeholder="Buscar por título o autor..."
          placeholderTextColor={COLORES.textoSecundario}
          autoFocus
          returnKeyType="search"
          accessibilityLabel="Campo de búsqueda por título o autor"
        />
        {consultaUrl.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Limpiar búsqueda"
            onPress={() => router.setParams({ q: '' })}
            style={styles.botonLimpiar}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={COLORES.textoSecundario}
            />
          </Pressable>
        )}
      </View>

      {cargando ? (
        <EstadoCarga mensaje="Buscando en el catálogo..." />
      ) : error ? (
        <EstadoError
          mensaje={error}
          onAccion={() => setIntento((prev) => prev + 1)}
        />
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.isbn}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <EstadoVacio
              mensaje={`No encontramos resultados para "${consultaUrl}".`}
            />
          }
          renderItem={({ item }) => (
            <LibroCard
              libro={item}
              disponibles={calcularDisponibles(item)}
              enEspera={colasEspera[item.isbn]?.tamanio ?? 0}
              onPress={() => router.push(`/libro/${item.isbn}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: COLORES.fondo,
  },
  barraBusqueda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORES.superficie,
    margin: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.md,
    borderRadius: RADIOS.md,
    borderWidth: 1,
    borderColor: COLORES.borde,
    minHeight: TACTIL_MINIMO,
    gap: ESPACIADO.sm,
  },
  input: {
    flex: 1,
    fontSize: FUENTES.cuerpo,
    color: COLORES.texto,
    minHeight: TACTIL_MINIMO,
  },
  botonLimpiar: {
    minWidth: TACTIL_MINIMO,
    minHeight: TACTIL_MINIMO,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lista: {
    paddingHorizontal: ESPACIADO.md,
    paddingBottom: ESPACIADO.lg,
    gap: ESPACIADO.md,
  },
});