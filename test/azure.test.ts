import {
	afterAll,
	afterEach,
	beforeAll,
	describe,
	expect,
	mock,
	test,
} from "bun:test";
import { SetCookie } from "@mjackson/headers";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/native";

import { AzureStrategy } from "../src/azure";

const server = setupServer(
	http.post(
		"https://test.b2clogin.com/test-tenant/B2C_1_SUSI/oauth2/v2.0/token",
		() =>
			HttpResponse.json({
				access_token: "access_token",
				scope: "openid profile offline_access",
				expires_in: 3600,
				token_type: "Bearer",
			}),
	),
);

describe(AzureStrategy.name, () => {
	const verify = mock();

	beforeAll(() => {
		server.listen();
	});

	afterEach(() => {
		verify.mockReset();
		server.resetHandlers();
	});

	afterAll(() => {
		server.close();
	});

	test("should allow changing the scope", async () => {
		const strategy = new AzureStrategy(
			{
				domain: "test.b2clogin.com",
				tenant: "test-tenant",
				policy: "B2C_1_SUSI",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
			},
			verify,
		);

		const request = new Request("https://example.app/auth/azure");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("scope")).toBe("custom");
		}
	});

	test("should have the scope `openid profile offline_access` as default", async () => {
		const strategy = new AzureStrategy(
			{
				domain: "test.b2clogin.com",
				tenant: "test-tenant",
				policy: "B2C_1_SUSI",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/azure");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("scope")).toBe(
				"openid profile offline_access",
			);
		}
	});

	test("should correctly format the authorization URL with tenant and policy", async () => {
		const strategy = new AzureStrategy(
			{
				domain: "test.b2clogin.com",
				tenant: "test-tenant",
				policy: "B2C_1_SUSI",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/azure");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;

			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.hostname).toBe("test.b2clogin.com");
			expect(redirectUrl.pathname).toBe(
				"/test-tenant/B2C_1_SUSI/oauth2/v2.0/authorize",
			);
		}
	});

	test("should have prompt=none as default", async () => {
		const strategy = new AzureStrategy(
			{
				domain: "test.b2clogin.com",
				tenant: "test-tenant",
				policy: "B2C_1_SUSI",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/azure");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("prompt")).toBe("none");
		}
	});

	test("should allow setting different prompt values", async () => {
		const prompts = ["login", "consent", "select_account"] as const;

		for (const promptValue of prompts) {
			const strategy = new AzureStrategy(
				{
					domain: "test.b2clogin.com",
					tenant: "test-tenant",
					policy: "B2C_1_SUSI",
					clientId: "CLIENT_ID",
					clientSecret: "CLIENT_SECRET",
					redirectURI: "https://example.app/callback",
					prompt: promptValue,
				},
				verify,
			);

			const request = new Request("https://example.app/auth/azure");

			try {
				await strategy.authenticate(request);
			} catch (error) {
				if (!(error instanceof Response)) throw error;
				const location = error.headers.get("Location");

				if (!location) throw new Error("No redirect header");

				const redirectUrl = new URL(location);

				expect(redirectUrl.searchParams.get("prompt")).toBe(promptValue);
			}
		}
	});

	test("should use the correct token endpoint", async () => {
		const strategy = new AzureStrategy(
			{
				domain: "test.b2clogin.com",
				tenant: "test-tenant",
				policy: "B2C_1_SUSI",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const header = new SetCookie({
			name: "oauth2",
			value: new URLSearchParams({
				state: "random-state",
				codeVerifier: "random-code-verifier",
			}).toString(),
			httpOnly: true,
			maxAge: 60 * 5,
			path: "/",
			sameSite: "Lax",
		});

		const request = new Request(
			"https://example.com/callback?state=random-state&code=random-code",
			{
				headers: { cookie: header.toString() },
			},
		);

		await strategy.authenticate(request);

		expect(verify).toHaveBeenCalledWith({
			tokens: {
				data: {
					access_token: "access_token",
					scope: "openid profile offline_access",
					expires_in: 3600,
					token_type: "Bearer",
				},
			},
			request,
		});
	});
});
