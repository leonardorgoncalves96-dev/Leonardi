import { NextFunction, Request, Response } from "express";

export const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_PASSWORD) {
    return res.status(500).json({ error: "admin_password_not_set" });
  }
  if (token !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "unauthorized" });
  }
  return next();
};
