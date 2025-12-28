import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare, hash } from "bcryptjs";
import { prisma } from "./src/lib/db/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user
        let user = await prisma.user.findUnique({
          where: { email },
        });

        // If no user exists and this is the default admin, create it
        if (!user && email === process.env.AUTH_EMAIL) {
          const defaultPassword = process.env.AUTH_PASSWORD;
          if (defaultPassword && password === defaultPassword) {
            // Create the default user
            user = await prisma.user.create({
              data: {
                email,
                passwordHash: await hash(password, 12),
              },
            });
          }
        }

        if (!user) {
          return null;
        }

        // Verify password
        const isValid = await compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname === "/login";
      const isOnApi = nextUrl.pathname.startsWith("/api");

      // Allow API routes to handle their own auth
      if (isOnApi) {
        return true;
      }

      // If on login page
      if (isOnLogin) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/", nextUrl));
        }
        return true;
      }

      // All other pages require auth
      if (!isLoggedIn) {
        return false; // Redirect to login
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
