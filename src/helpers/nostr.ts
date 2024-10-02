import { verifyEvent, type Event, type Filter } from "nostr-tools";
import { InvalidEventError } from "../exceptions/nostr.exception";

type NoticeType = "ERROR" | "WARNING" | "INFO";

export function parseAndValidateFilters(filters: object[]): Filter[] {
    assertIsNostrFilters(filters);
    // TODO add filter validation
    return filters;
}

function assertIsNostrFilters(data: object[]): asserts data is Filter[] {
    if (data === null || !Array.isArray(data)) {
        throw new InvalidEventError("Filter data must be an object");
    }
}

export function parseAndValidateEvent(data: object): Event {
    assertIsNostrEvent(data);
    if (!verifyEvent(data)) {
        throw new InvalidEventError();
    }
    return data;
}

function assertIsNostrEvent(data: object): asserts data is Event {
    if (data === null || typeof data !== "object") {
        throw new InvalidEventError("Event data must be an object");
    }
}

export function formatEvent(subId: string, event: Event): string {
    return JSON.stringify(["EVENT", subId, event]);
}

export function formatEose(subId: string): string {
    return JSON.stringify(["EOSE", subId]);
}

export function formatNotice(type: NoticeType, message: string): string {
    return JSON.stringify(["NOTICE", `${type}: ${message}`]);
}

export function formatOk(eventId: string): string {
    return JSON.stringify(["OK", eventId, true]);
}
