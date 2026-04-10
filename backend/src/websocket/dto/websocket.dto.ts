import { IsString, IsNotEmpty, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for joining a project room
 */
export class JoinProjectDto {
  @ApiProperty({ description: 'Project ID to join' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'User ID joining the project' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Team member ID if applicable', required: false })
  @IsString()
  @IsOptional()
  teamMemberId?: string;
}

/**
 * DTO for leaving a project room
 */
export class LeaveProjectDto {
  @ApiProperty({ description: 'Project ID to leave' })
  @IsString()
  @IsNotEmpty()
  projectId: string;
}

/**
 * DTO for joining a whiteboard session
 */
export class JoinWhiteboardDto {
  @ApiProperty({ description: 'Whiteboard session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Project ID associated with the whiteboard' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'User ID joining the whiteboard' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'User name to display' })
  @IsString()
  @IsNotEmpty()
  userName: string;
}

/**
 * DTO for whiteboard drawing/update
 */
export class WhiteboardUpdateDto {
  @ApiProperty({ description: 'Whiteboard session ID' })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({ description: 'Project ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'User ID making the update' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Canvas data (drawing data)' })
  @IsObject()
  @IsNotEmpty()
  canvasData: any;
}

/**
 * DTO for member status update
 */
export class MemberStatusDto {
  @ApiProperty({ description: 'Team member ID' })
  @IsString()
  @IsNotEmpty()
  teamMemberId: string;

  @ApiProperty({ description: 'Online status' })
  @IsBoolean()
  @IsNotEmpty()
  online: boolean;

  @ApiProperty({ description: 'Project ID', required: false })
  @IsString()
  @IsOptional()
  projectId?: string;
}

/**
 * DTO for project message
 */
export class ProjectMessageDto {
  @ApiProperty({ description: 'Project ID' })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiProperty({ description: 'User ID sending the message' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ description: 'Message content' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Message type', required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsObject()
  @IsOptional()
  metadata?: any;
}
