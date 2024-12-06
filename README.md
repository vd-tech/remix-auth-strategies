# Remix Auth - Strategies

> A collection of authentication strategies for Remix Auth, designed to simplify the integration of various OAuth2 providers.

This repository provides a set of pre-built strategies for use with Remix Auth, allowing developers to easily integrate authentication with popular OAuth2 providers like Azure AD B2C and Auth0. Each strategy is designed to be flexible and customizable, supporting a wide range of use cases and configurations.

## Features

- **Multiple Strategies**: Includes strategies for Azure AD B2C and Auth0, with more to come.
- **Customizable**: Easily configure scopes, prompts, and other OAuth2 parameters.
- **TypeScript Support**: Fully typed for a better development experience.
- **Tested**: Each strategy comes with a comprehensive suite of tests to ensure reliability.

## Installation

Install the package using your preferred package manager:

```bash
npm install @vd-tech/remix-auth-strategies
# or
yarn add @vd-tech/remix-auth-strategies
```

## Usage

### Azure AD B2C Strategy

```typescript
import { AzureB2CStrategy } from "@vd-tech/remix-auth-strategies";

const azureStrategy = new AzureB2CStrategy(
  {
    domain: "your-tenant.b2clogin.com",
    tenant: "your-tenant",
    policy: "B2C_1_signin",
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectURI: "http://localhost:3000/auth/callback",
    scopes: ["openid", "profile", "offline_access"],
    prompt: "login",
  },
  async ({ profile }) => {
    // Handle user verification here
    return { id: profile.id, email: profile.emails[0].value };
  }
);
```

### Auth0 Strategy

```typescript
import { Auth0Strategy } from "@vd-tech/remix-auth-strategies";

const auth0Strategy = new Auth0Strategy(
  {
    domain: "your-domain.auth0.com",
    clientId: "your-client-id",
    clientSecret: "your-client-secret",
    redirectURI: "http://localhost:3000/auth/callback",
    scopes: ["openid", "profile", "email"],
  },
  async ({ profile }) => {
    // Handle user verification here
    return { id: profile.id, email: profile.emails[0].value };
  }
);
```

## Supported Runtimes

| Runtime    | Has Support |
| ---------- | ----------- |
| Node.js    | ✅          |
| Cloudflare | ✅          |

## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Maintainers

- [Paul van Dyk](https://github.com/paul-vd)

## Acknowledgments

Special thanks to the Remix Auth community for their support and contributions.
