import pinoHttp from "pino-http";
import { v4 as uuidv4 } from "uuid";

export const logger = pinoHttp({
  level: process.env.LOG_LEVEL || "info",
  genReqId: (req, res) => {
    const headerId = req.headers["x-request-id"];
    if (typeof headerId === "string") {
      return headerId;
    }
    const id = uuidv4();
    res.setHeader("x-request-id", id);
    return id;
  },
});
