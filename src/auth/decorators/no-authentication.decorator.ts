import { SetMetadata } from '@nestjs/common';

export const NO_AUTHENTICATION_KEY = 'noAuthentication';
export const NoAuthentication = () => SetMetadata(NO_AUTHENTICATION_KEY, true);
