import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { findUserByEmail } from '@/lib/auth/user-repository';
import type { UserRole } from '@/lib/auth/types';

function normalizeRole(role: string | null): UserRole | null {
  if (role === 'employee' || role === 'admin') {
    return role;
  }

  return null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const email = typeof credentials?.email === 'string' ? credentials.email.trim() : '';
        const password = typeof credentials?.password === 'string' ? credentials.password : '';

        if (!email || !password) {
          return null;
        }

        const user = await findUserByEmail(email);
        if (!user || !user.passwordHash) {
          return null;
        }

        const role = normalizeRole(user.role);
        if (!role) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name ?? user.email,
          email: user.email,
          role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? '';
        session.user.role = token.role === 'admin' ? 'admin' : 'employee';
      }

      return session;
    },
  },
});
