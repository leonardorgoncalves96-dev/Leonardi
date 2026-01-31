import { FormEvent, useState } from "react";
import { requireAuth } from "../lib/auth";
import { backendRequest } from "../lib/api";

interface MessageRecord {
  id: number;
  phone: string;
  direction: string;
  text: string;
  created_at: string;
}

export const getServerSideProps = requireAuth;

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageRecord[]>([]);

  const handleSearch = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const phone = form.phone.value;
    const query = phone ? `?phone=${encodeURIComponent(phone)}` : "";
    const data = await backendRequest(`/admin/messages${query}`);
    setMessages(data as MessageRecord[]);
  };

  return (
    <main>
      <h1>Conversas</h1>
      <div className="card">
        <form onSubmit={handleSearch}>
          <label>Telefone</label>
          <input name="phone" placeholder="Ex: 551199999999" />
          <button type="submit">Buscar</button>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Telefone</th>
              <th>Direção</th>
              <th>Mensagem</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((message) => (
              <tr key={message.id}>
                <td>{message.phone}</td>
                <td>{message.direction}</td>
                <td>{message.text}</td>
                <td>{new Date(message.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
