import {
  Body,
  Controller,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SearchRequestModel } from './model/search-request.model';

@ApiBearerAuth()
@ApiTags('search')
@Controller('search')
export class SearchController {
  @Post()
  @ApiOperation({ summary: 'Search SharePoint content' })
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- stub; body used for validation only until SearchService is implemented in Phase 4
  search(@Body() _body: SearchRequestModel) {
    throw new NotImplementedException();
  }
}
