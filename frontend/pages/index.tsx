import Link from "next/link";
import { requireAuth } from "../lib/auth";

export const getServerSideProps = requireAuth;

export default function HomePage() {
  return (
    <main>
      <nav>
        <Link href="/professionals">Profissionais</Link>
        <Link href="/services">Serviços</Link>
        <Link href="/bookings">Agenda</Link>
        <Link href="/messages">Conversas</Link>
      </nav>
      <div className="card">
        <h1>Bem-vindo ao Painel do Salão</h1>
        <p>Use o menu acima para gerenciar profissionais, serviços e agendamentos.</p>
      </div>
    </main>
  );
}
