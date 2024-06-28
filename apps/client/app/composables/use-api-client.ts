import type { Api } from "@acdh-oeaw/app-server/api";
import { hc } from "hono/client";

export function useApiClient() {
	const env = useRuntimeConfig();
	const apiBaseUrl = env.public.apiBaseUrl;
	const client = hc<Api>(apiBaseUrl);
	return client.api;
}
