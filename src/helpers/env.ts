import vine, { errors } from "@vinejs/vine";

const schema = vine.object({
    PORT: vine.number(),
    DB_PATH: vine.string().optional(),
    LOG_LEVEL: vine
        .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
        .optional(),
});
const data = {
    ...process.env,
};
const validator = vine.compile(schema);
const validatedEnv = await validator.validate(data).catch((error) => {
    if (error instanceof errors.E_VALIDATION_ERROR) {
        const message = error.messages
            .map((m: { message: string }) => m.message)
            .join("\n");
        throw new Error(message);
    }
});
// Used to remove void from type. Maybe find a better way to do this.
assertEnv(validatedEnv);
export const env = validatedEnv;

function assertEnv(env: unknown): asserts env is Partial<{}> {
    if (!env || typeof env !== "object") {
        throw new Error("Invalid env");
    }
}
