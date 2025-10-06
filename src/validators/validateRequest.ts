import { Request, Response, NextFunction } from "express";
import { ZodObject, ZodError, ZodTypeAny } from "zod";

// schema is a ZodObject or any Zod schema
const validateRequest =
  (schema: ZodObject<any> | ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: err.issues.map((issue) => ({
            path: issue.path.join("."), // e.g. "body.email"
            message: issue.message,
          })),
        });
      }
      next(err);
    }
  };

export default validateRequest;
