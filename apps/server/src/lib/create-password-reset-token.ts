import { generateIdFromEntropySize } from "lucia";
import { TimeSpan, createDate } from "oslo";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";

import { db } from "@/db";

export async function createPasswordResetToken(userId: string): Promise<string> {
	db.prepare("DELETE * FROM password_reset_tokens WHERE user_id = ?").run(userId);
	const tokenId = generateIdFromEntropySize(25);
	const tokenHash = encodeHex(await sha256(new TextEncoder().encode(tokenId)));
	db.prepare(
		"INSERT INTO password_reset_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
	).run(tokenHash, userId, createDate(new TimeSpan(2, "h")));
	return tokenId;
}
