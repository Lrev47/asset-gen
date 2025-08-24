import { NextAuthOptions } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        // Check against environment variables
        const adminUsername = process.env.ADMIN_USERNAME;
        const adminPassword = process.env.ADMIN_PASSWORD;

        if (!adminUsername || !adminPassword) {
          console.error('Admin credentials not configured in environment variables');
          return null;
        }

        // Verify credentials
        if (credentials.username === adminUsername && credentials.password === adminPassword) {
          // Find or create the admin user in database
          let user = await prisma.user.findUnique({
            where: { username: adminUsername },
          });

          if (!user) {
            // Create the admin user if it doesn't exist
            user = await prisma.user.create({
              data: {
                username: adminUsername,
                name: 'Administrator',
                email: `${adminUsername}@localhost`,
              },
            });
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            username: user.username,
          };
        }

        return null;
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
      if (token) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  debug: process.env.NODE_ENV === 'development',
};