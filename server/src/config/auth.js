import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";
import { MongoClient } from "mongodb";
import { env, isProd } from "./env.js";

// Better Auth uses the native driver. The driver connects lazily on first use.
const client = new MongoClient(env.MONGODB_URI);
const db = client.db();

// A social provider is only enabled when both its credentials are present.
const socialProviders = {};

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  };
}

if (env.FACEBOOK_CLIENT_ID && env.FACEBOOK_CLIENT_SECRET) {
  socialProviders.facebook = {
    clientId: env.FACEBOOK_CLIENT_ID,
    clientSecret: env.FACEBOOK_CLIENT_SECRET,
  };
}

export const auth = betterAuth({
  appName: "HCM Lite",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db),
  trustedOrigins: [env.CLIENT_URL],

  plugins: [admin()],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
    // Enable once you add an email provider:
    // requireEmailVerification: true,
    // sendResetPassword: async ({ user, url }) => { /* send email */ },
  },

  socialProviders,

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh daily
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },

  advanced: { useSecureCookies: isProd },
});
