export type Libro = {
    isbn: string; // 13 dígitos, sin guiones
    titulo: string;
    autor: string;
    anio: number;
    ejemplares: number; // ejemplares en el estante al iniciar la app
};

export type Prestamo = {
    id: string;
    libro: Libro;
    fechaDevolucion: string;
    recordatorioId: string | null;
};

export type ReservaEspera = {
    id: string;
    isbn: string;
    nombre: string;
    esUsuarioActual: boolean;
};

export type SesionPersonal = {
    usuario: string;
};

export type RecursoPermiso = 'camara' | 'notificaciones';