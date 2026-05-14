import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtBearerGuard } from './jwt-bearer.guard';

const buildContext = (): ExecutionContext =>
  ({
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
  }) as unknown as ExecutionContext;

describe('JwtBearerGuard', () => {
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
  });

  it('returns true immediately for routes decorated with @NoAuthentication()', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const guard = new JwtBearerGuard(reflector as unknown as Reflector);
    expect(guard.canActivate(buildContext())).toBe(true);
  });

  it('delegates to Passport AuthGuard for protected routes', async () => {
    reflector.getAllAndOverride.mockReturnValue(false);
    const guard = new JwtBearerGuard(reflector as unknown as Reflector);
    const parentPrototype = Object.getPrototypeOf(
      Object.getPrototypeOf(guard),
    ) as { canActivate: () => boolean };
    const spy = jest
      .spyOn(parentPrototype, 'canActivate')
      .mockReturnValue(true);
    const context = buildContext();

    await guard.canActivate(context);

    expect(spy).toHaveBeenCalledWith(context);
    spy.mockRestore();
  });
});
