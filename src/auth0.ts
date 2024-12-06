import { OAuth2Strategy } from "remix-auth-oauth2";
import type { Strategy } from "remix-auth/strategy";

/**
 * @see https://auth0.com/docs/get-started/apis/scopes/openid-connect-scopes#standard-claims
 */
type Auth0Scopes = Array<(string & {}) | "email" | "openid" | "profile">;

export interface Auth0StrategyOptions
	extends Pick<
		OAuth2Strategy.ConstructorOptions,
		"clientId" | "clientSecret" | "redirectURI" | "scopes"
	> {
	/**
	 * OAuth2 strategy options
	 */
	scopes?: Auth0Scopes;

	/**
	 * Auth0 strategy options
	 */
	domain: string;
	audience?: string;
	organization?: string;
	invitation?: string;
	connection?: string;
}

export const Auth0StrategyDefaultName = "auth0";

export class Auth0Strategy<User> extends OAuth2Strategy<User> {
	public override name = Auth0StrategyDefaultName;

	private scopes: Auth0Scopes;
	private readonly audience?: string;
	private readonly organization?: string;
	private readonly invitation?: string;
	private readonly connection?: string;

	public constructor(
		options: Auth0StrategyOptions,
		verify: Strategy.VerifyFunction<User, OAuth2Strategy.VerifyOptions>,
	) {
		super(
			{
				authorizationEndpoint: `https://${options.domain}/authorize`,
				tokenEndpoint: `https://${options.domain}/oauth/token`,
				tokenRevocationEndpoint: `https://${options.domain}/oauth/revoke`,
				clientId: options.clientId,
				clientSecret: options.clientSecret,
				redirectURI: options.redirectURI,
			},
			verify,
		);

		this.scopes = options.scopes ?? ["openid", "profile", "email"];
		this.audience = options.audience;
		this.organization = options.organization;
		this.invitation = options.invitation;
		this.connection = options.connection;
	}

	protected override authorizationParams(
		params: URLSearchParams,
		request: Request,
	) {
		params.set("scope", this.scopes.join(" "));
		if (this.audience) {
			params.set("audience", this.audience);
		}
		if (this.organization) {
			params.set("organization", this.organization);
		}
		if (this.invitation) {
			params.set("invitation", this.invitation);
		}
		if (this.connection) {
			params.set("connection", this.connection);
		}

		// Add additional search params
		const requestSearchParams = new URL(request.url).searchParams;
		for (const [key, value] of requestSearchParams) {
			params.set(key, value);
		}

		return params;
	}
}
