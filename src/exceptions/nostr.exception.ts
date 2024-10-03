export class InvalidEventError extends Error {
    constructor(message: string | null = null) {
        super(message ?? "Invalid event data");
    }
}

export class InvalidFilterError extends Error {
    constructor(message: string | null = null) {
        super(
            message ??
                "Invalid filter. Must have at least one of the following fields: authors, #p",
        );
    }
}
