import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { COLORES } from '../constants/tema';

export const CANAL_PRESTAMOS = 'prestamos';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export async function configurarCanalPrestamos(): Promise<void> {
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync(CANAL_PRESTAMOS, {
            name: 'Recordatorios de préstamos',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: COLORES.primario,
        });
    }
}

export async function consultarPermisoNotificaciones(): Promise<Notifications.PermissionResponse> {
    return Notifications.getPermissionsAsync();
}

export async function solicitarPermisoNotificaciones(): Promise<boolean> {
    await configurarCanalPrestamos();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.granted) {
        return true;
    }
    const solicitado = await Notifications.requestPermissionsAsync();
    return solicitado.granted;
}

export async function programarRecordatorioDevolucion(
    tituloLibro: string,
    fechaDevolucion: string,
): Promise<string> {
    await configurarCanalPrestamos();
    return Notifications.scheduleNotificationAsync({
        content: {
            title: 'Recordatorio de devolución - Biblioteca IPF',
            body: `Recordá devolver "${tituloLibro}" antes del ${fechaDevolucion}.`,
            data: { ruta: '/reservas' },
        },
        trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 15,
            repeats: false,
            channelId: Platform.OS === 'android' ? CANAL_PRESTAMOS : undefined,
        },
    });
}

export async function notificarEjemplarDisponible(
    tituloLibro: string,
): Promise<void> {
    await configurarCanalPrestamos();
    await Notifications.scheduleNotificationAsync({
        content: {
            title: '¡Tu libro ya está disponible! - Biblioteca IPF',
            body: `Se liberó un ejemplar de "${tituloLibro}". Ya figura en tus préstamos.`,
            data: { ruta: '/reservas' },
        },
        trigger: null,
    });
}

export async function cancelarRecordatorio(
    identificador: string | null,
): Promise<void> {
    if (!identificador) return;
    await Notifications.cancelScheduledNotificationAsync(identificador);
}