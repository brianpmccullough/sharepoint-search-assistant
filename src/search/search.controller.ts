import { Controller, NotImplementedException, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('search')
@Controller('search')
export class SearchController {
  @Post()
  @ApiOperation({ summary: 'Search SharePoint content' })
  search() {
    throw new NotImplementedException();
  }
}
