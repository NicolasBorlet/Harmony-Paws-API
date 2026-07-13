import { AuthProvider } from '@prisma/client';

export type OAuthProfile = {
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  emailVerified: boolean;
  firstName?: string | null;
  lastName?: string | null;
};
