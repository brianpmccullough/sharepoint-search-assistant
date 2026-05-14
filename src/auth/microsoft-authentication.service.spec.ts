import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigurationService } from '../config/configuration.service';

let mockAcquireTokenOnBehalfOf: jest.Mock;

jest.mock('@azure/msal-node', () => {
  class AuthError extends Error {
    errorCode: string;
    constructor(errorCode: string, errorMessage: string) {
      super(errorMessage);
      this.errorCode = errorCode;
    }
  }

  const ConfidentialClientApplication = jest.fn();

  return { AuthError, ConfidentialClientApplication };
});

import { ConfidentialClientApplication, AuthError } from '@azure/msal-node';
import { MicrosoftAuthenticationService } from './microsoft-authentication.service';

describe('MicrosoftAuthenticationService', () => {
  let service: MicrosoftAuthenticationService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockAcquireTokenOnBehalfOf = jest.fn();
    (ConfidentialClientApplication as jest.Mock).mockImplementation(() => ({
      acquireTokenOnBehalfOf: mockAcquireTokenOnBehalfOf,
    }));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MicrosoftAuthenticationService,
        {
          provide: ConfigurationService,
          useValue: {
            azure: {
              tenantId: 'test-tenant',
              clientId: 'test-client',
              clientSecret: 'test-secret',
            },
          },
        },
      ],
    }).compile();

    service = module.get<MicrosoftAuthenticationService>(
      MicrosoftAuthenticationService,
    );
  });

  it('returns a Graph access token on successful exchange', async () => {
    mockAcquireTokenOnBehalfOf.mockResolvedValue({
      accessToken: 'graph-token-123',
    });
    await expect(service.exchangeForGraphToken('user-token')).resolves.toBe(
      'graph-token-123',
    );
  });

  it('throws UnauthorizedException when MSAL returns no access token', async () => {
    mockAcquireTokenOnBehalfOf.mockResolvedValue({ accessToken: null });
    await expect(service.exchangeForGraphToken('user-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws UnauthorizedException on MSAL AuthError', async () => {
    mockAcquireTokenOnBehalfOf.mockRejectedValue(
      new AuthError('invalid_grant', 'Token expired'),
    );
    await expect(service.exchangeForGraphToken('user-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rethrows non-MSAL errors', async () => {
    mockAcquireTokenOnBehalfOf.mockRejectedValue(new Error('Network failure'));
    await expect(service.exchangeForGraphToken('user-token')).rejects.toThrow(
      'Network failure',
    );
  });
});
