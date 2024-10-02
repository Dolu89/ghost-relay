import {
    matchFilter,
    matchFilters,
    type Event,
    type Filter,
} from "nostr-tools";
import EventEmitter from "events";

class EventStore extends EventEmitter {
    #events: Event[] = [];

    addEvent(event: Event) {
        this.#events.push(event);
        this.emit("event", event);
    }

    getEvent(predicate: (event: Event) => boolean): Event | undefined {
        return this.#events.find(predicate);
    }

    getEventsByFilters(filters: Filter[]): Event[] {
        return this.#events.filter((event) => matchFilters(filters, event));
    }

    getEventsByFilter(filter: Filter): Event[] {
        let events = this.#events
            .filter((event) => matchFilter(filter, event))
            .sort((a, b) => a.created_at - b.created_at);
        if (filter.limit && filter.limit > 0) {
            events = events.slice(0, filter.limit);
        }
        return events;
    }

    removeEvent(eventId: string) {
        this.#events.splice(
            this.#events.findIndex((event) => event.id === eventId),
            1,
        );
    }

    clearEvents() {
        this.#events = [];
    }
}

export default new EventStore();
