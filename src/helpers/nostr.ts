import { verifyEvent, type Event, type Filter } from "nostr-tools";
import {
    InvalidEventError,
    InvalidFilterError,
} from "../exceptions/nostr.exception";

type NoticeType = "ERROR" | "WARNING" | "INFO";

export function parseAndValidateFilters(filters: object[]): Filter[] {
    assertIsNostrFilters(filters);
    if (filters.some((filter) => !isAllowedFilter(filter))) {
        throw new InvalidFilterError();
    }
    return filters;
}

/**
 * Disallow filters that do not have any of the following fields: authors, #p to prevent sniffing data by the client
 * @param filter
 * @returns isAllowed
 */
function isAllowedFilter(filter: Filter): boolean {
    let isAllowed = false;

    // Rules are intentionally write in this way to make it easier to read and to add new rules
    if (filter.authors) {
        isAllowed = true;
    }
    if (filter["#p"]) {
        isAllowed = true;
    }

    return isAllowed;
}

function assertIsNostrFilters(data: object[]): asserts data is Filter[] {
    if (data === null || !Array.isArray(data)) {
        throw new InvalidEventError("Filter data must be an object");
    }
}

export function parseEvent(data: object): Event {
    assertIsNostrEvent(data);
    return data;
}

export function validateEvent(event: Event) {
    if (!verifyEvent(event)) {
        throw new InvalidEventError("Event is not valid");
    }
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

export function formatOk(
    eventId: string,
    success: boolean,
    message: string = "",
): string {
    return JSON.stringify(["OK", eventId, success, message]);
}
