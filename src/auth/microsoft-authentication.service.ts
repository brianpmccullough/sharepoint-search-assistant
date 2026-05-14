import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  AuthError,
  ConfidentialClientApplication,
  Configuration,
  OnBehalfOfRequest,
} from '@azure/msal-node';
import { ConfigurationService } from '../config/configuration.service';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';

@Injectable()
export class MicrosoftAuthenticationService {
  private readonly msalClient: ConfidentialClientApplication;

  constructor(configurationService: ConfigurationService) {
    const msalConfig: Configuration = {
      auth: {
        clientId: configurationService.azure.clientId,
        authority: `https://login.microsoftonline.com/${configurationService.azure.tenantId}`,
        clientSecret: configurationService.azure.clientSecret,
      },
    };
    this.msalClient = new ConfidentialClientApplication(msalConfig);
  }

  async exchangeForGraphToken(accessToken: string): Promise<string> {
    const oboRequest: OnBehalfOfRequest = {
      oboAssertion: accessToken,
      scopes: [GRAPH_SCOPE],
    };

    try {
      const result = await this.msalClient.acquireTokenOnBehalfOf(oboRequest);
      if (!result?.accessToken) {
        throw new UnauthorizedException(
          'OBO token exchange returned no access token',
        );
      }
      return result.accessToken;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      if (error instanceof AuthError) {
        throw new UnauthorizedException('Token exchange failed');
      }
      throw error;
    }
  }
}
