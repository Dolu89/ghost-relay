import { Database } from "bun:sqlite";
import { env } from "../helpers/env";
import type { Event as NostrEvent } from "nostr-tools";
import logger from "../helpers/logger";

class DbEvent {
    id: string = "";
    data: string = "";
}

class DbClient {
    #db: Database;
    #logger = logger.child({ module: "DbClient" });

    constructor() {
        this.#db = new Database(env.DB_PATH ?? ":memory:", { create: true });
        this.#seed();
    }

    #seed() {
        this.#logger.trace("Seeding database if needed...");
        this.#db.exec("PRAGMA journal_mode = WAL;");
        this.#db
            .query(
                `CREATE TABLE IF NOT EXISTS events (id TEXT PRIMARY KEY, data TEXT);`,
            )
            .run();
    }

    insertEvent(event: NostrEvent) {
        this.#logger.trace(`Inserting event ${event.id}`);
        this.#db
            .query("INSERT INTO events (id, data) VALUES ($id, $data)")
            .run({ $id: event.id, $data: JSON.stringify(event) });
    }

    deleteEvent(eventId: string) {
        this.#logger.trace(`Deleting event ${eventId}`);
        this.#db
            .query("DELETE FROM events WHERE id = $id")
            .run({ $id: eventId });
    }

    getEvents(): NostrEvent[] {
        return this.#db
            .query("SELECT data FROM events")
            .as(DbEvent)
            .all()
            .map((row) => JSON.parse(row.data));
    }
}

export default new DbClient();
