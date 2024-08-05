// import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { auth } from "@/lib/auth";
import type { Context } from "@/lib/context";

export const authMiddleware = createMiddleware<Context>(async (c, next) => {
	const sessionId = auth.readSessionCookie(c.req.header("Cookie") ?? "");
	// const sessionId = getCookie(c, auth.sessionCookieName)

	if (!sessionId) {
		c.set("session", null);
		c.set("user", null);

		return next();
	}

	const { session, user } = await auth.validateSession(sessionId);

	if (session && session.fresh) {
		c.header("Set-Cookie", auth.createSessionCookie(session.id).serialize(), { append: true });
		// setCookie(c, auth.sessionCookieName, auth.createSessionCookie(session.id).serialize())
	}
	if (!session) {
		c.header("Set-Cookie", auth.createBlankSessionCookie().serialize(), { append: true });
		// setCookie(c, auth.sessionCookieName, auth.createBlankSessionCookie().serialize())
	}

	c.set("session", session);
	c.set("user", user);

	return next();
});
