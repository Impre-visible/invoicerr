import 'dotenv/config'

import { GenericOAuthConfig, genericOAuth } from "better-auth/plugins"

import { PrismaClient } from "../../prisma/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { betterAuth } from "better-auth";
import { env } from 'prisma/config'
import { prismaAdapter } from "better-auth/adapters/prisma";

const adapter = new PrismaPg({ connectionString: env("DATABASE_URL")! });

const prisma = new PrismaClient({ adapter });


const createOidcConfig = (): GenericOAuthConfig[] => {
    const config: GenericOAuthConfig = {
        providerId: process.env.OIDC_NAME || "Generic OIDC",
        clientId: process.env.OIDC_CLIENT_ID || 'TEMP',
        scopes: ['openid', 'profile', 'email'],
    };

    if (process.env.OIDC_CLIENT_SECRET) {
        config.clientSecret = process.env.OIDC_CLIENT_SECRET;
    }

    if (process.env.OIDC_JWKS_URI) {
        config.discoveryUrl = process.env.OIDC_JWKS_URI;
    } else {
        if (process.env.OIDC_AUTHORIZATION_ENDPOINT) {
            config.authorizationUrl = process.env.OIDC_AUTHORIZATION_ENDPOINT;
        }
        if (process.env.OIDC_TOKEN_ENDPOINT) {
            config.tokenUrl = process.env.OIDC_TOKEN_ENDPOINT;
        }
        if (process.env.OIDC_USERINFO_ENDPOINT) {
            config.userInfoUrl = process.env.OIDC_USERINFO_ENDPOINT;
        }
    }

    console.log("OIDC Config:", config);

    return [config];
};

const userHookFunction = async (user) => {
    const data = user;

    if (user.given_name && user.family_name) {
        data["firstname"] = user.given_name;
        data["lastname"] = user.family_name;
    }

    if (user.firstname && user.lastname) {
        data["name"] = `${user.firstname} ${user.lastname}`;
    }

    return { data };
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            firstname: {
                type: 'string',
                required: true,
                input: true,
            },
            lastname: {
                type: 'string',
                required: true,
                input: true,
            },
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: userHookFunction,
                update: (ctx) => userHookFunction(ctx.data),
            },
        },
    },
    plugins: process.env.OIDC_CLIENT_ID
        ? [genericOAuth({ config: createOidcConfig() })]
        : [],
});
