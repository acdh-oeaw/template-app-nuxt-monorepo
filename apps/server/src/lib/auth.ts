import { Lucia } from "lucia";
import { BetterSqlite3Adapter } from "@lucia-auth/adapter-sqlite";
import { db, type DatabaseUser } from "@/db";

const adapter = new BetterSqlite3Adapter(db, {
	user: "users",
	session: "sessions",
});

export const auth = new Lucia(adapter, {
	getUserAttributes(attributes) {
		return {
			email: attributes.email,
		};
	},
	sessionCookie: {
		attributes: {
			secure: process.env.NODE_ENV === "production",
		},
	},
});

declare module "lucia" {
	interface Register {
		Lucia: typeof auth;
		DatabaseUserAttributes: Omit<DatabaseUser, "id">;
	}
}
