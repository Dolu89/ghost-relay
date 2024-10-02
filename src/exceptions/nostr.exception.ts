export class InvalidEventError extends Error {
    constructor(message: string | null = null) {
        super(message ?? "Invalid event data");
    }
}
