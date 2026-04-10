import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateDiscussionCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'Great question! You can use React.memo() to prevent unnecessary re-renders. Here is how you can implement it...',
    minLength: 5,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(5000)
  content: string;

  @ApiPropertyOptional({
    description: 'Parent comment ID if this is a reply',
    example: 'comment_123',
  })
  @IsOptional()
  @IsString()
  parentCommentId?: string;

  @ApiPropertyOptional({
    description: 'Attached media/files metadata',
    example: [
      {
        type: 'code',
        url: 'https://example.com/code-snippet.js',
        name: 'React Component Example',
      },
    ],
  })
  @IsOptional()
  attachments?: Array<{
    type: 'image' | 'document' | 'code' | 'link';
    url: string;
    name: string;
    size?: number;
  }>;

  @ApiPropertyOptional({
    description: 'Whether this comment is marked as the best answer (author or moderator only)',
    example: false,
  })
  @IsOptional()
  isBestAnswer?: boolean;
}