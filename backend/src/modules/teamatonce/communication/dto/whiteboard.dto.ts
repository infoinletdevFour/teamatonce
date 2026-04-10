import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateWhiteboardSessionDto {
  @ApiProperty({ description: 'Whiteboard session name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Initial canvas data', type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  canvasData?: Record<string, any>;
}

export class UpdateWhiteboardSessionDto {
  @ApiPropertyOptional({ description: 'Whiteboard session name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Canvas data', type: 'object', additionalProperties: true })
  @IsObject()
  canvasData: Record<string, any>;
}
