import { sendEmail } from "@/lib/send-email";

interface SendPasswordResetTokenParams {
	email: string;
	url: URL;
}

export async function sendPasswordResetToken(params: SendPasswordResetTokenParams) {
	const { email, url } = params;

	await sendEmail({
		to: email,
		subject: "Password reset token",
		text: `Reset your password at ${String(url)}.`,
	});
}
