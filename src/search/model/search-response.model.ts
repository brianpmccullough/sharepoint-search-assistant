import { ApiProperty } from '@nestjs/swagger';

export type SearchContentType = 'file' | 'page';

export class SearchResultModel {
  @ApiProperty()
  title!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty()
  summary!: string;

  @ApiProperty()
  lastModified!: string;

  @ApiProperty({ enum: ['file', 'page'] })
  contentType!: SearchContentType;
}

export class SearchResponseModel {
  @ApiProperty({ type: [SearchResultModel] })
  results!: SearchResultModel[];
}
