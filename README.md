# agente-salao-ia

Projeto completo com agente de atendimento para salão de beleza via WhatsApp + Google Calendar, com painel admin em Next.js e backend em Node.js + TypeScript.

## ✨ Funcionalidades

- Atendimento via WhatsApp Cloud API (Webhook).
- Classificação de intenção: INFO, AGENDAR, REMARCAR, CANCELAR, HUMANO.
- Agendamento e gestão de horários com Google Calendar.
- Histórico completo de mensagens e ações.
- Painel admin com gestão de profissionais, serviços, agenda e conversas.

## 🧱 Stack

- **Backend**: Node.js + TypeScript + Express
- **Banco**: PostgreSQL (migrations SQL + seed)
- **Frontend**: Next.js
- **Infra local**: Docker Compose (app + postgres)

## 📂 Estrutura

```
backend/
  src/
    routes/
    controllers/
    services/
    repositories/
    middleware/
  migrations/
  scripts/
frontend/
  pages/
  lib/
  styles/
```

## ✅ Como rodar (Docker)

1. Crie o `.env` na raiz do projeto com base nos exemplos abaixo.
2. Suba os serviços:

```bash
docker compose up --build
```

3. Rode migrations e seeds:

```bash
docker compose exec backend npm run migrate:up
docker compose exec backend npm run seed
```

- Backend: `http://localhost:3001`
- Frontend: `http://localhost:3000`

## 🔐 Variáveis de ambiente (exemplo)

Crie um `.env` na raiz do projeto com:

```
WHATSAPP_VERIFY_TOKEN=seu_token_verificacao
WHATSAPP_ACCESS_TOKEN=seu_token_meta
WHATSAPP_PHONE_NUMBER_ID=seu_phone_id
WHATSAPP_API_BASE_URL=https://graph.facebook.com/v18.0
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
GOOGLE_IMPERSONATE_USER=seu-email@dominio.com
ADMIN_PASSWORD=admin123
```

> Para rodar localmente sem integração, é possível deixar os campos de WhatsApp/Google vazios e testar apenas o painel.

## 📲 WhatsApp Cloud API

- **Webhook de verificação**: `GET /webhooks/whatsapp`
- **Webhook de mensagens**: `POST /webhooks/whatsapp`

No painel da Meta:
1. Configure o URL do webhook para `https://SEU_DOMINIO/webhooks/whatsapp`.
2. Use o valor de `WHATSAPP_VERIFY_TOKEN` como verify token.

## 📅 Google Calendar API

Opção mais simples: **Service Account + impersonation**.

1. Crie uma Service Account no Google Cloud.
2. Gere a chave JSON.
3. Ative a API do Google Calendar.
4. Compartilhe os calendários dos profissionais com o e-mail da service account.
5. Configure:

```
GOOGLE_SERVICE_ACCOUNT_JSON={...}
GOOGLE_IMPERSONATE_USER=seu-email@dominio.com
```

> O `calendar_id` de cada profissional pode ser editado no painel.

## 🧠 Fluxos do agente

### INFO
Responde com base no `salonInfo.json` (endereço, pagamentos, serviços, políticas).

### AGENDAR
1. Pergunta serviço
2. Pergunta profissional (ou qualquer)
3. Pergunta dia
4. Sugere 3 horários
5. Confirma e cria agendamento

### REMARCAR
1. Lista agendamentos futuros
2. Solicita qual deseja remarcar
3. Sugere novos horários
4. Atualiza no Google Calendar

### CANCELAR
1. Lista agendamentos futuros
2. Confirma cancelamento
3. Atualiza status + cancela evento

### HUMANO
Responde com mensagem de escalonamento para atendente.

## 🗃️ Migrations e Seeds

- `backend/migrations/001_init.sql`: cria tabelas.
- `backend/scripts/seed.ts`: cria 3 profissionais (A, B, C) e serviços base.

## 🔌 Rotas principais

### WhatsApp
- `GET /webhooks/whatsapp`
- `POST /webhooks/whatsapp`

### Admin (protegido via `x-admin-token`)
- `GET /admin/professionals`
- `PUT /admin/professionals/:id`
- `GET /admin/services`
- `POST /admin/services`
- `PUT /admin/services/:id`
- `DELETE /admin/services/:id`
- `GET /admin/bookings?date=YYYY-MM-DD&professionalId=1`
- `GET /admin/messages?phone=551199999999`

## 🧪 Como testar localmente

- Suba com Docker
- Exponha o webhook usando **ngrok**:

```bash
ngrok http 3001
```

- Configure no painel da Meta o URL do webhook.

## 💬 Exemplos de mensagens

- `"Qual o endereço?"`
- `"Quero agendar corte feminino"`
- `"Preciso remarcar meu horário"`
- `"Quero cancelar"`

## 🧾 Notas

- Horário de funcionamento: Seg–Sáb 09:00–19:00 (Dom fechado)
- Slots de 30 minutos
- Não agenda no passado

