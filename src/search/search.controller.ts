import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser } from '../auth/model/authenticated-user.model';
import { SearchRequestModel } from './model/search-request.model';
import { SearchResponseModel } from './model/search-response.model';
import { SearchService } from './search.service';

@ApiBearerAuth()
@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Search SharePoint content' })
  async search(
    @Request() req: { user: AuthenticatedUser },
    @Body() body: SearchRequestModel,
  ): Promise<SearchResponseModel> {
    const results = await this.searchService.search(req.user.accessToken, body);
    return { results };
  }
}
