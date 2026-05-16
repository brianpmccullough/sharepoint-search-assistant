import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { MicrosoftAuthenticationService } from '../auth/microsoft-authentication.service';
import { SearchRequestModel } from './model/search-request.model';
import {
  SearchContentType,
  SearchResultModel,
} from './model/search-response.model';

const GRAPH_SEARCH_URL = 'https://graph.microsoft.com/v1.0/search/query';

interface GraphSearchResource {
  '@odata.type': string;
  name?: string;
  webUrl?: string;
  lastModifiedDateTime?: string;
  fields?: { title?: string };
}

interface GraphSearchHit {
  hitHighlightedSummary?: string;
  resource: GraphSearchResource;
}

interface GraphSearchResponse {
  value: Array<{
    hitsContainers: Array<{
      hits?: GraphSearchHit[];
    }>;
  }>;
}

@Injectable()
export class SearchService {
  constructor(private readonly authService: MicrosoftAuthenticationService) {}

  async search(
    accessToken: string,
    request: SearchRequestModel,
  ): Promise<SearchResultModel[]> {
    const graphToken =
      await this.authService.exchangeForGraphToken(accessToken);
    const from = request.from ?? 0;
    const size = request.size ?? 25;

    const body = {
      requests: [
        {
          entityTypes: ['driveItem', 'listItem'],
          query: { queryString: request.query },
          from,
          size,
          fields: ['title', 'name', 'webUrl', 'lastModifiedDateTime'],
        },
      ],
    };

    try {
      const response = await axios.post<GraphSearchResponse>(
        GRAPH_SEARCH_URL,
        body,
        { headers: { Authorization: `Bearer ${graphToken}` } },
      );
      const hits: GraphSearchHit[] =
        response.data.value[0]?.hitsContainers[0]?.hits ?? [];
      return hits.map((hit) => this.normalizeHit(hit));
    } catch (error) {
      this.handleGraphError(error);
    }
  }

  private normalizeHit(hit: GraphSearchHit): SearchResultModel {
    const { resource } = hit;
    const contentType: SearchContentType = resource['@odata.type']?.includes(
      'listItem',
    )
      ? 'page'
      : 'file';
    const title =
      (contentType === 'page' ? resource.fields?.title : undefined) ??
      resource.name ??
      '';

    return {
      title,
      url: resource.webUrl ?? '',
      summary: hit.hitHighlightedSummary ?? '',
      lastModified: resource.lastModifiedDateTime ?? '',
      contentType,
    };
  }

  private handleGraphError(error: unknown): never {
    if (error instanceof AxiosError && error.response) {
      const { status } = error.response;
      if (status === 401) {
        throw new UnauthorizedException('Graph API authentication failed');
      }
      if (status === 403) {
        throw new ForbiddenException('Graph API access denied');
      }
    }
    throw new InternalServerErrorException('Graph search request failed');
  }
}
