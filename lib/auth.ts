import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@/lib/db/prisma";

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const betterAuthUrl = process.env.BETTER_AUTH_URL;

const trustedOrigins = [
  betterAuthUrl,
  process.env.NEXT_PUBLIC_APP_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  process.env.NODE_ENV === "development" ? "http://localhost:3000" : undefined,
].filter((origin): origin is string => Boolean(origin));

const socialProviders = {
  ...(googleClientId && googleClientSecret
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : {}),
  ...(spotifyClientId && spotifyClientSecret
    ? {
        spotify: {
          clientId: spotifyClientId,
          clientSecret: spotifyClientSecret,
          scope: ["playlist-read-private", "playlist-read-collaborative"],
        },
      }
    : {}),
};

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  appName: "side-a",
  emailAndPassword: {
    enabled: true,
  },
  socialProviders,
  trustedOrigins,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 20,
    storage: "memory",
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: betterAuthUrl,
});
