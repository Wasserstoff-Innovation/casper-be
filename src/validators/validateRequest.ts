import { ZodError, ZodObject, ZodTypeAny } from "zod";
import { Request, Response, NextFunction } from "express";

const validateRequest =
  (schema: ZodObject<any> | ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse the body directly
      console.log("Validating request with schema:", schema);
      console.log("Request body:", req.body);
      schema.parse(req.body);
      schema.parse(req.params);
      schema.parse(req.query);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation error",
          errors: err.issues.map((issue) => ({
            path: issue.path.join("."), // e.g. "raw_idea"
            message: issue.message,
          })),
        });
      }
      next(err);
    }
  };

export default validateRequest;
