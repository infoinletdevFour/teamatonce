import { ApiProperty } from '@nestjs/swagger';

export class TopCourseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  students: number;

  @ApiProperty()
  revenue: number;

  @ApiProperty()
  rating: number;
}

export class RecentEnrollmentDto {
  @ApiProperty()
  student_name: string;

  @ApiProperty()
  course_title: string;

  @ApiProperty()
  enrolled_at: string;
}

export class EarningsDataPoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  amount: number;
}

export class EnrollmentDataPoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  count: number;
}

export class InstructorDashboardStatsDto {
  @ApiProperty()
  totalStudents: number;

  @ApiProperty()
  totalCourses: number;

  @ApiProperty()
  totalEarnings: number;

  @ApiProperty()
  monthlyEarnings: number;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  totalReviews: number;

  @ApiProperty()
  activeEnrollments: number;

  @ApiProperty()
  completionRate: number;

  @ApiProperty({ type: [EarningsDataPoint] })
  earningsData: EarningsDataPoint[];

  @ApiProperty({ type: [EnrollmentDataPoint] })
  enrollmentData: EnrollmentDataPoint[];

  @ApiProperty({ type: [TopCourseDto] })
  topCourses: TopCourseDto[];

  @ApiProperty({ type: [RecentEnrollmentDto] })
  recentEnrollments: RecentEnrollmentDto[];
}
