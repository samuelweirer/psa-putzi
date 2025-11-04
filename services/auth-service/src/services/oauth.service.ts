import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as MicrosoftStrategy } from 'passport-microsoft';
import { UserModel } from '../models/user.model';
import logger from '../utils/logger';

export interface OAuthProfile {
  provider: 'google' | 'microsoft';
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

export class OAuthService {
  /**
   * Initialize OAuth strategies (Google, Microsoft)
   */
  initializeStrategies(): void {
    this.initializeGoogleStrategy();
    this.initializeMicrosoftStrategy();
  }

  /**
   * Initialize Google OAuth2 strategy
   */
  private initializeGoogleStrategy(): void {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/google/callback';

    if (!clientID || !clientSecret) {
      logger.warn('Google OAuth not configured - GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing');
      return;
    }

    passport.use(
      new GoogleStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
          try {
            const oauthProfile: OAuthProfile = {
              provider: 'google',
              providerId: profile.id,
              email: profile.emails?.[0]?.value || '',
              firstName: profile.name?.givenName || '',
              lastName: profile.name?.familyName || '',
              avatarUrl: profile.photos?.[0]?.value,
            };

            const user = await this.findOrCreateOAuthUser(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('Google OAuth error:', error);
            done(error as Error);
          }
        }
      )
    );

    logger.info('Google OAuth strategy initialized');
  }

  /**
   * Initialize Microsoft OAuth2 strategy
   */
  private initializeMicrosoftStrategy(): void {
    const clientID = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const callbackURL = process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3001/api/v1/auth/microsoft/callback';

    if (!clientID || !clientSecret) {
      logger.warn('Microsoft OAuth not configured - MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET missing');
      return;
    }

    passport.use(
      new MicrosoftStrategy(
        {
          clientID,
          clientSecret,
          callbackURL,
          scope: ['user.read'],
        },
        async (_accessToken: any, _refreshToken: any, profile: any, done: any) => {
          try {
            const oauthProfile: OAuthProfile = {
              provider: 'microsoft',
              providerId: profile.id,
              email: profile.emails?.[0]?.value || profile.userPrincipalName || '',
              firstName: profile.name?.givenName || profile.displayName?.split(' ')[0] || '',
              lastName: profile.name?.familyName || profile.displayName?.split(' ').slice(1).join(' ') || '',
              avatarUrl: undefined,
            };

            const user = await this.findOrCreateOAuthUser(oauthProfile);
            done(null, user);
          } catch (error) {
            logger.error('Microsoft OAuth error:', error);
            done(error as Error);
          }
        }
      )
    );

    logger.info('Microsoft OAuth strategy initialized');
  }

  /**
   * Find existing user by OAuth provider or create new one
   */
  async findOrCreateOAuthUser(profile: OAuthProfile): Promise<any> {
    try {
      // Check if user exists with this OAuth provider
      const existingOAuthUser = await UserModel.findByOAuthProvider(profile.provider, profile.providerId);

      if (existingOAuthUser) {
        logger.info(`Existing OAuth user logged in: ${profile.email} via ${profile.provider}`);
        return existingOAuthUser;
      }

      // Check if user exists with this email (link accounts)
      const existingEmailUser = await UserModel.findByEmail(profile.email);

      if (existingEmailUser) {
        // Link OAuth account to existing email account
        const updatedUser = await UserModel.linkOAuthProvider(
          existingEmailUser.id,
          profile.provider,
          profile.providerId
        );

        logger.info(`Linked ${profile.provider} account to existing user: ${profile.email}`);
        return updatedUser;
      }

      // Create new user with OAuth provider
      const newUser = await UserModel.createOAuthUser({
        email: profile.email,
        firstName: profile.firstName,
        lastName: profile.lastName,
        oauthProvider: profile.provider,
        oauthProviderId: profile.providerId,
      });

      logger.info(`New OAuth user created: ${profile.email} via ${profile.provider}`);
      return newUser;
    } catch (error) {
      logger.error('Error in findOrCreateOAuthUser:', error);
      throw error;
    }
  }
}

export const oauthService = new OAuthService();
