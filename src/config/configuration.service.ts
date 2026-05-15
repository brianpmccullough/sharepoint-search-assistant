import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ConfigurationService {
  readonly port: number;
  readonly azure: {
    readonly tenantId: string;
    readonly clientId: string;
    readonly clientSecret: string;
  };
  readonly tenantName: string;

  constructor(configService: ConfigService) {
    this.port = configService.get<number>('port') ?? 3000;
    this.azure = {
      tenantId: configService.get<string>('azure.tenantId') ?? '',
      clientId: configService.get<string>('azure.clientId') ?? '',
      clientSecret: configService.get<string>('azure.clientSecret') ?? '',
    };
    this.tenantName = configService.get<string>('tenantName') ?? '';
  }
}
