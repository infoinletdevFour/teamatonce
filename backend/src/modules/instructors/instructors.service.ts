import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateInstructorDto } from './dto/create-instructor.dto';
import { UpdateInstructorDto } from './dto/update-instructor.dto';
import { InstructorQueryDto } from './dto/instructor-query.dto';
import { InstructorProfileDto, PaginatedInstructorsDto } from './dto/instructor-response.dto';
import { InstructorDashboardStatsDto } from './dto/dashboard-stats.dto';
import { CreateInstructorApplicationDto, InstructorApplicationResponseDto, ReviewInstructorApplicationDto } from './dto/instructor-application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';

@Injectable()
export class InstructorsService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // ==========================================
  // PROFILE MANAGEMENT
  // ==========================================

  async createInstructorProfile(userId: string, dto: CreateInstructorDto): Promise<InstructorProfileDto> {
    try {
      // Check if instructor profile already exists
      const existing = await this.db.findOne('instructors', { user_id: userId });
      if (existing) {
        throw new BadRequestException('Instructor profile already exists');
      }

      // Only include core fields that definitely exist in the original table
      const instructorData: any = {
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: dto.display_name,
        title: dto.title || null,
        bio: dto.bio || null,
        expertise: dto.expertise || [],
        years_experience: dto.years_experience || 0,
        average_rating: 0,
        total_reviews: 0,
        total_students: 0,
        courses_created: 0,
        total_earnings: 0,
        certificates: 0,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const instructor = await this.db.insert('instructors', instructorData);
      return this.mapToDto(instructor);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create instructor profile: ${error.message}`);
    }
  }

  async getInstructorProfile(instructorId: string): Promise<InstructorProfileDto> {
    const instructor = await this.db.findOne('instructors', { id: instructorId });

    if (!instructor) {
      throw new NotFoundException('Instructor not found');
    }

    return this.mapToDto(instructor);
  }

  async getInstructorByUserId(userId: string): Promise<InstructorProfileDto> {
    const instructor = await this.db.findOne('instructors', { user_id: userId });

    if (!instructor) {
      throw new NotFoundException('Instructor profile not found');
    }

    return this.mapToDto(instructor);
  }

  async updateInstructorProfile(userId: string, dto: UpdateInstructorDto): Promise<InstructorProfileDto> {
    try {
      const instructor = await this.db.findOne('instructors', { user_id: userId });

      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      // Map DTO fields to update data
      if (dto.display_name !== undefined) updateData.display_name = dto.display_name;
      if (dto.title !== undefined) updateData.title = dto.title;
      if (dto.bio !== undefined) updateData.bio = dto.bio;
      if (dto.expertise !== undefined) updateData.expertise = dto.expertise;
      if (dto.years_experience !== undefined) updateData.years_experience = dto.years_experience;
      if (dto.timezone !== undefined) updateData.timezone = dto.timezone;
      if (dto.languages !== undefined) updateData.languages = dto.languages;
      if (dto.hourly_rate !== undefined) updateData.hourly_rate = dto.hourly_rate;
      if (dto.currency !== undefined) updateData.currency = dto.currency;
      if (dto.accept_students !== undefined) updateData.accept_students = dto.accept_students;
      if (dto.max_students !== undefined) updateData.max_students = dto.max_students;
      if (dto.website !== undefined) updateData.website = dto.website;
      if (dto.social_links !== undefined) updateData.social_links = dto.social_links;
      if (dto.credentials !== undefined) updateData.credentials = dto.credentials;
      if (dto.availability !== undefined) updateData.availability = dto.availability;
      if (dto.profile_image !== undefined) updateData.profile_image = dto.profile_image;
      if (dto.cover_image !== undefined) updateData.cover_image = dto.cover_image;
      if (dto.video_intro_url !== undefined) updateData.video_intro_url = dto.video_intro_url;

      // Update slug if display_name changed
      if (dto.display_name) {
        updateData.slug = this.generateSlug(dto.display_name);
      }

      await this.db.update('instructors', instructor.id, updateData);

      // Fetch updated instructor
      const updated = await this.db.findOne('instructors', { id: instructor.id });
      return this.mapToDto(updated);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update instructor profile: ${error.message}`);
    }
  }

  async listInstructors(query: InstructorQueryDto): Promise<PaginatedInstructorsDto> {
    try {
      const { page = 1, limit = 20, search, expertise, minRating, verified, sortBy = 'rating', order = 'desc' } = query;

      const offset = (page - 1) * limit;

      // Build query conditions
      const conditions: any = {};

      if (verified !== undefined) {
        conditions.verified = verified;
      }

      console.log('[InstructorsService] listInstructors query:', { conditions, limit: limit * 10, sortBy, order });

      // Get ALL instructors first to debug
      const allInstructors = await this.db.select('instructors', {
        where: {},
        limit: 1000,
      });
      console.log('[InstructorsService] Total instructors in DB:', allInstructors.length);
      if (allInstructors.length > 0) {
        console.log('[InstructorsService] First instructor sample:', JSON.stringify(allInstructors[0], null, 2));
      }

      // Get all instructors matching base conditions
      let instructors = await this.db.select('instructors', {
        where: conditions,
        limit: limit * 10, // Get more for client-side filtering
        orderBy: this.mapSortField(sortBy),
        order: order,
      });

      console.log('[InstructorsService] Found instructors after filtering:', instructors.length);

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        instructors = instructors.filter((instructor: any) =>
          instructor.display_name?.toLowerCase().includes(searchLower) ||
          instructor.title?.toLowerCase().includes(searchLower) ||
          instructor.bio?.toLowerCase().includes(searchLower) ||
          (instructor.expertise || []).some((exp: string) => exp.toLowerCase().includes(searchLower))
        );
      }

      // Apply expertise filter
      if (expertise) {
        const expertiseArray = expertise.split(',').map(e => e.trim().toLowerCase());
        instructors = instructors.filter((instructor: any) =>
          (instructor.expertise || []).some((exp: string) =>
            expertiseArray.some(reqExp => exp.toLowerCase().includes(reqExp))
          )
        );
      }

      // Apply minRating filter
      if (minRating !== undefined) {
        instructors = instructors.filter((instructor: any) =>
          (instructor.average_rating || 0) >= minRating
        );
      }

      const total = instructors.length;
      const paginatedInstructors = instructors.slice(offset, offset + limit);

      return {
        instructors: paginatedInstructors.map(instructor => this.mapToDto(instructor)),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to list instructors: ${error.message}`);
    }
  }

  // ==========================================
  // DASHBOARD STATS
  // ==========================================

  async getDashboardStats(userId: string): Promise<InstructorDashboardStatsDto> {
    try {
      const instructor = await this.db.findOne('instructors', { user_id: userId });

      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      // Get instructor's courses
      const courses = await this.db.select('courses', {
        where: { instructor_id: instructor.id },
      });

      // Get all enrollments for instructor's courses
      const courseIds = courses.map((c: any) => c.id);
      let allEnrollments: any[] = [];

      if (courseIds.length > 0) {
        allEnrollments = await this.db.select('learning_progress', {
          where: {},
          limit: 10000,
        });
        // Filter enrollments for instructor's courses
        allEnrollments = allEnrollments.filter((e: any) => courseIds.includes(e.course_id));
      }

      // Get transactions for instructor
      const transactions = await this.db.select('transactions', {
        where: { instructor_id: instructor.id },
        limit: 10000,
      });

      // Calculate stats
      const totalStudents = new Set(allEnrollments.map((e: any) => e.user_id)).size;
      const totalCourses = courses.length;

      const completedTransactions = transactions.filter((t: any) => t.status === 'completed');
      const totalEarnings = completedTransactions.reduce((sum: number, t: any) =>
        sum + parseFloat(t.instructor_amount || 0), 0
      );

      // Calculate monthly earnings (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyEarnings = completedTransactions
        .filter((t: any) => new Date(t.created_at) >= thirtyDaysAgo)
        .reduce((sum: number, t: any) => sum + parseFloat(t.instructor_amount || 0), 0);

      // Active enrollments (students with recent activity)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const activeEnrollments = allEnrollments.filter((e: any) => {
        const lastAccessed = e.last_accessed_at ? new Date(e.last_accessed_at) : null;
        return lastAccessed && lastAccessed >= sevenDaysAgo;
      }).length;

      // Completion rate
      const completedEnrollments = allEnrollments.filter((e: any) =>
        e.status === 'completed' || (e.progress_percentage || 0) >= 100
      ).length;
      const completionRate = allEnrollments.length > 0
        ? Math.round((completedEnrollments / allEnrollments.length) * 100)
        : 0;

      // Earnings data (last 30 days)
      const earningsData = this.calculateEarningsData(completedTransactions, 30);

      // Enrollment data (last 30 days)
      const enrollmentData = this.calculateEnrollmentData(allEnrollments, 30);

      // Top courses
      const topCourses = this.calculateTopCourses(courses, allEnrollments, transactions);

      // Recent enrollments
      const recentEnrollments = await this.getRecentEnrollments(allEnrollments, courses, 10);

      return {
        totalStudents,
        totalCourses,
        totalEarnings: Math.round(totalEarnings * 100) / 100,
        monthlyEarnings: Math.round(monthlyEarnings * 100) / 100,
        averageRating: instructor.average_rating || 0,
        totalReviews: instructor.total_reviews || 0,
        activeEnrollments,
        completionRate,
        earningsData,
        enrollmentData,
        topCourses,
        recentEnrollments,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================

  private mapToDto(instructor: any): InstructorProfileDto {
    return {
      id: instructor.id,
      user_id: instructor.user_id,
      display_name: instructor.display_name,
      title: instructor.title,
      bio: instructor.bio,
      expertise: instructor.expertise || [],
      years_experience: instructor.years_experience || 0,
      average_rating: parseFloat(instructor.average_rating || 0),
      total_reviews: instructor.total_reviews || 0,
      total_students: instructor.total_students || 0,
      courses_created: instructor.courses_created || 0,
      total_earnings: parseFloat(instructor.total_earnings || 0),
      certificates: instructor.certificates || 0,
      verified: instructor.verified || false,
      timezone: instructor.timezone,
      languages: instructor.languages || [],
      hourly_rate: instructor.hourly_rate ? parseFloat(instructor.hourly_rate) : undefined,
      currency: instructor.currency,
      website: instructor.website,
      social_links: instructor.social_links || {},
      credentials: instructor.credentials || [],
      availability: instructor.availability || {},
      profile_image: instructor.profile_image,
      cover_image: instructor.cover_image,
      video_intro_url: instructor.video_intro_url,
      accept_students: instructor.accept_students !== undefined ? instructor.accept_students : true,
      max_students: instructor.max_students,
      response_time: instructor.response_time,
      completion_rate: instructor.completion_rate ? parseFloat(instructor.completion_rate) : 0,
      verification_status: instructor.verification_status,
      created_at: instructor.created_at,
      updated_at: instructor.updated_at,
      slug: instructor.slug,
    };
  }

  private generateSlug(displayName: string): string {
    return displayName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      + '-' + Math.random().toString(36).substr(2, 6);
  }

  private mapSortField(sortBy: string): string {
    const mapping: Record<string, string> = {
      'rating': 'average_rating',
      'students': 'total_students',
      'earnings': 'total_earnings',
      'created_at': 'created_at',
      'courses': 'courses_created',
    };
    return mapping[sortBy] || 'average_rating';
  }

  private calculateEarningsData(transactions: any[], days: number): { date: string; amount: number }[] {
    const data: { date: string; amount: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEarnings = transactions
        .filter((t: any) => {
          const tDate = new Date(t.created_at).toISOString().split('T')[0];
          return tDate === dateStr;
        })
        .reduce((sum: number, t: any) => sum + parseFloat(t.instructor_amount || 0), 0);

      data.push({ date: dateStr, amount: Math.round(dayEarnings * 100) / 100 });
    }

    return data;
  }

  private calculateEnrollmentData(enrollments: any[], days: number): { date: string; count: number }[] {
    const data: { date: string; count: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayEnrollments = enrollments.filter((e: any) => {
        const eDate = new Date(e.created_at).toISOString().split('T')[0];
        return eDate === dateStr;
      }).length;

      data.push({ date: dateStr, count: dayEnrollments });
    }

    return data;
  }

  private calculateTopCourses(courses: any[], enrollments: any[], transactions: any[]): any[] {
    const courseStats = courses.map((course: any) => {
      const courseEnrollments = enrollments.filter((e: any) => e.course_id === course.id);
      const courseTransactions = transactions.filter((t: any) => t.course_id === course.id && t.status === 'completed');
      const revenue = courseTransactions.reduce((sum: number, t: any) => sum + parseFloat(t.instructor_amount || 0), 0);

      return {
        id: course.id,
        title: course.title,
        students: courseEnrollments.length,
        revenue: Math.round(revenue * 100) / 100,
        rating: parseFloat(course.average_rating || 0),
      };
    });

    // Sort by revenue and take top 5
    return courseStats
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private async getRecentEnrollments(enrollments: any[], courses: any[], limit: number): Promise<any[]> {
    // Sort by created_at and take recent ones
    const recentEnrollments = enrollments
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);

    return recentEnrollments.map((enrollment: any) => {
      const course = courses.find((c: any) => c.id === enrollment.course_id);
      return {
        student_name: enrollment.user_id, // We'd need to fetch actual names from users
        course_title: course?.title || 'Unknown Course',
        enrolled_at: enrollment.created_at,
      };
    });
  }

  // ==========================================
  // INSTRUCTOR APPLICATION WORKFLOW
  // ==========================================

  async submitInstructorApplication(userId: string, dto: CreateInstructorApplicationDto): Promise<InstructorApplicationResponseDto> {
    try {
      // Check if user already has an instructor profile
      const existingProfile = await this.db.findOne('instructors', { user_id: userId });
      if (existingProfile) {
        throw new BadRequestException('You already have an instructor profile');
      }

      // Check if user already has a pending application
      const existingApplication = await this.db.findOne('instructor_applications', {
        user_id: userId,
      });

      if (existingApplication && existingApplication.status === 'pending') {
        throw new BadRequestException('You already have a pending instructor application');
      }

      const applicationData = {
        id: crypto.randomUUID(),
        user_id: userId,
        display_name: dto.display_name,
        email: dto.email,
        phone: dto.phone || null,
        title: dto.title || null,
        bio: dto.bio,
        expertise: dto.expertise,
        years_experience: dto.years_experience,
        education: dto.education || [],
        certifications: dto.certifications || [],
        previous_teaching_experience: dto.previous_teaching_experience || null,
        why_teach: dto.why_teach,
        sample_course_topics: dto.sample_course_topics,
        timezone: dto.timezone || 'UTC',
        languages: dto.languages || ['English'],
        website: dto.website || null,
        social_links: dto.social_links || {},
        resume_url: dto.resume_url || null,
        portfolio_url: dto.portfolio_url || null,
        video_intro_url: dto.video_intro_url || null,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const application = await this.db.insert('instructor_applications', applicationData);

      // Send notification to applicant confirming submission
      try {
        await this.notificationsService.sendNotification({
          user_id: userId,
          type: NotificationType.SYSTEM,
          title: '📝 Application Submitted',
          message: `Your instructor application has been submitted successfully. We'll review it and get back to you soon.`,
          priority: NotificationPriority.NORMAL,
          action_url: '/instructor/application-status',
          data: { applicationId: application.id },
          send_push: true,
        });
      } catch (notifError) {
        console.error('[InstructorsService] Error sending application notification:', notifError);
      }

      return {
        id: application.id,
        user_id: application.user_id,
        display_name: application.display_name,
        email: application.email,
        status: application.status,
        submitted_at: application.submitted_at,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to submit application: ${error.message}`);
    }
  }

  async getMyApplication(userId: string): Promise<InstructorApplicationResponseDto> {
    const application = await this.db.findOne('instructor_applications', { user_id: userId });

    if (!application) {
      throw new NotFoundException('No instructor application found');
    }

    return {
      id: application.id,
      user_id: application.user_id,
      display_name: application.display_name,
      email: application.email,
      status: application.status,
      submitted_at: application.submitted_at,
      reviewed_at: application.reviewed_at,
      reviewed_by: application.reviewed_by,
      admin_notes: application.admin_notes,
      rejection_reason: application.rejection_reason,
    };
  }

  async getAllApplications(status?: string): Promise<any[]> {
    const conditions: any = {};
    if (status) {
      conditions.status = status;
    }

    const applications = await this.db.select('instructor_applications', {
      where: conditions,
      orderBy: 'submitted_at',
      order: 'desc',
    });

    return applications;
  }

  async reviewInstructorApplication(
    applicationId: string,
    adminUserId: string,
    dto: ReviewInstructorApplicationDto,
  ): Promise<InstructorApplicationResponseDto> {
    try {
      const application = await this.db.findOne('instructor_applications', { id: applicationId });

      if (!application) {
        throw new NotFoundException('Application not found');
      }

      if (application.status !== 'pending') {
        throw new BadRequestException('Application has already been reviewed');
      }

      const updateData: any = {
        status: dto.decision,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUserId,
        admin_notes: dto.admin_notes || null,
        rejection_reason: dto.rejection_reason || null,
        updated_at: new Date().toISOString(),
      };

      await this.db.update('instructor_applications', applicationId, updateData);

      // If approved, create instructor profile
      if (dto.decision === 'approved') {
        await this.createInstructorProfileFromApplication(application);

        // Update user role in auth service
        await this.db.updateUser(application.user_id, {
          metadata: {
            role: 'instructor',
          },
          app_metadata: {
            role: 'instructor',
          },
        });
      }

      // Send notification to applicant about the decision
      try {
        if (dto.decision === 'approved') {
          await this.notificationsService.sendNotification({
            user_id: application.user_id,
            type: NotificationType.ACHIEVEMENT,
            title: '🎉 Application Approved!',
            message: `Congratulations! Your instructor application has been approved. You can now start creating courses.`,
            priority: NotificationPriority.HIGH,
            action_url: '/instructor/dashboard',
            data: { applicationId, status: 'approved' },
            send_push: true,
          });
        } else if (dto.decision === 'rejected') {
          await this.notificationsService.sendNotification({
            user_id: application.user_id,
            type: NotificationType.SYSTEM,
            title: '📋 Application Update',
            message: `Your instructor application has been reviewed.${dto.rejection_reason ? ` Feedback: ${dto.rejection_reason}` : ' Please check your application status for details.'}`,
            priority: NotificationPriority.NORMAL,
            action_url: '/instructor/application-status',
            data: { applicationId, status: 'rejected', reason: dto.rejection_reason },
            send_push: true,
          });
        }
      } catch (notifError) {
        console.error('[InstructorsService] Error sending review notification:', notifError);
      }

      const updated = await this.db.findOne('instructor_applications', { id: applicationId });

      return {
        id: updated.id,
        user_id: updated.user_id,
        display_name: updated.display_name,
        email: updated.email,
        status: updated.status,
        submitted_at: updated.submitted_at,
        reviewed_at: updated.reviewed_at,
        reviewed_by: updated.reviewed_by,
        admin_notes: updated.admin_notes,
        rejection_reason: updated.rejection_reason,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to review application: ${error.message}`);
    }
  }

  private async createInstructorProfileFromApplication(application: any): Promise<void> {
    const slug = this.generateSlug(application.display_name);

    const instructorData = {
      id: crypto.randomUUID(),
      user_id: application.user_id,
      display_name: application.display_name,
      title: application.title,
      bio: application.bio,
      expertise: application.expertise,
      years_experience: application.years_experience,
      timezone: application.timezone,
      languages: application.languages,
      website: application.website,
      social_links: application.social_links,
      credentials: application.certifications || [],
      video_intro_url: application.video_intro_url,
      slug,
      verification_status: 'verified',
      verified: true,
      verified_at: new Date().toISOString(),
      average_rating: 0,
      total_reviews: 0,
      total_students: 0,
      courses_created: 0,
      total_earnings: 0,
      certificates: 0,
      accept_students: true,
      response_time: '< 24 hours',
      completion_rate: 0,
      currency: 'USD',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await this.db.insert('instructors', instructorData);
  }

  // ============================================
  // EARNINGS & PAYOUTS
  // ============================================

  async getEarnings(userId: string): Promise<any> {
    try {
      // Get instructor profile
      const instructor = await this.db.findOne('instructors', { user_id: userId });
      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      // Get all transactions for this instructor
      const allTransactions = await this.db.select('transactions', {
        where: { instructor_id: instructor.id },
        orderBy: 'created_at',
        order: 'desc',
      });

      // Calculate earnings
      const completedTransactions = allTransactions.filter(t => t.status === 'completed');
      const pendingTransactions = allTransactions.filter(t => t.status === 'pending');

      const totalEarnings = completedTransactions.reduce(
        (sum, t) => sum + parseFloat(String(t.instructor_amount || 0)), 0
      );

      const pendingBalance = pendingTransactions.reduce(
        (sum, t) => sum + parseFloat(String(t.instructor_amount || 0)), 0
      );

      // Get paid out amount from instructor_payouts table
      const payouts = await this.db.select('instructor_payouts', {
        where: { instructor_id: instructor.id, status: 'completed' },
      });

      const totalPaidOut = payouts.reduce(
        (sum, p) => sum + parseFloat(String(p.amount || 0)), 0
      );

      const availableBalance = totalEarnings - totalPaidOut;

      // Format earnings history
      const earnings = completedTransactions.map(t => ({
        id: t.id,
        amount: parseFloat(String(t.instructor_amount || 0)),
        platform_fee: parseFloat(String(t.platform_fee || 0)),
        total_amount: parseFloat(String(t.amount || 0)),
        course_id: t.course_id,
        student_id: t.student_id,
        status: t.status,
        created_at: t.created_at,
        processed_at: t.processed_at,
      }));

      return {
        availableBalance: parseFloat(availableBalance.toFixed(2)),
        pendingBalance: parseFloat(pendingBalance.toFixed(2)),
        totalEarnings: parseFloat(totalEarnings.toFixed(2)),
        totalPaidOut: parseFloat(totalPaidOut.toFixed(2)),
        earnings,
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve earnings: ' + error.message);
    }
  }

  async getPendingPayouts(userId: string): Promise<any> {
    try {
      const instructor = await this.db.findOne('instructors', { user_id: userId });
      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      const pendingPayouts = await this.db.select('instructor_payouts', {
        where: { instructor_id: instructor.id, status: 'pending' },
        orderBy: 'created_at',
        order: 'desc',
      });

      return {
        payouts: pendingPayouts.map(p => ({
          id: p.id,
          amount: parseFloat(String(p.amount || 0)),
          status: p.status,
          payment_method: p.payment_method,
          requested_at: p.created_at,
          estimated_arrival: p.estimated_arrival,
        })),
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve pending payouts: ' + error.message);
    }
  }

  async requestWithdrawal(userId: string, withdrawalData: any): Promise<any> {
    try {
      const instructor = await this.db.findOne('instructors', { user_id: userId });
      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      // Get available balance
      const earningsData = await this.getEarnings(userId);
      const availableBalance = earningsData.availableBalance;

      // Validate withdrawal amount
      const requestedAmount = parseFloat(String(withdrawalData.amount || 0));
      if (requestedAmount <= 0) {
        throw new BadRequestException('Withdrawal amount must be greater than 0');
      }

      if (requestedAmount > availableBalance) {
        throw new BadRequestException('Insufficient balance for withdrawal');
      }

      // Minimum withdrawal amount check (e.g., $10)
      const minimumWithdrawal = 10;
      if (requestedAmount < minimumWithdrawal) {
        throw new BadRequestException(`Minimum withdrawal amount is $${minimumWithdrawal}`);
      }

      // Create payout request
      const payoutId = crypto.randomUUID();
      const estimatedArrival = new Date();
      estimatedArrival.setDate(estimatedArrival.getDate() + 7); // 7 days for processing

      const payoutData = {
        id: payoutId,
        instructor_id: instructor.id,
        amount: requestedAmount,
        status: 'pending',
        payment_method: withdrawalData.payment_method || 'bank_transfer',
        payment_details: withdrawalData.payment_details || {},
        created_at: new Date().toISOString(),
        estimated_arrival: estimatedArrival.toISOString(),
      };

      await this.db.insert('instructor_payouts', payoutData);

      // Send notification about withdrawal request
      try {
        await this.notificationsService.sendNotification({
          user_id: userId,
          type: NotificationType.FINANCE,
          title: '💸 Withdrawal Requested',
          message: `Your withdrawal request for $${requestedAmount.toFixed(2)} has been submitted. Estimated arrival: ${estimatedArrival.toLocaleDateString()}.`,
          priority: NotificationPriority.HIGH,
          action_url: '/instructor/earnings',
          data: { payoutId, amount: requestedAmount, estimatedArrival: estimatedArrival.toISOString() },
          send_push: true,
        });
      } catch (notifError) {
        console.error('[InstructorsService] Error sending withdrawal notification:', notifError);
      }

      return {
        id: payoutId,
        amount: requestedAmount,
        status: 'pending',
        message: 'Withdrawal request submitted successfully',
        estimated_arrival: estimatedArrival.toISOString(),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to process withdrawal request: ' + error.message);
    }
  }

  async getPayoutHistory(userId: string): Promise<any> {
    try {
      const instructor = await this.db.findOne('instructors', { user_id: userId });
      if (!instructor) {
        throw new NotFoundException('Instructor profile not found');
      }

      const allPayouts = await this.db.select('instructor_payouts', {
        where: { instructor_id: instructor.id },
        orderBy: 'created_at',
        order: 'desc',
      });

      return {
        payouts: allPayouts.map(p => ({
          id: p.id,
          amount: parseFloat(String(p.amount || 0)),
          status: p.status,
          payment_method: p.payment_method,
          requested_at: p.created_at,
          processed_at: p.processed_at,
          estimated_arrival: p.estimated_arrival,
          actual_arrival: p.actual_arrival,
        })),
      };
    } catch (error) {
      throw new BadRequestException('Failed to retrieve payout history: ' + error.message);
    }
  }
}
