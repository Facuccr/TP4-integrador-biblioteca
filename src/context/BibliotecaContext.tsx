import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { LIBROS } from '../data/libros';
import { Cola } from '../estructuras/Cola';
import { Pila } from '../estructuras/Pila';
import {
    cancelarRecordatorio,
    consultarPermisoNotificaciones,
    notificarEjemplarDisponible,
    programarRecordatorioDevolucion,
    solicitarPermisoNotificaciones,
} from '../lib/notificaciones';
import type { Libro, Prestamo, ReservaEspera, SesionPersonal } from '../types';

export type AvisoInterno = {
  id: string;
  mensaje: string;
  fecha: string;
};

type ResultadoReserva =
  | { tipo: 'prestamo'; prestamo: Prestamo }
  | { tipo: 'espera'; posicion: number }
  | { tipo: 'duplicado' };

type ResultadoAlternarRecordatorio =
  | { ok: true; activo: boolean }
  | { ok: false; motivo: 'permiso_denegado' | 'no_encontrado' };

type BibliotecaContextValue = {
  prestamos: Prestamo[];
  colasEspera: Record<string, Cola<ReservaEspera>>;
  recientes: Libro[];
  sesion: SesionPersonal | null;
  avisos: AvisoInterno[];
  calcularDisponibles: (libro: Libro) => number;
  tieneReservaActiva: (isbn: string) => boolean;
  obtenerPosicionUsuarioEnEspera: (isbn: string) => number | null;
  registrarReciente: (libro: Libro) => void;
  reservarLibro: (libro: Libro) => ResultadoReserva;
  devolverPrestamo: (prestamoId: string) => Promise<void>;
  alternarRecordatorio: (
    prestamoId: string,
  ) => Promise<ResultadoAlternarRecordatorio>;
  entregarAlSiguiente: (
    isbn: string,
  ) => Promise<{ ok: boolean; mensaje: string }>;
  iniciarSesion: (usuario: string, clave: string) => boolean;
  cerrarSesion: () => void;
  descartarAviso: (id: string) => void;
};

const USUARIO_DEMO = 'personal';
const CLAVE_DEMO = 'ipf2026';

function calcularFechaEnSieteDias(): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() + 7);
  return fecha.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function crearColasIniciales(): Record<string, Cola<ReservaEspera>> {
  const colaAlgoritmos = new Cola<ReservaEspera>([
    {
      id: 'esp-init-1',
      isbn: '9780262033848',
      nombre: 'Lucía Fernández',
      esUsuarioActual: false,
    },
    {
      id: 'esp-init-2',
      isbn: '9780262033848',
      nombre: 'Martín Acosta',
      esUsuarioActual: false,
    },
  ]);

  const colaJs = new Cola<ReservaEspera>([
    {
      id: 'esp-init-3',
      isbn: '9781449373320',
      nombre: 'Sofía Ramírez',
      esUsuarioActual: false,
    },
  ]);

  return {
    '9780262033848': colaAlgoritmos,
    '9781449373320': colaJs,
  };
}

const BibliotecaContext = createContext<BibliotecaContextValue | null>(null);

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [colasEspera, setColasEspera] = useState<
    Record<string, Cola<ReservaEspera>>
  >(() => crearColasIniciales());
  const [pilaRecientes, setPilaRecientes] = useState<Pila<Libro>>(
    () => new Pila<Libro>(),
  );
  const [sesion, setSesion] = useState<SesionPersonal | null>(null);
  const [avisos, setAvisos] = useState<AvisoInterno[]>([]);

  const calcularDisponibles = useCallback(
    (libro: Libro): number => {
      const prestados = prestamos.filter(
        (p) => p.libro.isbn === libro.isbn,
      ).length;
      return Math.max(0, libro.ejemplares - prestados);
    },
    [prestamos],
  );

  const tieneReservaActiva = useCallback(
    (isbn: string): boolean => {
      const enPrestamos = prestamos.some((p) => p.libro.isbn === isbn);
      if (enPrestamos) return true;
      const cola = colasEspera[isbn];
      if (!cola) return false;
      return cola.aArray().some((item) => item.esUsuarioActual);
    },
    [prestamos, colasEspera],
  );

  const obtenerPosicionUsuarioEnEspera = useCallback(
    (isbn: string): number | null => {
      const cola = colasEspera[isbn];
      if (!cola) return null;
      const indice = cola.aArray().findIndex((item) => item.esUsuarioActual);
      return indice >= 0 ? indice + 1 : null;
    },
    [colasEspera],
  );

  const registrarReciente = useCallback((libro: Libro) => {
    setPilaRecientes((anterior) => {
      if (anterior.verTope()?.isbn === libro.isbn) {
        return anterior;
      }
      const sinDuplicado = anterior
        .aArray()
        .filter((item) => item.isbn !== libro.isbn);
      const nuevaPila = new Pila<Libro>(sinDuplicado);
      nuevaPila.apilar(libro);
      return nuevaPila;
    });
  }, []);

  const recientes = useMemo(() => {
    return pilaRecientes.aArray().slice(-3).reverse();
  }, [pilaRecientes]);

  const reservarLibro = useCallback(
    (libro: Libro): ResultadoReserva => {
      if (tieneReservaActiva(libro.isbn)) {
        return { tipo: 'duplicado' };
      }

      const disponibles = calcularDisponibles(libro);
      if (disponibles > 0) {
        const nuevoPrestamo: Prestamo = {
          id: `prestamo-${Date.now()}`,
          libro,
          fechaDevolucion: calcularFechaEnSieteDias(),
          recordatorioId: null,
        };
        setPrestamos((prev) => [nuevoPrestamo, ...prev]);
        return { tipo: 'prestamo', prestamo: nuevoPrestamo };
      }

      const colaActual = colasEspera[libro.isbn] ?? new Cola<ReservaEspera>();
      const nuevaCola = new Cola<ReservaEspera>(colaActual.aArray());
      nuevaCola.encolar({
        id: `espera-${Date.now()}`,
        isbn: libro.isbn,
        nombre: 'Vos (Alumno IPF)',
        esUsuarioActual: true,
      });

      setColasEspera((prev) => ({
        ...prev,
        [libro.isbn]: nuevaCola,
      }));

      return { tipo: 'espera', posicion: nuevaCola.tamanio };
    },
    [calcularDisponibles, colasEspera, tieneReservaActiva],
  );

  const devolverPrestamo = useCallback(
    async (prestamoId: string): Promise<void> => {
      const encontrado = prestamos.find((p) => p.id === prestamoId);
      if (!encontrado) return;

      if (encontrado.recordatorioId) {
        await cancelarRecordatorio(encontrado.recordatorioId);
      }

      setPrestamos((prev) => prev.filter((p) => p.id !== prestamoId));
    },
    [prestamos],
  );

  const alternarRecordatorio = useCallback(
    async (prestamoId: string): Promise<ResultadoAlternarRecordatorio> => {
      const encontrado = prestamos.find((p) => p.id === prestamoId);
      if (!encontrado) {
        return { ok: false, motivo: 'no_encontrado' };
      }

      if (encontrado.recordatorioId) {
        await cancelarRecordatorio(encontrado.recordatorioId);
        setPrestamos((prev) =>
          prev.map((p) =>
            p.id === prestamoId ? { ...p, recordatorioId: null } : p,
          ),
        );
        return { ok: true, activo: false };
      }

      const concedido = await solicitarPermisoNotificaciones();
      if (!concedido) {
        return { ok: false, motivo: 'permiso_denegado' };
      }

      const nuevoId = await programarRecordatorioDevolucion(
        encontrado.libro.titulo,
        encontrado.fechaDevolucion,
      );

      setPrestamos((prev) =>
        prev.map((p) =>
          p.id === prestamoId ? { ...p, recordatorioId: nuevoId } : p,
        ),
      );

      return { ok: true, activo: true };
    },
    [prestamos],
  );

  const entregarAlSiguiente = useCallback(
    async (isbn: string): Promise<{ ok: boolean; mensaje: string }> => {
      const colaActual = colasEspera[isbn];
      if (!colaActual || colaActual.tamanio === 0) {
        return {
          ok: false,
          mensaje: 'No hay personas en la lista de espera para este libro.',
        };
      }

      const nuevaCola = new Cola<ReservaEspera>(colaActual.aArray());
      const siguiente = nuevaCola.desencolar();

      setColasEspera((prev) => ({
        ...prev,
        [isbn]: nuevaCola,
      }));

      if (!siguiente) {
        return {
          ok: false,
          mensaje: 'No hay personas en la lista de espera para este libro.',
        };
      }

      const libro = LIBROS.find((l) => l.isbn === isbn);
      const tituloLibro = libro ? libro.titulo : `ISBN ${isbn}`;

      if (siguiente.esUsuarioActual && libro) {
        const nuevoPrestamo: Prestamo = {
          id: `prestamo-${Date.now()}`,
          libro: { ...libro, ejemplares: Math.max(1, libro.ejemplares) },
          fechaDevolucion: calcularFechaEnSieteDias(),
          recordatorioId: null,
        };
        setPrestamos((prev) => [nuevoPrestamo, ...prev]);

        const estadoPermiso = await consultarPermisoNotificaciones();
        if (estadoPermiso.granted) {
          await notificarEjemplarDisponible(tituloLibro);
        } else {
          setAvisos((prev) => [
            {
              id: `aviso-${Date.now()}`,
              mensaje: `¡Buenas noticias! Se te asignó "${tituloLibro}" desde la lista de espera.`,
              fecha: new Date().toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit',
              }),
            },
            ...prev,
          ]);
        }
      }

      return {
        ok: true,
        mensaje: `Se entregó "${tituloLibro}" a ${siguiente.nombre}.`,
      };
    },
    [colasEspera],
  );

  const iniciarSesion = useCallback((usuario: string, clave: string): boolean => {
    if (usuario.trim() === USUARIO_DEMO && clave === CLAVE_DEMO) {
      setSesion({ usuario: usuario.trim() });
      return true;
    }
    return false;
  }, []);

  const cerrarSesion = useCallback(() => {
    setSesion(null);
  }, []);

  const descartarAviso = useCallback((id: string) => {
    setAvisos((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const value = useMemo<BibliotecaContextValue>(
    () => ({
      prestamos,
      colasEspera,
      recientes,
      sesion,
      avisos,
      calcularDisponibles,
      tieneReservaActiva,
      obtenerPosicionUsuarioEnEspera,
      registrarReciente,
      reservarLibro,
      devolverPrestamo,
      alternarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      descartarAviso,
    }),
    [
      prestamos,
      colasEspera,
      recientes,
      sesion,
      avisos,
      calcularDisponibles,
      tieneReservaActiva,
      obtenerPosicionUsuarioEnEspera,
      registrarReciente,
      reservarLibro,
      devolverPrestamo,
      alternarRecordatorio,
      entregarAlSiguiente,
      iniciarSesion,
      cerrarSesion,
      descartarAviso,
    ],
  );

  return (
    <BibliotecaContext.Provider value={value}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca(): BibliotecaContextValue {
  const contexto = useContext(BibliotecaContext);
  if (!contexto) {
    throw new Error(
      'useBiblioteca debe utilizarse dentro de un BibliotecaProvider.',
    );
  }
  return contexto;
}