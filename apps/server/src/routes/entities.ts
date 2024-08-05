import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import type { Context } from "@/lib/context";

export const entitiesRouter = new Hono<Context>();
