import { assert } from "@acdh-oeaw/lib";
import { createTransport, type SendMailOptions } from "nodemailer";

import { subjectPrefix } from "@/config/email.config";
import { env } from "@/config/env.config";

interface SendEmailParams
	extends Pick<SendMailOptions, "attachments" | "subject" | "text" | "to"> {}

export function sendEmail(params: SendEmailParams) {
	const { attachments, subject, text, to } = params;

	assert(env.EMAIL_SMTP_SERVER, "Invalid email configuration.");
	assert(env.EMAIL_SMTP_PORT, "Invalid email configuration.");
	assert(env.EMAIL_ADDRESS, "Invalid email configuration.");

	const transporter = createTransport({
		host: env.EMAIL_SMTP_SERVER,
		port: env.EMAIL_SMTP_PORT,
		secure: false,
		auth:
			env.EMAIL_SMTP_USERNAME && env.EMAIL_SMTP_PASSWORD
				? {
						user: env.EMAIL_SMTP_USERNAME,
						pass: env.EMAIL_SMTP_PASSWORD,
					}
				: undefined,
	});

	return transporter.sendMail({
		from: env.EMAIL_ADDRESS,
		to,
		subject: [subjectPrefix, subject].join(" "),
		text,
		attachments,
	});
}
