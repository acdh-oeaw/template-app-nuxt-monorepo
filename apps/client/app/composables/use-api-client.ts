import type { AppType } from "@acdh-oeaw/app-server/app";
import { hc } from "hono/client";

export function useApiClient() {
	const env = useRuntimeConfig();
	const apiBaseUrl = env.public.apiBaseUrl;
	const client = hc<AppType>(apiBaseUrl);
	return client.api;
}
