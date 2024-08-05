import sqlite from "better-sqlite3";

export const db = sqlite(":memory:");

db.exec(`CREATE TABLE IF NOT EXISTS users (
	id TEXT NOT NULL PRIMARY KEY,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL
)`);

db.exec(`CREATE TABLE IF NOT EXISTS sessions (
	id TEXT NOT NULL PRIMARY KEY,
	expires_at INTEGER NOT NULL,
	user_id TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id)
)`);

db.exec(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
	token_hash TEXT NOT NULL UNIQUE,
	expires_at INTEGER NOT NULL,
	user_id TEXT NOT NULL,
	FOREIGN KEY (user_id) REFERENCES users(id)
)`);

export interface DatabaseUser {
	id: string;
	email: string;
	password_hash: string;
}

export interface PasswordResetToken {
	expires_at: number;
	token_hash: string;
	user_id: string;
}
