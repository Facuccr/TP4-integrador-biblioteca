export class Cola<T> {
    #items: T[] = [];

    constructor(iniciales: T[] = []) {
        this.#items = [...iniciales];
    }

    get tamanio(): number {
        return this.#items.length;
    }

    encolar(item: T): void {
        this.#items.push(item);
    }

    desencolar(): T | undefined {
        if (this.#items.length === 0) return undefined;
        return this.#items.splice(0, 1)[0];
    }

    primero(): T | undefined {
        return this.#items[0];
    }

    aArray(): T[] {
        return [...this.#items];
    }
}