import { ZodError } from "zod";
import { ApiResponse } from "../utils/response.js";

export function validateRequest(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        const parsedBody = await schemas.body.parseAsync(req.body);
        try {
          req.body = parsedBody;
        } catch {
          Object.defineProperty(req, "body", {
            value: parsedBody,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      }
      if (schemas.query) {
        const parsedQuery = await schemas.query.parseAsync(req.query);
        try {
          req.query = parsedQuery;
        } catch {
          Object.defineProperty(req, "query", {
            value: parsedQuery,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      }
      if (schemas.params) {
        const parsedParams = await schemas.params.parseAsync(req.params);
        try {
          req.params = parsedParams;
        } catch {
          Object.defineProperty(req, "params", {
            value: parsedParams,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        }
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        return ApiResponse.error(res, "Validasi input gagal", 400, formattedErrors);
      }
      next(error);
    }
  };
}
