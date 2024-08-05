import { createUrl } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { hash, verify } from "@node-rs/argon2";
import { SqliteError } from "better-sqlite3";
import { Hono } from "hono";
import { generateId } from "lucia";
import { isWithinExpirationDate } from "oslo";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import * as v from "valibot";

import { argonConfig } from "@/config/auth.config";
import { env } from "@/config/env.config";
import { db, type DatabaseUser, type PasswordResetToken } from "@/db";
import { auth } from "@/lib/auth";
import type { Context } from "@/lib/context";
import { createPasswordResetToken } from "@/lib/create-password-reset-token";
import { sendPasswordResetToken } from "@/lib/send-password-reset-token";

const ResetPasswordSchema = v.object({
	email: v.pipe(v.string(), v.email()),
});

const ResetPasswordTokenSchema = v.object({
	password: v.pipe(v.string(), v.nonEmpty()),
});

const SignInSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	password: v.pipe(v.string(), v.nonEmpty()),
});

const SignUpSchema = v.object({
	email: v.pipe(v.string(), v.email()),
	password: v.pipe(v.string(), v.minLength(8), v.maxLength(255)),
});

export const authRouter = new Hono<Context>()
	.post("/reset-password", vValidator("form", ResetPasswordSchema), async (c) => {
		const input = c.req.valid("form");

		const existingUser = db.prepare("SELECT * FROM user WHERE email = ?").get(input.email) as
			| DatabaseUser
			| undefined;

		if (!existingUser) {
			return c.text("Invalid email.", 400);
		}

		const verificationToken = await createPasswordResetToken(existingUser.id);
		const verificationLink = createUrl({
			baseUrl: env.APP_BASE_URL,
			pathname: `/reset-password/${verificationToken}`,
		});

		// FIXME: try/catch
		await sendPasswordResetToken({ email: input.email, url: verificationLink });

		return c.body(null, 200);
	})
	.post("/reset-password/:token", vValidator("form", ResetPasswordTokenSchema), async (c) => {
		const verificationToken = c.req.param("token");
		const input = c.req.valid("form");

		const tokenHash = encodeHex(await sha256(new TextEncoder().encode(verificationToken)));
		const token = db
			.prepare("SELECT * FROM password_reset_tokens WHERE token_hash = ?")
			.get(tokenHash) as PasswordResetToken | undefined;

		if (token) {
			db.prepare("DELETE * FROM password_reset_tokens WHERE token_hash = ?").run(tokenHash);
		}

		if (!token || !isWithinExpirationDate(new Date(token.expires_at))) {
			return c.body(null, 400);
		}

		await auth.invalidateUserSessions(token.user_id);

		const passwordHash = await hash(input.password, argonConfig);
		db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").run(passwordHash, token.user_id);

		const session = await auth.createSession(token.user_id, {});
		c.header("Set-Cookie", auth.createSessionCookie(session.id).serialize(), { append: true });
		c.header("Referrer-Policy", "strict-origin");

		return c.redirect("/");
	})
	.post("/sign-in", vValidator("form", SignInSchema), async (c) => {
		const input = c.req.valid("form");

		const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(input.email) as
			| DatabaseUser
			| undefined;

		if (!existingUser) {
			return c.text("Invalid email or password.", 401);
		}

		const validPassword = await verify(existingUser.password_hash, input.password, argonConfig);

		if (!validPassword) {
			return c.text("Invalid email or password.", 401);
		}

		const session = await auth.createSession(existingUser.id, {});
		c.header("Set-Cookie", auth.createSessionCookie(session.id).serialize(), { append: true });

		return c.redirect("/");
	})
	.post("/sign-out", async (c) => {
		const session = c.get("session");

		if (!session) {
			return c.body(null, 401);
		}

		await auth.invalidateSession(session.id);
		c.header("Set-Cookie", auth.createBlankSessionCookie().serialize());

		return c.redirect("/auth/sign-in");
	})
	.post("/sign-up", vValidator("form", SignUpSchema), async (c) => {
		const input = c.req.valid("form");

		const passwordHash = await hash(input.password, argonConfig);
		const userId = generateId(15);

		try {
			db.prepare("INSERT INTO users (id, email, password_hash) VALUES(?, ?, ?)").run(
				userId,
				input.email,
				passwordHash,
			);

			const session = await auth.createSession(userId, {});
			c.header("Set-Cookie", auth.createSessionCookie(session.id).serialize(), { append: true });

			return c.redirect("/");
		} catch (error) {
			if (error instanceof SqliteError && error.code === "SQLITE_CONSTRAINT_UNIQUE") {
				return c.text("Email already in use.", 400);
			}

			// FIXME:; rethrow?
			return c.body(null, 500);
		}
	});
