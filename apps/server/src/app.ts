import { Hono } from "hono";
import { csrf } from "hono/csrf";
import { logger } from "hono/logger";

import type { Context } from "@/lib/context";

/**
 * With path alias, type inference breaks.
 *
 * @see https://github.com/honojs/hono/issues/1746
 */
import { authMiddleware } from "./middleware/auth";
import { authRouter } from "./routes/auth";
import { entitiesRouter } from "./routes/entities";

const app = new Hono<Context>();

app.use(logger());
app.use(csrf());
app.use(authMiddleware);

const routes = app.route("/auth", authRouter).route("/api/entities", entitiesRouter);

export type AppType = typeof routes;

export { app };
