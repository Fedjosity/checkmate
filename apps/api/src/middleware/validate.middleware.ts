import { Request, Response, NextFunction } from "express";
import { ZodTypeAny, ZodError } from "zod";
import { error } from "../utils/response";

export const validateRequest = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json(error(err.errors[0].message));
      }
      return next(err);
    }
  };
};
