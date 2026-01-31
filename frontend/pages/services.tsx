import { FormEvent, useEffect, useState } from "react";
import { requireAuth } from "../lib/auth";
import { backendRequest } from "../lib/api";

interface Service {
  id: number;
  name: string;
  duration_minutes: number;
  price_cents: number;
  description?: string | null;
}

export const getServerSideProps = requireAuth;

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);

  const load = async () => {
    const data = await backendRequest("/admin/services");
    setServices(data as Service[]);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const payload = {
      name: form.service_name.value,
      duration_minutes: Number(form.duration_minutes.value),
      price_cents: Number(form.price_cents.value),
      description: form.description.value || null,
    };
    await backendRequest("/admin/services", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    form.reset();
    load();
  };

  const handleDelete = async (id: number) => {
    await backendRequest(`/admin/services/${id}`, {
      method: "DELETE",
    });
    load();
  };

  return (
    <main>
      <h1>Serviços</h1>
      <div className="card">
        <h2>Novo serviço</h2>
        <form onSubmit={handleCreate}>
          <label>Nome</label>
          <input name="service_name" required />
          <label>Duração (min)</label>
          <input name="duration_minutes" type="number" required />
          <label>Preço (centavos)</label>
          <input name="price_cents" type="number" required />
          <label>Descrição</label>
          <input name="description" />
          <button type="submit">Adicionar</button>
        </form>
      </div>
      <div className="card">
        <h2>Lista</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Duração</th>
              <th>Preço</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service) => (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>{service.duration_minutes} min</td>
                <td>R$ {(service.price_cents / 100).toFixed(2)}</td>
                <td>
                  <button type="button" onClick={() => handleDelete(service.id)}>
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
