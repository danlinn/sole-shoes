import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "./db";

function parseAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS;
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(db) as never,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/signup",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;
        if (user.disabled) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { isAdmin: true, disabled: true },
        });
        const email = session.user.email?.toLowerCase();
        const isEnvAdmin =
          email !== undefined &&
          email.length > 0 &&
          parseAdminEmails().includes(email);
        (session.user as unknown as Record<string, unknown>).isAdmin =
          Boolean(dbUser?.isAdmin) || isEnvAdmin;
        (session.user as unknown as Record<string, unknown>).disabled =
          Boolean(dbUser?.disabled);
      }
      return session;
    },
  },
});
