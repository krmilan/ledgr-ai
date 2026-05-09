// This utility solves a common Express + async/await problem.
//
// The problem: Express doesn't automatically catch errors thrown in async functions.
// If you write:   app.get("/x", async (req, res) => { throw new Error("oops") })
// Express will hang — the error never reaches your error handler.
//
// The solution: wrap every async route handler in this function,
// which catches rejected promises and forwards them to next(error).

import { Request, Response, NextFunction } from "express";

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown>;

export const asyncHandler = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // .catch(next) is the key — it passes any error to Express's error handler
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};