import { IsString, IsBoolean, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum OnlineStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export class UpdateMemberStatusDto {
  @ApiProperty({
    description: 'Team member UUID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsUUID()
  member_id: string;

  @ApiProperty({
    description: 'Online status',
    enum: OnlineStatus,
    example: OnlineStatus.ONLINE
  })
  @IsEnum(OnlineStatus)
  status: OnlineStatus;

  @ApiPropertyOptional({
    description: 'Device information',
    example: 'Chrome on Windows'
  })
  @IsOptional()
  @IsString()
  device_info?: string;
}

export class MemberStatusResponseDto {
  @ApiProperty({ description: 'Team member UUID' })
  member_id: string;

  @ApiProperty({
    description: 'Online status',
    enum: OnlineStatus
  })
  status: OnlineStatus;

  @ApiProperty({ description: 'Last seen timestamp' })
  last_seen: Date;

  @ApiPropertyOptional({ description: 'Device information' })
  device_info?: string;

  @ApiPropertyOptional({
    description: 'Project IDs where member is assigned',
    type: [String]
  })
  project_ids?: string[];
}

export class OnlineMemberDto {
  @ApiProperty({ description: 'Team member UUID' })
  member_id: string;

  @ApiProperty({ description: 'Display name' })
  display_name: string;

  @ApiProperty({ description: 'Role' })
  role: string;

  @ApiProperty({
    description: 'Online status',
    enum: OnlineStatus
  })
  status: OnlineStatus;

  @ApiProperty({ description: 'Last seen timestamp' })
  last_seen: Date;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profile_image?: string;
}

export class ProjectTeamStatusDto {
  @ApiProperty({ description: 'Team member UUID' })
  member_id: string;

  @ApiProperty({ description: 'Display name' })
  display_name: string;

  @ApiProperty({ description: 'Role in project' })
  project_role: string;

  @ApiProperty({
    description: 'Online status',
    enum: OnlineStatus
  })
  status: OnlineStatus;

  @ApiProperty({ description: 'Last seen timestamp' })
  last_seen: Date;

  @ApiPropertyOptional({ description: 'Profile image URL' })
  profile_image?: string;

  @ApiPropertyOptional({ description: 'Allocation percentage' })
  allocation_percentage?: number;
}

export class BulkStatusUpdateDto {
  @ApiProperty({
    description: 'Array of member status updates',
    type: [UpdateMemberStatusDto]
  })
  updates: UpdateMemberStatusDto[];
}
