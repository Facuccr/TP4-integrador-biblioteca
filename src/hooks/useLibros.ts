import { useCallback, useEffect, useState } from 'react';
import { obtenerLibros } from '../lib/api';
import type { Libro } from '../types';

export function useLibros() {
    const [libros, setLibros] = useState<Libro[]>([]);
    const [cargando, setCargando] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [intento, setIntento] = useState<number>(0);

    const reintentar = useCallback(() => {
        setIntento((prev) => prev + 1);
    }, []);

    useEffect(() => {
        let vigente = true;

        const cargar = async () => {
            setCargando(true);
            setError(null);
            try {
                const datos = await obtenerLibros();
                if (vigente) {
                    setLibros(datos);
                }
            } catch {
                if (vigente) {
                    setError(
                        'No se pudo cargar el catálogo. Revisá tu conexión e intentá nuevamente.',
                    );
                }
            } finally {
                if (vigente) {
                    setCargando(false);
                }
            }
        };

        void cargar();

        return () => {
            vigente = false;
        };
    }, [intento]);

    return { libros, cargando, error, reintentar };
}