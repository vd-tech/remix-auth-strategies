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

import { Auth0Strategy } from "../src/auth0";

const server = setupServer(
	http.post("https://test.fake.auth0.com/oauth/token", () =>
		HttpResponse.json({
			access_token: "access token",
			scope: "custom",
			expires_in: 86400,
			token_type: "Bearer",
		}),
	),
);

describe(Auth0Strategy.name, () => {
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
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

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

	test("should have the scope `openid profile email` as default", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("scope")).toBe(
				"openid profile email",
			);
		}
	});

	test("should correctly format the authorization URL", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;

			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.hostname).toBe("test.fake.auth0.com");
			expect(redirectUrl.pathname).toBe("/authorize");
		}
	});

	test("should allow changing the audience", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
				audience: "SOME_AUDIENCE",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("audience")).toBe("SOME_AUDIENCE");
		}
	});

	test("should allow changing the organization", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
				audience: "SOME_AUDIENCE",
				organization: "SOME_ORG",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("organization")).toBe("SOME_ORG");
		}
	});

	test("should allow setting an invitation", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
				audience: "SOME_AUDIENCE",
				organization: "SOME_ORG",
				invitation: "SOME_INVITATION",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("invitation")).toBe(
				"SOME_INVITATION",
			);
		}
	});

	test("should allow setting the connection type", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
				audience: "SOME_AUDIENCE",
				organization: "SOME_ORG",
				connection: "email",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0");

		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("connection")).toBe("email");
		}
	});

	test("should not fetch user profile when openid scope is not present", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
				scopes: ["custom"],
			},
			verify,
		);

		const header = new SetCookie({
			name: "oauth2",
			value: new URLSearchParams({
				state: "random-state",
				codeVerifier: "random-code-verifier",
			}).toString(),
			httpOnly: true, // Prevents JavaScript from accessing the cookie
			maxAge: 60 * 5, // 5 minutes
			path: "/", // Allow the cookie to be sent to any path
			sameSite: "Lax", // Prevents it from being sent in cross-site requests
		});

		const request = new Request(
			"https://example.com/callback?state=random-state&code=random-code",
			{
				headers: { cookie: header.toString() },
			},
		);

		server.use(
			http.post(
				"https://test.fake.auth0.com/oauth/token",
				() =>
					HttpResponse.json({
						access_token: "access token",
						scope: "custom",
						expires_in: 86_400,
						token_type: "Bearer",
					}),
				{ once: true },
			),
		);

		await strategy.authenticate(request);

		expect(verify).toHaveBeenLastCalledWith({
			tokens: {
				data: {
					access_token: "access token",
					expires_in: 86_400,
					scope: "custom",
					token_type: "Bearer",
				},
			},
			request,
		});
	});

	test("should allow additional search params", async () => {
		const strategy = new Auth0Strategy(
			{
				domain: "test.fake.auth0.com",
				clientId: "CLIENT_ID",
				clientSecret: "CLIENT_SECRET",
				redirectURI: "https://example.app/callback",
			},
			verify,
		);

		const request = new Request("https://example.app/auth/auth0?test=1");
		try {
			await strategy.authenticate(request);
		} catch (error) {
			if (!(error instanceof Response)) throw error;
			const location = error.headers.get("Location");

			if (!location) throw new Error("No redirect header");

			const redirectUrl = new URL(location);

			expect(redirectUrl.searchParams.get("test")).toBe("1");
		}
	});
});
