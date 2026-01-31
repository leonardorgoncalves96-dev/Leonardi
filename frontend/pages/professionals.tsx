import { FormEvent, useEffect, useState } from "react";
import { requireAuth } from "../lib/auth";
import { backendRequest } from "../lib/api";

interface Professional {
  id: number;
  name: string;
  calendar_id: string;
}

export const getServerSideProps = requireAuth;

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const load = async () => {
    const data = await backendRequest("/admin/professionals");
    setProfessionals(data as Professional[]);
  };

  const handleSubmit = (id: number) => async (event: FormEvent) => {
    event.preventDefault();
    const calendarId = (event.target as HTMLFormElement).calendar_id.value;
    await backendRequest(`/admin/professionals/${id}`, {
      method: "PUT",
      body: JSON.stringify({ calendar_id: calendarId }),
    });
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <main>
      <h1>Profissionais</h1>
      {professionals.map((professional) => (
        <div className="card" key={professional.id}>
          <h2>{professional.name}</h2>
          <form onSubmit={handleSubmit(professional.id)}>
            <label>ID do calendário</label>
            <input name="calendar_id" defaultValue={professional.calendar_id} />
            <button type="submit">Salvar</button>
          </form>
        </div>
      ))}
    </main>
  );
}
