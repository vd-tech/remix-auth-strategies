import { OAuth2Strategy } from "remix-auth-oauth2";
import type { Strategy } from "remix-auth/strategy";

/**
 * @see https://learn.microsoft.com/en-us/azure/active-directory-b2c/tokens-overview
 */
type AzureScopes = Array<
	(string & {}) | "openid" | "profile" | "offline_access"
>;

export interface AzureStrategyOptions
	extends Pick<
		OAuth2Strategy.ConstructorOptions,
		"clientId" | "clientSecret" | "redirectURI"
	> {
	/**
	 * OAuth2 strategy options
	 */
	scopes?: AzureScopes;

	/**
	 * Azure B2C specific options
	 */
	domain: string;
	tenant: string;
	policy: string;
	prompt?: "none" | "login" | "consent" | "select_account";
}

export const AzureStrategyDefaultName = "azure";

export class AzureStrategy<User> extends OAuth2Strategy<User> {
	public override name = AzureStrategyDefaultName;

	private scopes: AzureScopes;
	private readonly prompt?: string;

	constructor(
		options: AzureStrategyOptions,
		verify: Strategy.VerifyFunction<User, OAuth2Strategy.VerifyOptions>,
	) {
		const baseUrl = `https://${options.domain}/${options.tenant}/${options.policy}/oauth2/v2.0`;

		super(
			{
				authorizationEndpoint: `${baseUrl}/authorize`,
				tokenEndpoint: `${baseUrl}/token`,
				clientId: options.clientId,
				clientSecret: options.clientSecret,
				redirectURI: options.redirectURI,
			},
			verify,
		);

		this.scopes = options.scopes ?? ["openid", "profile", "offline_access"];
		this.prompt = options.prompt;
	}

	protected override authorizationParams(params: URLSearchParams) {
		params.set("scope", this.scopes.join(" "));
		if (this.prompt) {
			params.set("prompt", this.prompt);
		}
		return params;
	}
}
