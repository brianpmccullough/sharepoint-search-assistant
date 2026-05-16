import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ConfigurationService } from './../src/config/configuration.service';
import { SearchResponseModel } from './../src/search/model/search-response.model';

describe('Search (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    const { tenantName } = app.get(ConfigurationService);
    app.enableCors({
      origin: new RegExp(`^https://${tenantName}(-[^.]+)?\\.sharepoint\\.com$`),
    });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /search returns 401 without a bearer token', () => {
    return request(app.getHttpServer()).post('/search').expect(401);
  });

  it('OPTIONS /search with an allowed origin returns CORS headers', () => {
    return request(app.getHttpServer())
      .options('/search')
      .set('Origin', 'https://mmcbpm.sharepoint.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBe(
          'https://mmcbpm.sharepoint.com',
        );
      });
  });

  it('OPTIONS /search with a disallowed origin returns no CORS headers', () => {
    return request(app.getHttpServer())
      .options('/search')
      .set('Origin', 'https://evil.example.com')
      .set('Access-Control-Request-Method', 'POST')
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('POST /search with an invalid bearer token returns 401', () => {
    return request(app.getHttpServer())
      .post('/search')
      .set('Authorization', 'Bearer not-a-valid-token')
      .send({ query: 'test' })
      .expect(401);
  });

  // Checks 3, 4, and 5 require TEST_BEARER_TOKEN — obtain via ./scripts/get-dev-token.sh
  const token = process.env.TEST_BEARER_TOKEN;

  (token ? it : it.skip)(
    'POST /search with missing query field returns 400',
    () => {
      return request(app.getHttpServer())
        .post('/search')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);
    },
  );

  (token ? it : it.skip)(
    'POST /search with an unknown field returns 400',
    () => {
      return request(app.getHttpServer())
        .post('/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'test', unknownField: 'value' })
        .expect(400);
    },
  );

  (token ? it : it.skip)('POST /search with from: -1 returns 400', () => {
    return request(app.getHttpServer())
      .post('/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'test', from: -1 })
      .expect(400);
  });

  (token ? it : it.skip)('POST /search with size: 0 returns 400', () => {
    return request(app.getHttpServer())
      .post('/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ query: 'test', size: 0 })
      .expect(400);
  });

  (token ? it : it.skip)(
    'POST /search with a valid query returns 200 with at least one result with the expected shape',
    () => {
      return request(app.getHttpServer())
        .post('/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'test' })
        .expect(200)
        .expect((res) => {
          const body = res.body as SearchResponseModel;
          expect(body.results.length).toBeGreaterThan(0);
          const first = body.results[0];
          expect(typeof first.title).toBe('string');
          expect(typeof first.url).toBe('string');
          expect(typeof first.summary).toBe('string');
          expect(typeof first.lastModified).toBe('string');
          expect(['file', 'page']).toContain(first.contentType);
        });
    },
  );

  (token ? it : it.skip)(
    'POST /search with size: 3 returns at most 3 results',
    () => {
      return request(app.getHttpServer())
        .post('/search')
        .set('Authorization', `Bearer ${token}`)
        .send({ query: 'test', from: 0, size: 3 })
        .expect(200)
        .expect((res) => {
          const body = res.body as SearchResponseModel;
          expect(body.results.length).toBeGreaterThan(0);
          expect(body.results.length).toBeLessThanOrEqual(3);
        });
    },
  );
});
