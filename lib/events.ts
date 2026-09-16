import { Prisma } from "@prisma/client"

type EventDates = { startDate: Date; endDate: Date | null }

function eventEnd(event: EventDates): Date {
  return event.endDate ?? event.startDate
}

export function isUpcoming(event: EventDates, now: Date = new Date()): boolean {
  return eventEnd(event) >= now
}

export function isPast(event: EventDates, now: Date = new Date()): boolean {
  return !isUpcoming(event, now)
}

export function upcomingWhere(now: Date = new Date()): Prisma.EventWhereInput {
  return {
    OR: [{ endDate: { gte: now } }, { endDate: null, startDate: { gte: now } }],
  }
}
