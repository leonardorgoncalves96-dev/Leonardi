import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }
  const { password } = req.body as { password?: string };
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "admin_password_not_set" });
  }
  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "invalid_password" });
  }
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", "1", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    })
  );
  return res.status(200).json({ ok: true });
}
