import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class SearchRequestModel {
  @ApiProperty({ description: 'Search query string' })
  @IsString()
  @IsNotEmpty()
  query!: string;

  @ApiPropertyOptional({ description: 'Zero-based offset for pagination' })
  @IsInt()
  @Min(0)
  @IsOptional()
  from?: number;

  @ApiPropertyOptional({ description: 'Number of results to return' })
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number;
}
