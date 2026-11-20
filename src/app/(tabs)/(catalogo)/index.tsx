import { Ionicons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import { EstadoCarga } from '../../../components/EstadoCarga';
import { EstadoError } from '../../../components/EstadoError';
import { EstadoVacio } from '../../../components/EstadoVacio';
import { LibroCard } from '../../../components/LibroCard';
import {
    COLORES,
    ESPACIADO,
    FUENTES,
    RADIOS,
    TACTIL_MINIMO,
} from '../../../constants/tema';
import { useBiblioteca } from '../../../context/BibliotecaContext';
import { useLibros } from '../../../hooks/useLibros';

export default function CatalogoScreen() {
  const { libros, cargando, error, reintentar } = useLibros();
  const { recientes, colasEspera, sesion, calcularDisponibles } = useBiblioteca();

  return (
    <View style={styles.contenedor}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                sesion ? 'Ir al mostrador del personal' : 'Acceso del personal'
              }
              onPress={() => router.push(sesion ? '/mostrador' : '/login')}
              style={styles.botonHeader}
            >
              <Ionicons
                name="person-circle-outline"
                size={22}
                color={COLORES.textoClaro}
              />
              <Text style={styles.textoHeader}>
                {sesion ? 'Mostrador' : 'Personal'}
              </Text>
            </Pressable>
          ),
        }}
      />

      <View style={styles.barraAcciones}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Buscar libros por título o autor"
          onPress={() => router.push('/buscar')}
          style={styles.botonAccion}
        >
          <Ionicons name="search-outline" size={20} color={COLORES.primario} />
          <Text style={styles.textoAccion}>Buscar</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Escanear código de barras ISBN"
          onPress={() => router.push('/permisos/camara')}
          style={styles.botonAccion}
        >
          <Ionicons name="barcode-outline" size={20} color={COLORES.primario} />
          <Text style={styles.textoAccion}>Escanear</Text>
        </Pressable>
      </View>

      {recientes.length > 0 && (
        <View style={styles.seccionRecientes}>
          <Text style={styles.tituloSeccion}>Vistos recientemente</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listaRecientes}
          >
            {recientes.map((libro) => (
              <Pressable
                key={libro.isbn}
                accessibilityRole="button"
                accessibilityLabel={`Abrir visto recientemente: ${libro.titulo}`}
                onPress={() => router.push(`/libro/${libro.isbn}`)}
                style={styles.chipReciente}
              >
                <Text style={styles.tituloReciente} numberOfLines={1}>
                  {libro.titulo}
                </Text>
                <Text style={styles.autorReciente} numberOfLines={1}>
                  {libro.autor}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {cargando ? (
        <EstadoCarga mensaje="Cargando catálogo de la biblioteca..." />
      ) : error ? (
        <EstadoError mensaje={error} onAccion={reintentar} />
      ) : (
        <FlatList
          data={libros}
          keyExtractor={(item) => item.isbn}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <EstadoVacio mensaje="No hay libros cargados en el catálogo." />
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
  botonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ESPACIADO.xs,
    minHeight: TACTIL_MINIMO,
    paddingHorizontal: ESPACIADO.sm,
    justifyContent: 'center',
  },
  textoHeader: {
    color: COLORES.textoClaro,
    fontSize: FUENTES.pequeno,
    fontWeight: '600',
  },
  barraAcciones: {
    flexDirection: 'row',
    padding: ESPACIADO.md,
    gap: ESPACIADO.md,
    backgroundColor: COLORES.superficie,
    borderBottomWidth: 1,
    borderBottomColor: COLORES.borde,
  },
  botonAccion: {
    flex: 1,
    minHeight: TACTIL_MINIMO,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: ESPACIADO.sm,
    backgroundColor: COLORES.acento,
    borderRadius: RADIOS.md,
    paddingHorizontal: ESPACIADO.md,
  },
  textoAccion: {
    color: COLORES.primario,
    fontSize: FUENTES.cuerpo,
    fontWeight: '600',
  },
  seccionRecientes: {
    paddingTop: ESPACIADO.md,
    paddingHorizontal: ESPACIADO.md,
    gap: ESPACIADO.sm,
  },
  tituloSeccion: {
    fontSize: FUENTES.pequeno,
    fontWeight: '700',
    color: COLORES.textoSecundario,
    textTransform: 'uppercase',
  },
  listaRecientes: {
    gap: ESPACIADO.sm,
    paddingBottom: ESPACIADO.xs,
  },
  chipReciente: {
    minHeight: TACTIL_MINIMO,
    width: 170,
    backgroundColor: COLORES.superficie,
    borderRadius: RADIOS.md,
    padding: ESPACIADO.sm,
    borderWidth: 1,
    borderColor: COLORES.borde,
    justifyContent: 'center',
  },
  tituloReciente: {
    fontSize: FUENTES.pequeno,
    fontWeight: '700',
    color: COLORES.texto,
  },
  autorReciente: {
    fontSize: FUENTES.etiqueta,
    color: COLORES.textoSecundario,
  },
  lista: {
    padding: ESPACIADO.md,
    gap: ESPACIADO.md,
  },
});