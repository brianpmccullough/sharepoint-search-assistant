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
  search(@Body() _body: SearchRequestModel) {
    throw new NotImplementedException();
  }
}
