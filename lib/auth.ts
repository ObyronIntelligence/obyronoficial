import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function getAllowedEmails() {
  const rawValue =
    process.env.AUTH_ALLOWED_EMAILS ||
    process.env.GOOGLE_ALLOWED_EMAILS ||
    process.env.AUTH_TEST_EMAILS ||
    "";

  return new Set(
    rawValue
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    error: "/auth/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== "google") {
        return true;
      }

      const email = user.email?.toLowerCase();
      if (!email) {
        return "/auth/signin?error=NoEmail";
      }

      const allowedEmails = getAllowedEmails();
      if (allowedEmails.size === 0) {
        return "/auth/signin?error=WhitelistNotConfigured";
      }

      if (!allowedEmails.has(email)) {
        return "/auth/signin?error=AccessDenied";
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = typeof token.email === "string" ? token.email : null;
        session.user.name = typeof token.name === "string" ? token.name : null;
        session.user.image = typeof token.picture === "string" ? token.picture : null;
      }

      return session;
    },
  },
};
