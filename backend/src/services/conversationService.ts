import { DateTime } from "luxon";
import salonInfo from "../config/salonInfo.json";
import { listProfessionals } from "../repositories/professionalRepository";
import { listServices } from "../repositories/serviceRepository";
import {
  createBooking,
  listUpcomingBookingsByPhone,
  updateBooking,
} from "../repositories/bookingRepository";
import { findOrCreateClientByPhone, markClientNeedsHuman } from "../repositories/clientRepository";
import { listAvailableSlots, createBookingEvent, updateBookingEvent, cancelBookingEvent } from "./calendarService";
import { classifyIntent, Intent } from "./intentClassifier";

interface ConversationState {
  intent: Intent;
  step: string;
  serviceId?: number;
  professionalId?: number | null;
  targetBookingId?: number;
  date?: string;
}

const stateStore = new Map<string, ConversationState>();

const formatServices = async () => {
  const services = await listServices();
  return services
    .map(
      (service) =>
        `• ${service.name} (${service.duration_minutes} min) - R$ ${(service.price_cents / 100).toFixed(2)}`
    )
    .join("\n");
};

const formatProfessionals = async () => {
  const professionals = await listProfessionals();
  return professionals.map((p) => `• ${p.id} - ${p.name}`).join("\n");
};

const normalizeText = (text: string) => text.toLowerCase();

export const handleIncomingMessage = async (phone: string, text: string) => {
  const existingState = stateStore.get(phone);
  const intent = existingState?.intent ?? classifyIntent(text);

  if (!existingState) {
    stateStore.set(phone, { intent, step: "start" });
  }

  const state = stateStore.get(phone)!;

  if (intent === "INFO") {
    const servicesText = salonInfo.services
      .map(
        (service) =>
          `• ${service.name} (${service.duration_minutes} min) - R$ ${(service.price_cents / 100).toFixed(2)}`
      )
      .join("\n");
    return (
      `📍 Endereço: ${salonInfo.address}\n` +
      `💳 Formas de pagamento: ${salonInfo.payment_methods.join(", ")}\n` +
      `🕒 Horário: Seg–Sáb 09:00–19:00 (Dom fechado)\n` +
      `💇 Serviços:\n${servicesText}\n` +
      `📌 Políticas: ${salonInfo.policies.join(" | ")}`
    );
  }

  if (intent === "HUMANO") {
    await findOrCreateClientByPhone(phone);
    await markClientNeedsHuman(phone);
    return "Vou encaminhar para um atendente humano. 🙋‍♀️";
  }

  if (intent === "AGENDAR") {
    if (state.step === "start") {
      state.step = "ask_service";
      return `Qual serviço você deseja?\n${await formatServices()}`;
    }

    if (state.step === "ask_service") {
      const services = await listServices();
      const match = services.find((service) =>
        normalizeText(text).includes(normalizeText(service.name))
      );
      if (!match) {
        return `Não encontrei esse serviço. Escolha um da lista:\n${await formatServices()}`;
      }
      state.serviceId = match.id;
      state.step = "ask_professional";
      return `Qual profissional prefere? (responda com o número)\n${await formatProfessionals()}\nOu responda "qualquer".`;
    }

    if (state.step === "ask_professional") {
      const professionals = await listProfessionals();
      if (normalizeText(text).includes("qualquer")) {
        state.professionalId = null;
      } else {
        const selectedId = Number(text.trim());
        const professional = professionals.find((p) => p.id === selectedId);
        if (!professional) {
          return `Profissional não encontrado.\n${await formatProfessionals()}`;
        }
        state.professionalId = selectedId;
      }
      state.step = "ask_date";
      return "Qual dia você prefere? (formato AAAA-MM-DD)";
    }

    if (state.step === "ask_date") {
      const date = DateTime.fromISO(text.trim());
      if (!date.isValid) {
        return "Data inválida. Informe no formato AAAA-MM-DD.";
      }
      state.date = date.toISODate();
      state.step = "suggest_slots";

      const services = await listServices();
      const service = services.find((s) => s.id === state.serviceId);
      if (!service) {
        return "Serviço não encontrado. Vamos recomeçar?";
      }

      const professionals = await listProfessionals();
      const timezone = process.env.SALON_TZ || "America/Sao_Paulo";
      const range = {
        start: date.startOf("day").toISO(),
        end: date.endOf("day").toISO(),
      };

      const slots: Array<{ professionalId: number; slot: string }> = [];

      for (const professional of professionals) {
        if (state.professionalId && professional.id !== state.professionalId) {
          continue;
        }
        const available = await listAvailableSlots(
          professional.calendar_id,
          service.duration_minutes,
          range,
          timezone
        );
        available.slice(0, 3).forEach((slot) => {
          slots.push({ professionalId: professional.id, slot });
        });
      }

      if (slots.length === 0) {
        state.step = "ask_date";
        return "Não encontrei horários disponíveis nesse dia. Informe outra data.";
      }

      const formatted = slots
        .slice(0, 3)
        .map((slot, index) => {
          const professional = professionals.find((p) => p.id === slot.professionalId);
          const time = DateTime.fromISO(slot.slot).setZone(timezone).toFormat("HH:mm");
          return `${index + 1}. ${professional?.name} às ${time}`;
        })
        .join("\n");

      state.step = "confirm_slot";
      (state as ConversationState).date = date.toISODate();
      return `Tenho estes horários:\n${formatted}\nResponda com o número da opção.`;
    }

    if (state.step === "confirm_slot") {
      const option = Number(text.trim());
      if (!option || option < 1 || option > 3) {
        return "Opção inválida. Responda com 1, 2 ou 3.";
      }

      const professionals = await listProfessionals();
      const services = await listServices();
      const service = services.find((s) => s.id === state.serviceId);
      if (!service) {
        return "Serviço não encontrado. Vamos começar novamente.";
      }

      const targetProfessional = state.professionalId
        ? professionals.find((p) => p.id === state.professionalId)
        : professionals[option - 1];

      if (!targetProfessional) {
        return "Profissional não encontrado.";
      }

      const date = DateTime.fromISO(state.date || "");
      const timezone = process.env.SALON_TZ || "America/Sao_Paulo";
      const range = {
        start: date.startOf("day").toISO(),
        end: date.endOf("day").toISO(),
      };
      const available = await listAvailableSlots(
        targetProfessional.calendar_id,
        service.duration_minutes,
        range,
        timezone
      );
      const slot = available[option - 1];
      if (!slot) {
        state.step = "ask_date";
        return "Esse horário não está mais disponível. Informe outra data.";
      }

      const client = await findOrCreateClientByPhone(phone);
      const startAt = DateTime.fromISO(slot).setZone(timezone);
      const endAt = startAt.plus({ minutes: service.duration_minutes });

      const eventId = await createBookingEvent({
        professionalCalendarId: targetProfessional.calendar_id,
        serviceName: service.name,
        clientName: client.name || phone,
        startAt: startAt.toISO(),
        endAt: endAt.toISO(),
      });

      await createBooking({
        client_id: client.id,
        professional_id: targetProfessional.id,
        service_id: service.id,
        start_at: startAt.toJSDate(),
        end_at: endAt.toJSDate(),
        status: "scheduled",
        google_event_id: eventId,
      });

      stateStore.delete(phone);
      return `Confirmado ✅ ${service.name} com ${targetProfessional.name} em ${startAt.toFormat("dd/LL HH:mm")}.`;
    }
  }

  if (intent === "REMARCAR") {
    if (state.step === "start") {
      const bookings = await listUpcomingBookingsByPhone(phone);
      if (bookings.length === 0) {
        stateStore.delete(phone);
        return "Não encontrei agendamentos para remarcar.";
      }
      state.step = "select_booking";
      const list = bookings
        .map((booking, index) => `${index + 1}. ${booking.id} em ${booking.start_at}`)
        .join("\n");
      return `Qual agendamento deseja remarcar?\n${list}`;
    }

    if (state.step === "select_booking") {
      const option = Number(text.trim());
      const bookings = await listUpcomingBookingsByPhone(phone);
      const target = bookings[option - 1];
      if (!target) {
        return "Opção inválida.";
      }
      state.targetBookingId = target.id;
      state.step = "ask_date";
      return "Informe a nova data (AAAA-MM-DD).";
    }

    if (state.step === "ask_date") {
      const date = DateTime.fromISO(text.trim());
      if (!date.isValid) {
        return "Data inválida. Informe no formato AAAA-MM-DD.";
      }
      const bookingId = state.targetBookingId;
      if (!bookingId) {
        return "Agendamento não encontrado.";
      }

      const bookings = await listUpcomingBookingsByPhone(phone);
      const target = bookings.find((b) => b.id === bookingId);
      if (!target) {
        return "Agendamento não encontrado.";
      }

      const professionals = await listProfessionals();
      const services = await listServices();
      const professional = professionals.find((p) => p.id === target.professional_id);
      const service = services.find((s) => s.id === target.service_id);
      if (!professional || !service) {
        return "Dados do agendamento não encontrados.";
      }
      const timezone = process.env.SALON_TZ || "America/Sao_Paulo";
      const range = {
        start: date.startOf("day").toISO(),
        end: date.endOf("day").toISO(),
      };
      const available = await listAvailableSlots(
        professional.calendar_id,
        service.duration_minutes,
        range,
        timezone
      );
      if (available.length === 0) {
        return "Sem horários disponíveis nessa data. Informe outra.";
      }
      const list = available.slice(0, 3).map((slot, index) => {
        const time = DateTime.fromISO(slot).setZone(timezone).toFormat("HH:mm");
        return `${index + 1}. ${time}`;
      });
      state.step = "confirm_slot";
      state.date = date.toISODate();
      return `Sugestões:\n${list.join("\n")}\nEscolha uma opção.`;
    }

    if (state.step === "confirm_slot") {
      const option = Number(text.trim());
      const bookingId = state.targetBookingId;
      if (!bookingId || !option) {
        return "Opção inválida.";
      }
      const bookings = await listUpcomingBookingsByPhone(phone);
      const target = bookings.find((b) => b.id === bookingId);
      if (!target) {
        return "Agendamento não encontrado.";
      }
      const professionals = await listProfessionals();
      const services = await listServices();
      const professional = professionals.find((p) => p.id === target.professional_id);
      const service = services.find((s) => s.id === target.service_id);
      if (!professional || !service) {
        return "Dados do agendamento não encontrados.";
      }
      const timezone = process.env.SALON_TZ || "America/Sao_Paulo";
      const date = DateTime.fromISO(state.date || "");
      const range = {
        start: date.startOf("day").toISO(),
        end: date.endOf("day").toISO(),
      };
      const available = await listAvailableSlots(
        professional.calendar_id,
        service.duration_minutes,
        range,
        timezone
      );
      const slot = available[option - 1];
      if (!slot) {
        return "Horário inválido.";
      }
      const startAt = DateTime.fromISO(slot).setZone(timezone);
      const endAt = startAt.plus({ minutes: service.duration_minutes });

      await updateBooking(bookingId, {
        start_at: startAt.toJSDate(),
        end_at: endAt.toJSDate(),
        status: "rescheduled",
      });

      if (target.google_event_id) {
        await updateBookingEvent({
          professionalCalendarId: professional.calendar_id,
          serviceName: service.name,
          clientName: phone,
          startAt: startAt.toISO(),
          endAt: endAt.toISO(),
          googleEventId: target.google_event_id,
        });
      }
      stateStore.delete(phone);
      return `Remarcado ✅ ${service.name} em ${startAt.toFormat("dd/LL HH:mm")}.`;
    }
  }

  if (intent === "CANCELAR") {
    if (state.step === "start") {
      const bookings = await listUpcomingBookingsByPhone(phone);
      if (bookings.length === 0) {
        stateStore.delete(phone);
        return "Não encontrei agendamentos para cancelar.";
      }
      state.step = "confirm_cancel";
      const list = bookings
        .map((booking, index) => `${index + 1}. ${booking.id} em ${booking.start_at}`)
        .join("\n");
      return `Qual agendamento deseja cancelar?\n${list}`;
    }

    if (state.step === "confirm_cancel") {
      const option = Number(text.trim());
      const bookings = await listUpcomingBookingsByPhone(phone);
      const target = bookings[option - 1];
      if (!target) {
        return "Opção inválida.";
      }
      await updateBooking(target.id, { status: "canceled" });
      if (target.google_event_id) {
        const professionals = await listProfessionals();
        const professional = professionals.find((p) => p.id === target.professional_id);
        if (professional) {
          await cancelBookingEvent(professional.calendar_id, target.google_event_id);
        }
      }
      stateStore.delete(phone);
      return "Agendamento cancelado ✅. Se precisar, é só chamar.";
    }
  }

  return "Desculpe, não entendi. Pode reformular?";
};
