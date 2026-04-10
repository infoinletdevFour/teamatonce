import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StudyGroupVisibility, StudyGroupCategory } from './create-study-group.dto';

export class StudyGroupMemberDto {
  @ApiProperty({ description: 'Member ID', example: 'user_123' })
  id: string;

  @ApiProperty({ description: 'Member username', example: 'john_doe' })
  username: string;

  @ApiPropertyOptional({ description: 'Member full name', example: 'John Doe' })
  fullName?: string;

  @ApiPropertyOptional({ description: 'Member avatar URL', example: 'https://example.com/avatar.jpg' })
  avatar?: string;

  @ApiProperty({ description: 'Date joined the group', example: '2024-01-15T10:00:00Z' })
  joinedAt: string;

  @ApiProperty({ description: 'Member role in group', example: 'member' })
  role: 'owner' | 'admin' | 'moderator' | 'member';
}

export class StudyGroupResponseDto {
  @ApiProperty({ description: 'Study group ID', example: 'sg_123' })
  id: string;

  @ApiProperty({ description: 'Study group name', example: 'Advanced React Study Group' })
  name: string;

  @ApiPropertyOptional({ description: 'Study group description' })
  description?: string;

  @ApiProperty({ description: 'Study group category', enum: StudyGroupCategory })
  category: StudyGroupCategory;

  @ApiProperty({ description: 'Study group visibility', enum: StudyGroupVisibility })
  visibility: StudyGroupVisibility;

  @ApiProperty({ description: 'Owner ID', example: 'user_123' })
  ownerId: string;

  @ApiProperty({ description: 'Current member count', example: 15 })
  memberCount: number;

  @ApiPropertyOptional({ description: 'Maximum members allowed', example: 20 })
  maxMembers?: number;

  @ApiPropertyOptional({ description: 'Study group tags', isArray: true, type: String })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Related course ID', example: 'course_123' })
  courseId?: string;

  @ApiPropertyOptional({ description: 'Schedule information' })
  schedule?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Group goals and objectives' })
  goals?: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;

  @ApiProperty({ description: 'Last update date', example: '2024-01-15T10:00:00Z' })
  updatedAt: string;

  @ApiPropertyOptional({ description: 'Group members (populated when requested)', isArray: true, type: StudyGroupMemberDto })
  members?: StudyGroupMemberDto[];

  @ApiPropertyOptional({ description: 'User membership status' })
  membershipStatus?: 'member' | 'pending' | 'invited' | 'not_member';

  @ApiPropertyOptional({ description: 'User role if member' })
  userRole?: 'owner' | 'admin' | 'moderator' | 'member';
}

export class PaginatedStudyGroupsDto {
  @ApiProperty({ description: 'List of study groups', isArray: true, type: StudyGroupResponseDto })
  data: StudyGroupResponseDto[];

  @ApiProperty({ description: 'Total number of groups', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Has next page', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Has previous page', example: false })
  hasPrevPage: boolean;
}

export class StudyGroupJoinRequestDto {
  @ApiPropertyOptional({ description: 'Join request message', example: 'I would like to join this group to learn React together' })
  message?: string;
}

export class StudyGroupEventDto {
  @ApiProperty({ description: 'Event ID', example: 'event_123' })
  id: string;

  @ApiProperty({ description: 'Event title', example: 'React Hooks Deep Dive' })
  title: string;

  @ApiPropertyOptional({ description: 'Event description' })
  description?: string;

  @ApiProperty({ description: 'Event date and time', example: '2024-02-15T19:00:00Z' })
  scheduledAt: string;

  @ApiPropertyOptional({ description: 'Event duration in minutes', example: 120 })
  duration?: number;

  @ApiProperty({ description: 'Event type', example: 'meeting' })
  type: 'meeting' | 'study_session' | 'presentation' | 'discussion' | 'other';

  @ApiPropertyOptional({ description: 'Meeting link or location' })
  location?: string;

  @ApiProperty({ description: 'Event creator ID', example: 'user_123' })
  createdBy: string;

  @ApiProperty({ description: 'Creation date', example: '2024-01-15T10:00:00Z' })
  createdAt: string;
}