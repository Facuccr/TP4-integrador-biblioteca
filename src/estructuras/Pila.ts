export class Pila<T> {
    #items: T[] = [];

    constructor(iniciales: T[] = []) {
        this.#items = [...iniciales];
    }

    get tamanio(): number {
        return this.#items.length;
    }

    apilar(item: T): void {
        this.#items.push(item);
    }

    desapilar(): T | undefined {
        return this.#items.pop();
    }

    verTope(): T | undefined {
        return this.#items[this.#items.length - 1];
    }

    aArray(): T[] {
        return [...this.#items];
    }
}