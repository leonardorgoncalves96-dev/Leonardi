import { FormEvent, useState } from "react";
import { useRouter } from "next/router";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (!response.ok) {
      setError("Senha inválida");
      return;
    }
    router.push("/");
  };

  return (
    <main>
      <div className="card">
        <h1>Login do Painel</h1>
        <form onSubmit={handleSubmit}>
          <label>Senha</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          {error && <p style={{ color: "#dc2626" }}>{error}</p>}
          <button type="submit">Entrar</button>
        </form>
      </div>
    </main>
  );
}
