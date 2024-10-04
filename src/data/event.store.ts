import { matchFilter, type Event, type Filter } from "nostr-tools";
import EventEmitter from "events";
import DbClient from "../db/db_client";
import logger from "../helpers/logger";

class EventStore extends EventEmitter {
    #events: Event[] = [];
    #logger = logger.child({ module: "EventStore" });

    constructor() {
        super();
        const events = DbClient.getEvents();
        this.#logger.debug(
            `Loaded ${events.length} event(s) from the database`,
        );
        for (const element of events) {
            this.#events.push(element);
        }
    }

    addEvent(event: Event) {
        if (this.#events.find((e) => e.id === event.id)) {
            this.#logger.trace(`Event ${event.id} already exists`);
            throw new Error(`Event ${event.id} already exists`);
        }
        this.#logger.trace(`Adding event ${event.id}`);
        this.#events.push(event);
        DbClient.insertEvent(event);
        this.emit("event", event);
    }

    getEventsByFilter(filter: Filter): Event[] {
        let events = this.#events
            .filter((event) => matchFilter(filter, event))
            .sort((a, b) => b.created_at - a.created_at);
        if (filter.limit && filter.limit > 0) {
            events = events.slice(0, filter.limit);
        }
        return events;
    }

    removeEvent(eventId: string) {
        this.#logger.trace(`Removing event ${eventId}`);
        this.#events.splice(
            this.#events.findIndex((event) => event.id === eventId),
            1,
        );
        DbClient.deleteEvent(eventId);
    }
}

export default new EventStore();
