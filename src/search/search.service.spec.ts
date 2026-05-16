import {
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import axios, { AxiosError } from 'axios';
import { MicrosoftAuthenticationService } from '../auth/microsoft-authentication.service';
import { SearchRequestModel } from './model/search-request.model';
import { SearchService } from './search.service';

jest.mock('axios');
const mockedAxiosPost = jest.spyOn(axios, 'post');

const GRAPH_TOKEN = 'graph-token';

const makeDriveItemHit = (overrides: Record<string, unknown> = {}) => ({
  hitHighlightedSummary: 'A <c0>test</c0> document',
  resource: {
    '@odata.type': '#microsoft.graph.driveItem',
    name: 'Document.docx',
    webUrl: 'https://tenant.sharepoint.com/Shared/Document.docx',
    lastModifiedDateTime: '2024-01-15T10:00:00Z',
    ...overrides,
  },
});

const makeListItemHit = (overrides: Record<string, unknown> = {}) => ({
  hitHighlightedSummary: 'A <c0>test</c0> page',
  resource: {
    '@odata.type': '#microsoft.graph.listItem',
    fields: { title: 'Home' },
    webUrl: 'https://tenant.sharepoint.com/SitePages/Home.aspx',
    lastModifiedDateTime: '2024-02-20T09:00:00Z',
    ...overrides,
  },
});

const makeGraphResponse = (hits: unknown[]) => ({
  data: { value: [{ hitsContainers: [{ hits }] }] },
});

const makeAxiosError = (status: number): AxiosError => {
  const error = new AxiosError('Request failed');
  error.response = {
    status,
    data: {},
    headers: {},
    config: error.config ?? ({} as never),
    statusText: '',
  };
  return error;
};

describe('SearchService', () => {
  let service: SearchService;
  let mockExchangeForGraphToken: jest.Mock;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockExchangeForGraphToken = jest.fn().mockResolvedValue(GRAPH_TOKEN);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: MicrosoftAuthenticationService,
          useValue: { exchangeForGraphToken: mockExchangeForGraphToken },
        },
      ],
    }).compile();

    service = module.get(SearchService);
  });

  const baseRequest = (): SearchRequestModel => ({ query: 'test' });

  it('normalizes a driveItem hit with contentType file', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([makeDriveItemHit()]));
    const results = await service.search('user-token', baseRequest());
    expect(results[0]).toMatchObject({
      title: 'Document.docx',
      url: 'https://tenant.sharepoint.com/Shared/Document.docx',
      lastModified: '2024-01-15T10:00:00Z',
      contentType: 'file',
    });
  });

  it('normalizes a listItem hit with contentType page', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([makeListItemHit()]));
    const results = await service.search('user-token', baseRequest());
    expect(results[0]).toMatchObject({
      title: 'Home',
      url: 'https://tenant.sharepoint.com/SitePages/Home.aspx',
      lastModified: '2024-02-20T09:00:00Z',
      contentType: 'page',
    });
  });

  it('populates summary from hitHighlightedSummary when present', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([makeDriveItemHit()]));
    const results = await service.search('user-token', baseRequest());
    expect(results[0].summary).toBe('A <c0>test</c0> document');
  });

  it('defaults summary to empty string when hitHighlightedSummary is absent', async () => {
    const hit = makeDriveItemHit() as Partial<
      ReturnType<typeof makeDriveItemHit>
    >;
    delete hit.hitHighlightedSummary;
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([hit]));
    const results = await service.search('user-token', baseRequest());
    expect(results[0].summary).toBe('');
  });

  it('passes from and size through to the Graph request body', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([]));
    await service.search('user-token', { query: 'test', from: 10, size: 5 });
    const body = (mockedAxiosPost.mock.calls[0] as unknown[])[1] as {
      requests: { from: number; size: number }[];
    };
    expect(body.requests[0]).toMatchObject({ from: 10, size: 5 });
  });

  it('uses defaults (from: 0, size: 25) when not provided in the request', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([]));
    await service.search('user-token', baseRequest());
    const body = (mockedAxiosPost.mock.calls[0] as unknown[])[1] as {
      requests: { from: number; size: number }[];
    };
    expect(body.requests[0]).toMatchObject({ from: 0, size: 25 });
  });

  it('returns an empty array when Graph returns no hits', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([]));
    const results = await service.search('user-token', baseRequest());
    expect(results).toEqual([]);
  });

  it('throws UnauthorizedException when Graph returns 401', async () => {
    mockedAxiosPost.mockRejectedValue(makeAxiosError(401));
    await expect(service.search('user-token', baseRequest())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('throws ForbiddenException when Graph returns 403', async () => {
    mockedAxiosPost.mockRejectedValue(makeAxiosError(403));
    await expect(service.search('user-token', baseRequest())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws InternalServerErrorException for unexpected Graph errors', async () => {
    mockedAxiosPost.mockRejectedValue(new Error('Network failure'));
    await expect(service.search('user-token', baseRequest())).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('uses the OBO-exchanged Graph token in the Authorization header', async () => {
    mockedAxiosPost.mockResolvedValue(makeGraphResponse([]));
    await service.search('user-token', baseRequest());
    expect(mockExchangeForGraphToken).toHaveBeenCalledWith('user-token');
    const config = (mockedAxiosPost.mock.calls[0] as unknown[])[2] as {
      headers: Record<string, string>;
    };
    expect(config.headers['Authorization']).toBe(`Bearer ${GRAPH_TOKEN}`);
  });
});
