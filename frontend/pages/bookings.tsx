import { FormEvent, useState } from "react";
import { requireAuth } from "../lib/auth";
import { backendRequest } from "../lib/api";

interface Booking {
  id: number;
  professional_id: number;
  service_id: number;
  start_at: string;
  end_at: string;
  status: string;
}

export const getServerSideProps = requireAuth;

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const date = form.date.value;
    const professionalId = form.professional_id.value;
    const query = new URLSearchParams({ date });
    if (professionalId) {
      query.append("professionalId", professionalId);
    }
    const data = await backendRequest(`/admin/bookings?${query.toString()}`);
    setBookings(data as Booking[]);
  };

  return (
    <main>
      <h1>Agenda</h1>
      <div className="card">
        <form onSubmit={handleSearch}>
          <label>Data</label>
          <input name="date" type="date" required />
          <label>ID Profissional (opcional)</label>
          <input name="professional_id" type="number" />
          <button type="submit">Buscar</button>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Profissional</th>
              <th>Serviço</th>
              <th>Início</th>
              <th>Fim</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id}>
                <td>{booking.id}</td>
                <td>{booking.professional_id}</td>
                <td>{booking.service_id}</td>
                <td>{new Date(booking.start_at).toLocaleString()}</td>
                <td>{new Date(booking.end_at).toLocaleString()}</td>
                <td>{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
