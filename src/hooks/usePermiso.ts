import { useCameraPermissions } from 'expo-camera';
import { useCallback, useEffect } from 'react';
import { AppState, Linking } from 'react-native';

export type EstadoPermiso =
    | 'cargando'
    | 'concedido'
    | 'preguntable'
    | 'bloqueado';

export function usePermisoCamara() {
    const [permiso, solicitarPermiso, obtenerPermiso] = useCameraPermissions();

    useEffect(() => {
        const suscripcion = AppState.addEventListener('change', (estadoApp) => {
            if (estadoApp === 'active') {
                void obtenerPermiso();
            }
        });
        return () => {
            suscripcion.remove();
        };
    }, [obtenerPermiso]);

    let estado: EstadoPermiso = 'cargando';
    if (permiso !== null) {
        if (permiso.granted) {
            estado = 'concedido';
        } else if (permiso.canAskAgain) {
            estado = 'preguntable';
        } else {
            estado = 'bloqueado';
        }
    }

    const solicitar = useCallback(async (): Promise<boolean> => {
        const respuesta = await solicitarPermiso();
        return respuesta.granted;
    }, [solicitarPermiso]);

    const abrirAjustes = useCallback(async (): Promise<void> => {
        await Linking.openSettings();
    }, []);

    return {
        estado,
        permiso,
        solicitar,
        abrirAjustes,
        refrescar: obtenerPermiso,
    };
}