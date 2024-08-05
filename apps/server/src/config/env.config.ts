import { log } from "@acdh-oeaw/lib";
import * as v from "valibot";

const schema = v.object({
	APP_BASE_URL: v.pipe(v.string(), v.url()),
	EMAIL_ADDRESS: v.optional(v.pipe(v.string(), v.email())),
	EMAIL_SMTP_PORT: v.optional(
		v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
	),
	EMAIL_SMTP_SERVER: v.optional(v.pipe(v.string(), v.nonEmpty())),
	EMAIL_SMTP_USERNAME: v.optional(v.pipe(v.string(), v.nonEmpty())),
	EMAIL_SMTP_PASSWORD: v.optional(v.pipe(v.string(), v.nonEmpty())),
	PORT: v.optional(
		v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(3001)),
		5000,
	),
});

const result = v.safeParse(schema, process.env);

if (!result.success) {
	const message = "Invalid environment variables";

	log.error(`${message}:`, v.flatten(result.issues).nested);

	const validationError = new Error(message);
	delete validationError.stack;

	throw validationError;
}

export const env = result.output;
