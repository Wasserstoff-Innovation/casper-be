import { Request, Response, NextFunction } from "express";
import { ZodObject, z, ZodError, ZodRawShape } from "zod";
import passport from "passport";


const TokenHeaderSchema = z.object({
  header: z.object({
    authorization: z
      .string()
      .regex(/^Bearer\s+[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/, {
        message: "Invalid Authorization token format",
      }),
  }),
});

const validateRequestHeader = (schema: ZodObject<ZodRawShape>) => async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tokenHeader = req.headers["authorization"];
    await schema.parseAsync({ header: { authorization: tokenHeader } });
    (req as any).token = tokenHeader;
    next();
  } catch (error) {
    return res.status(400).json({
      status: false,
      message: "Invalid Headers or Authorization Token Missing",
    });
  }
};


const authenticateUserJwt = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate("jwt", { session: false }, (err:any, user:any, info:any) => {
    if (err || info || !user) {
      return res
        .status(401)
        .json({ status: false, message: "UNAUTHORIZED USER" });
    }
    req.user = { userId: user.userId, ...user }
    next();
  })(req, res, next);
};

export const authenticateUser = [
  validateRequestHeader(TokenHeaderSchema),
  authenticateUserJwt,
];

export const validateRequest =
  (schema: ZodObject<ZodRawShape>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      req.body = parsed.body as typeof req.body;
      req.query = parsed.query as typeof req.query;
      req.params = parsed.params as typeof req.params;

      return next();
    } catch (error) {
      const validationErrors: { [key: string]: string } = {};
      const zodError:any = error as ZodError<any>;
      zodError.errors.forEach((err:any) => {
        const fieldName = err.path.join(".");
        validationErrors[fieldName] = err.message;
      });

      return res.status(400).json({ errors: validationErrors });
    }
  };

