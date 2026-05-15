import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { Request } from 'express';
import { ConfigurationService } from '../../config/configuration.service';
import { AuthenticatedUser } from '../model/authenticated-user.model';

interface AadTokenPayload {
  oid: string;
  preferred_username?: string;
  upn?: string;
  name?: string;
}

@Injectable()
export class AzureAdJwtStrategy extends PassportStrategy(
  Strategy,
  'azure-ad-jwt',
) {
  constructor(configurationService: ConfigurationService) {
    const { tenantId, clientId } = configurationService.azure;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: `api://${clientId}`,
      issuer: `https://sts.windows.net/${tenantId}/`,
      algorithms: ['RS256'],
      passReqToCallback: true,
    });
  }

  validate(request: Request, payload: AadTokenPayload): AuthenticatedUser {
    const authHeader = request.headers['authorization'] ?? '';
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');
    return {
      objectId: payload.oid,
      email: payload.preferred_username ?? payload.upn ?? '',
      displayName: payload.name ?? '',
      accessToken,
    };
  }
}
