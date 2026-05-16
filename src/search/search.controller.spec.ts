import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchRequestModel } from './model/search-request.model';
import { SearchResultModel } from './model/search-response.model';
import { AuthenticatedUser } from '../auth/model/authenticated-user.model';

const mockResult: SearchResultModel = {
  title: 'Document.docx',
  url: 'https://tenant.sharepoint.com/Shared/Document.docx',
  summary: 'A test document',
  lastModified: '2024-01-15T10:00:00Z',
  contentType: 'file',
};

describe('SearchController', () => {
  let controller: SearchController;
  let mockSearch: jest.Mock;

  beforeEach(async () => {
    mockSearch = jest.fn().mockResolvedValue([mockResult]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: { search: mockSearch },
        },
      ],
    }).compile();

    controller = module.get(SearchController);
  });

  const makeAuthenticatedRequest = (
    token = 'user-token',
  ): { user: AuthenticatedUser } => ({
    user: {
      objectId: 'oid-1',
      email: 'user@tenant.com',
      displayName: 'Test User',
      accessToken: token,
    },
  });

  it('delegates to SearchService.search() with the bearer token and request body', async () => {
    const body: SearchRequestModel = { query: 'test' };
    await controller.search(makeAuthenticatedRequest(), body);
    expect(mockSearch).toHaveBeenCalledWith('user-token', body);
  });

  it('returns a SearchResponseModel wrapping the results from SearchService', async () => {
    const body: SearchRequestModel = { query: 'test' };
    const response = await controller.search(makeAuthenticatedRequest(), body);
    expect(response).toEqual({ results: [mockResult] });
  });
});
