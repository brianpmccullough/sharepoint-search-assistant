import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { AzureAdJwtStrategy } from './strategies/azure-ad-jwt.strategy';
import { JwtBearerGuard } from './guards/jwt-bearer.guard';
import { MicrosoftAuthenticationService } from './microsoft-authentication.service';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'azure-ad-jwt' })],
  providers: [
    AzureAdJwtStrategy,
    MicrosoftAuthenticationService,
    {
      provide: APP_GUARD,
      useClass: JwtBearerGuard,
    },
  ],
  exports: [MicrosoftAuthenticationService],
})
export class AuthModule {}
