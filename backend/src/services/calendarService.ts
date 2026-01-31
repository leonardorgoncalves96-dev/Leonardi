import { google } from "googleapis";
import { DateTime } from "luxon";

interface DateRange {
  start: string;
  end: string;
}

interface BookingEvent {
  professionalCalendarId: string;
  serviceName: string;
  clientName: string;
  startAt: string;
  endAt: string;
  notes?: string;
  googleEventId?: string | null;
}

const getCalendarClient = () => {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON not configured");
  }
  const credentials = JSON.parse(serviceAccountJson);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  if (process.env.GOOGLE_IMPERSONATE_USER) {
    auth.subject = process.env.GOOGLE_IMPERSONATE_USER;
  }
  return google.calendar({ version: "v3", auth });
};

const WORKING_HOURS = {
  start: 9,
  end: 19,
};

const SLOT_MINUTES = 30;

export const listAvailableSlots = async (
  professionalCalendarId: string,
  serviceDurationMinutes: number,
  range: DateRange,
  timeZone: string
): Promise<string[]> => {
  const calendar = getCalendarClient();
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: range.start,
      timeMax: range.end,
      items: [{ id: professionalCalendarId }],
      timeZone,
    },
  });
  const busy = response.data.calendars?.[professionalCalendarId]?.busy || [];

  const startDate = DateTime.fromISO(range.start, { zone: timeZone });
  const endDate = DateTime.fromISO(range.end, { zone: timeZone });

  const slots: string[] = [];

  for (
    let day = startDate.startOf("day");
    day <= endDate.startOf("day");
    day = day.plus({ days: 1 })
  ) {
    if (day.weekday === 7) {
      continue;
    }
    let slotStart = day.set({ hour: WORKING_HOURS.start, minute: 0 });
    const dayEnd = day.set({ hour: WORKING_HOURS.end, minute: 0 });

    while (slotStart.plus({ minutes: serviceDurationMinutes }) <= dayEnd) {
      const slotEnd = slotStart.plus({ minutes: serviceDurationMinutes });
      const isPast = slotStart < DateTime.now().setZone(timeZone);
      const isBusy = busy.some((item) => {
        const busyStart = DateTime.fromISO(item.start as string);
        const busyEnd = DateTime.fromISO(item.end as string);
        return slotStart < busyEnd && slotEnd > busyStart;
      });
      if (!isPast && !isBusy) {
        slots.push(slotStart.toISO());
      }
      slotStart = slotStart.plus({ minutes: SLOT_MINUTES });
    }
  }

  return slots;
};

export const createBookingEvent = async (booking: BookingEvent) => {
  const calendar = getCalendarClient();
  const response = await calendar.events.insert({
    calendarId: booking.professionalCalendarId,
    requestBody: {
      summary: `${booking.serviceName} - ${booking.clientName}`,
      description: booking.notes,
      start: { dateTime: booking.startAt },
      end: { dateTime: booking.endAt },
    },
  });
  return response.data.id || null;
};

export const updateBookingEvent = async (booking: BookingEvent) => {
  if (!booking.googleEventId) {
    throw new Error("googleEventId required to update event");
  }
  const calendar = getCalendarClient();
  await calendar.events.update({
    calendarId: booking.professionalCalendarId,
    eventId: booking.googleEventId,
    requestBody: {
      summary: `${booking.serviceName} - ${booking.clientName}`,
      description: booking.notes,
      start: { dateTime: booking.startAt },
      end: { dateTime: booking.endAt },
    },
  });
};

export const cancelBookingEvent = async (
  professionalCalendarId: string,
  googleEventId: string
) => {
  const calendar = getCalendarClient();
  await calendar.events.delete({
    calendarId: professionalCalendarId,
    eventId: googleEventId,
  });
};
