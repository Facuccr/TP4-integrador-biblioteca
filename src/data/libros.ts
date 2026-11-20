import type { Libro } from '../types';

export const LIBROS: Libro[] = [
    // REEMPLAZAR ESTOS 2 PRIMEROS CON DOS LIBROS FÍSICOS QUE TENGAS A MANO
    {
        isbn: '9789500426404',
        titulo: 'Ficciones',
        autor: 'Jorge Luis Borges',
        anio: 1944,
        ejemplares: 3,
    },
    {
        isbn: '9788437604947',
        titulo: 'Cien años de soledad',
        autor: 'Gabriel García Márquez',
        anio: 1967,
        ejemplares: 2,
    },
    // LIBROS CON EJEMPLARES DISPONIBLES
    {
        isbn: '9789500722261',
        titulo: 'El Aleph',
        autor: 'Jorge Luis Borges',
        anio: 1949,
        ejemplares: 2,
    },
    {
        isbn: '9788497592208',
        titulo: 'Rayuela',
        autor: 'Julio Cortázar',
        anio: 1963,
        ejemplares: 1,
    },
    {
        isbn: '9789875666474',
        titulo: 'El túnel',
        autor: 'Ernesto Sabato',
        anio: 1948,
        ejemplares: 4,
    },
    {
        isbn: '9788420674209',
        titulo: 'La invención de Morel',
        autor: 'Adolfo Bioy Casares',
        anio: 1940,
        ejemplares: 2,
    },
    {
        isbn: '9780132350884',
        titulo: 'Clean Code',
        autor: 'Robert C. Martin',
        anio: 2008,
        ejemplares: 3,
    },
    {
        isbn: '9780201616224',
        titulo: 'The Pragmatic Programmer',
        autor: 'Andrew Hunt y David Thomas',
        anio: 1999,
        ejemplares: 1,
    },
    {
        isbn: '9781491950296',
        titulo: 'Designing Data-Intensive Applications',
        autor: 'Martin Kleppmann',
        anio: 2017,
        ejemplares: 2,
    },
    {
        isbn: '9780134685991',
        titulo: 'Effective Java',
        autor: 'Joshua Bloch',
        anio: 2018,
        ejemplares: 2,
    },
    {
        isbn: '9788441543003',
        titulo: 'Patrones de Diseño',
        autor: 'Erich Gamma',
        anio: 1994,
        ejemplares: 1,
    },
    {
        isbn: '9789505153503',
        titulo: 'Martín Fierro',
        autor: 'José Hernández',
        anio: 1872,
        ejemplares: 5,
    },
    // LIBROS CON 0 EJEMPLARES (PARA LISTA DE ESPERA)
    {
        isbn: '9780262033848',
        titulo: 'Introduction to Algorithms',
        autor: 'Thomas H. Cormen',
        anio: 2009,
        ejemplares: 0,
    },
    {
        isbn: '9781449373320',
        titulo: 'JavaScript: The Good Parts',
        autor: 'Douglas Crockford',
        anio: 2008,
        ejemplares: 0,
    },
    {
        isbn: '9788498387087',
        titulo: '1984',
        autor: 'George Orwell',
        anio: 1949,
        ejemplares: 0,
    },
    {
        isbn: '9788445000663',
        titulo: 'El Señor de los Anillos',
        autor: 'J. R. R. Tolkien',
        anio: 1954,
        ejemplares: 0,
    },
];