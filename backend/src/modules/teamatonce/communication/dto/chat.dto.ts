import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsEnum,
  IsObject,
} from 'class-validator';

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  VIDEO = 'video',
  SYSTEM = 'system',
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group',
  PROJECT = 'project',
}

export class SendMessageDto {
  @ApiProperty({ description: 'Message content' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ enum: MessageType, description: 'Message type', default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;

  @ApiPropertyOptional({ description: 'Message attachments', type: [Object] })
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    url: string;
    name: string;
    type: string;
    size: number;
  }>;

  @ApiPropertyOptional({ description: 'Mentioned user IDs', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mentions?: string[];

  @ApiPropertyOptional({ description: 'ID of message being replied to' })
  @IsOptional()
  @IsString()
  replyToId?: string;
}

export class CreateConversationDto {
  @ApiPropertyOptional({ description: 'Conversation title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ enum: ConversationType, description: 'Conversation type' })
  @IsEnum(ConversationType)
  conversationType: ConversationType;

  @ApiProperty({ description: 'Participant user IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiPropertyOptional({ description: 'Associated project ID' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class UpdateMessageDto {
  @ApiPropertyOptional({ description: 'Updated message content' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ description: 'Message reactions', type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  reactions?: Record<string, string[]>;
}
