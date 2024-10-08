import type { ServerWebSocket } from "bun";
import type { WebSocketData } from "../types/websocket";
import {
    formatEose,
    formatEvent,
    formatNotice,
    formatOk,
    parseAndValidateFilters,
    parseEvent,
    validateEvent,
} from "../helpers/nostr";
import eventStore from "../data/event.store";
import { matchFilters, type Filter, type Event } from "nostr-tools";
import logger from "../helpers/logger";
import { InvalidEventError } from "../exceptions/nostr.exception";

export default class NostrClient {
    #ws: ServerWebSocket<WebSocketData>;
    #subs: Map<string, Filter[]> = new Map();
    #eventHandler: (event: any) => void;
    #logger = logger.child({ module: "NostrClient" });

    constructor(ws: ServerWebSocket<WebSocketData>) {
        this.#ws = ws;
        this.#eventHandler = (event) => this.#onEventEmitted(event);
        eventStore.on("event", this.#eventHandler);
    }

    #onEventEmitted(event: Event) {
        for (const [subId, filters] of this.#subs.entries()) {
            if (matchFilters(filters, event)) {
                this.#send(formatEvent(subId, event));
                eventStore.removeEvent(event.id);
            }
        }
    }

    close() {
        eventStore.off("event", this.#eventHandler);
    }

    handleMessage(message: string | Buffer) {
        try {
            logger.debug(`Received message: ${message}`);
            if (
                typeof message !== "string" ||
                (!message.startsWith("[") && !message.endsWith("]"))
            ) {
                this.#send(formatNotice("ERROR", "unparseable message"));
                return;
            }
            const parsedMessage = JSON.parse(message);
            if (!Array.isArray(parsedMessage) || parsedMessage.length < 2) {
                this.#send(formatNotice("ERROR", "unparseable message"));
                return;
            }

            const type = parsedMessage[0];
            switch (type) {
                case "REQ": {
                    const [_, subId, ...filtersPayload] = parsedMessage;
                    const filters = parseAndValidateFilters(filtersPayload);

                    if (this.#subs.size >= 5) {
                        this.#send(
                            formatNotice("ERROR", "Too many subscriptions"),
                        );
                        return;
                    }

                    if (this.#subs.has(subId)) {
                        this.#send(
                            formatNotice(
                                "ERROR",
                                "subscription id already exists",
                            ),
                        );
                        return;
                    }

                    this.#subs.set(subId, filters);
                    this.#logger.trace(`New subscription ${subId}`);

                    for (const filter of filters) {
                        for (const event of eventStore.getEventsByFilter(
                            filter,
                        )) {
                            this.#send(formatEvent(subId, event));
                            eventStore.removeEvent(event.id);
                        }
                    }
                    this.#send(formatEose(subId));
                    break;
                }
                case "EVENT": {
                    const event = parseEvent(parsedMessage[1]);
                    try {
                        validateEvent(event);
                        eventStore.addEvent(event);
                        this.#send(formatOk(event.id, true));
                    } catch (error) {
                        if (error instanceof InvalidEventError) {
                            this.#send(
                                formatOk(event.id, false, error.message),
                            );
                        } else {
                            this.#send(formatOk(event.id, false));
                        }
                    }
                    break;
                }
                case "CLOSE": {
                    const subscriptionId = parsedMessage[1];
                    this.#logger.trace(
                        `Closing subscription ${subscriptionId}`,
                    );
                    this.#subs.delete(subscriptionId);
                    break;
                }
                default: {
                    this.#logger.debug(`Unparseable message: ${message}`);
                    this.#send(formatNotice("ERROR", "unparseable message"));
                    return;
                }
            }
        } catch (error) {
            if (error instanceof Error) {
                this.#send(formatNotice("ERROR", error.message));
            }
        }
    }

    #send(message: string) {
        this.#ws.send(message);
    }
}
