import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseQueryDto,
  CourseEnrollmentDto,
  CourseProgressDto,
  CourseResponseDto,
  CourseEnrollmentResponseDto,
  PaginatedCoursesDto
} from './dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // =============================================
  // COURSE CRUD OPERATIONS
  // =============================================

  async createCourse(userId: string, createCourseDto: CreateCourseDto, thumbnail?: Express.Multer.File): Promise<CourseResponseDto> {
    try {
      let thumbnailUrl = createCourseDto.thumbnailUrl;

      // Upload thumbnail if provided
      if (thumbnail) {
        const fileName = `${userId}/${Date.now()}-${thumbnail.originalname}`;
        const uploadResult = await /* TODO: use StorageService */ this.db.uploadFile(
          'courses', // bucket name
          thumbnail.buffer,
          fileName,
          {
            contentType: thumbnail.mimetype,
            metadata: {
              userId,
              originalName: thumbnail.originalname,
            },
          }
        );
        thumbnailUrl = uploadResult.url;
      }

      // Prepare course data using existing schema structure
      const courseData = {
        title: createCourseDto.title,
        subtitle: createCourseDto.subtitle || null,
        description: createCourseDto.description,
        instructor_id: userId,
        category: createCourseDto.category,
        subcategory: createCourseDto.subcategory || null,
        level: createCourseDto.level,
        language: createCourseDto.language || 'en',

        // Media (using existing thumbnail and trailer fields)
        thumbnail: thumbnailUrl || null,
        trailer: createCourseDto.promoVideoUrl || null,

        // Arrays (using existing fields)
        tags: createCourseDto.tags || [],
        requirements: createCourseDto.prerequisites || [],
        learning_objectives: createCourseDto.learningOutcomes || [],
        target_audience: createCourseDto.targetAudience || [],

        // Pricing (stored as JSONB in existing pricing field)
        pricing: {
          type: createCourseDto.price && createCourseDto.price > 0 ? 'paid' : 'free',
          price: createCourseDto.price || 0,
          originalPrice: createCourseDto.originalPrice || null,
          currency: createCourseDto.currency || 'USD',
          refundPolicy: createCourseDto.refundPolicy || null,
        },

        // Features (stored in existing features JSONB array)
        features: [
          ...(createCourseDto.certificateEnabled ? ['certificate'] : []),
          ...(createCourseDto.discussionEnabled !== false ? ['discussion'] : []),
          ...(createCourseDto.qnaEnabled !== false ? ['qna'] : []),
          ...(createCourseDto.downloadableResources ? ['downloadable_resources'] : []),
          ...(createCourseDto.mobileAccess !== false ? ['mobile_access'] : []),
          ...(createCourseDto.lifetimeAccess !== false ? ['lifetime_access'] : []),
        ],

        // Certificate (using existing boolean field)
        certificate: createCourseDto.certificateEnabled ?? false,

        // Status
        status: createCourseDto.publishSettings?.status || 'draft',

        // Store additional settings in metadata-style fields
        // We'll use the existing rating field structure to store our custom data
        ai_recommendation_reasons: [
          ...(createCourseDto.certificateSettings ? [{ type: 'certificateSettings', data: createCourseDto.certificateSettings }] : []),
          ...(createCourseDto.publishSettings ? [{ type: 'publishSettings', data: createCourseDto.publishSettings }] : []),
          ...(createCourseDto.seoSettings ? [{ type: 'seoSettings', data: createCourseDto.seoSettings }] : []),
        ],
      };

      console.log('Creating course with data:', JSON.stringify(courseData, null, 2));

      // Create the course
      const course = await this.db.insert('courses', courseData);

      // Create modules and lessons if provided
      let modulesWithLessons = [];
      if (createCourseDto.modules && createCourseDto.modules.length > 0) {
        modulesWithLessons = await this.createModulesAndLessons(course.id, createCourseDto.modules);
      }

      return this.formatCourse(course, modulesWithLessons);
    } catch (error) {
      console.error('Course creation error:', error);
      throw new BadRequestException(`Failed to create course: ${error.message}`);
    }
  }

  private async createModulesAndLessons(courseId: string, modules: any[]): Promise<any[]> {
    const createdModules = [];

    for (const module of modules) {
      // Create chapter (module) - use existing sort_order field
      const chapterData = {
        course_id: courseId,
        title: module.title,
        description: module.description || null,
        sort_order: module.order || 0
      };

      const chapter = await this.db.insert('course_chapters', chapterData);

      // Create lessons for this module
      const createdLessons = [];
      if (module.lessons && module.lessons.length > 0) {
        for (let i = 0; i < module.lessons.length; i++) {
          const lesson = module.lessons[i];
          const lessonData = {
            chapter_id: chapter.id,
            course_id: courseId,
            title: lesson.title,
            description: lesson.description || null,
            type: lesson.type,
            duration: lesson.duration || null,
            sort_order: i + 1,
            is_free: lesson.isFree ?? false,
            content: {
              resourceUrl: lesson.resourceUrl || null,
              uploadedFile: lesson.uploadedFile || null
            }
          };

          const createdLesson = await this.db.insert('course_lessons', lessonData);
          createdLessons.push(this.formatLesson(createdLesson));
        }
      }

      createdModules.push({
        id: chapter.id,
        title: chapter.title,
        description: chapter.description,
        order: chapter.sort_order,
        lessons: createdLessons,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at
      });
    }

    return createdModules;
  }

  private formatLesson(lesson: any): any {
    const content = lesson.content || {};
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      duration: lesson.duration,
      isFree: lesson.is_free,
      resourceUrl: content.resourceUrl || null,
      uploadedFile: content.uploadedFile || null,
      createdAt: lesson.created_at,
      updatedAt: lesson.updated_at
    };
  }

  async getCourses(query: CourseQueryDto): Promise<PaginatedCoursesDto> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      // Add published status filter by default (only show published courses to public)
      if (!filters.status) {
        whereConditions.status = 'published';
      } else if (filters.status) {
        whereConditions.status = filters.status;
      }

      if (filters.search) {
        whereConditions.$or = [
          { title: { $ilike: `%${filters.search}%` } },
          { description: { $ilike: `%${filters.search}%` } },
          { short_description: { $ilike: `%${filters.search}%` } }
        ];
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.subcategory) {
        whereConditions.subcategory = filters.subcategory;
      }

      if (filters.level) {
        whereConditions.level = filters.level;
      }

      if (filters.price_type) {
        whereConditions.price_type = filters.price_type;
      }

      if (filters.language) {
        whereConditions.language = filters.language;
      }

      if (filters.instructor_id) {
        whereConditions.instructor_id = filters.instructor_id;
      }

      if (filters.is_featured !== undefined) {
        whereConditions.is_featured = filters.is_featured;
      }

      if (filters.ai_enhanced !== undefined) {
        whereConditions.ai_enhanced = filters.ai_enhanced;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereConditions.tags = { $overlap: filters.tags };
      }

      if (filters.min_duration || filters.max_duration) {
        whereConditions.duration_minutes = {};
        if (filters.min_duration) {
          whereConditions.duration_minutes.$gte = filters.min_duration;
        }
        if (filters.max_duration) {
          whereConditions.duration_minutes.$lte = filters.max_duration;
        }
      }

      if (filters.min_rating) {
        whereConditions.rating_average = { $gte: filters.min_rating };
      }

      const courses = await this.db.select('courses', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('courses', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: courses.map((course) => this.formatCourse(course)),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch courses: ${error.message}`);
    }
  }

  async getCourseById(courseId: string): Promise<CourseResponseDto> {
    try {
      const course = await this.db.findOne('courses', { id: courseId });

      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Fetch modules with lessons
      const modules = await this.getCoursesModulesWithLessons(courseId);

      return this.formatCourse(course, modules);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch course: ${error.message}`);
    }
  }

  private async getCoursesModulesWithLessons(courseId: string): Promise<any[]> {
    try {
      // Get all chapters for this course
      const chapters = await this.db.findMany('course_chapters', { course_id: courseId });

      if (!chapters || chapters.length === 0) {
        return [];
      }

      // Sort chapters by order
      const sortedChapters = chapters.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

      // Get lessons for each chapter
      const modulesWithLessons = [];
      for (const chapter of sortedChapters) {
        const lessons = await this.db.findMany('course_lessons', { chapter_id: chapter.id });
        const sortedLessons = lessons.sort((a, b) => a.sort_order - b.sort_order);

        modulesWithLessons.push({
          id: chapter.id,
          title: chapter.title,
          description: chapter.description,
          order: chapter.sort_order,
          lessons: sortedLessons.map((lesson) => this.formatLesson(lesson)),
          createdAt: chapter.created_at,
          updatedAt: chapter.updated_at
        });
      }

      return modulesWithLessons;
    } catch (error) {
      console.error('Error fetching modules with lessons:', error);
      return [];
    }
  }

  async updateCourse(userId: string, courseId: string, updateCourseDto: UpdateCourseDto): Promise<CourseResponseDto> {
    try {
      const existingCourse = await this.db.findOne('courses', { id: courseId });

      if (!existingCourse) {
        throw new NotFoundException('Course not found');
      }

      // Check if user is the instructor
      if (existingCourse.instructor_id !== userId) {
        throw new ForbiddenException('You can only update your own courses');
      }

      const updateData: any = { ...updateCourseDto };
      delete updateData.instructor_id; // Prevent changing instructor

      const updatedCourse = await this.db.update('courses', courseId, updateData);
      return this.formatCourse(updatedCourse);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update course: ${error.message}`);
    }
  }

  async deleteCourse(userId: string, courseId: string): Promise<void> {
    try {
      const existingCourse = await this.db.findOne('courses', { id: courseId });

      if (!existingCourse) {
        throw new NotFoundException('Course not found');
      }

      // Check if user is the instructor
      if (existingCourse.instructor_id !== userId) {
        throw new ForbiddenException('You can only delete your own courses');
      }

      await this.db.delete('courses', courseId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete course: ${error.message}`);
    }
  }

  // =============================================
  // ENROLLMENT OPERATIONS
  // =============================================

  async enrollInCourse(userId: string, courseId: string, enrollmentDto: CourseEnrollmentDto): Promise<CourseEnrollmentResponseDto> {
    try {
      // Check if course exists
      const course = await this.db.findOne('courses', { id: courseId });
      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check if user is already enrolled
      const existingEnrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: courseId
      });

      if (existingEnrollment) {
        throw new BadRequestException('Already enrolled in this course');
      }

      const enrollmentData = {
        user_id: userId,
        course_id: courseId,
        metadata: enrollmentDto.metadata || {},
      };

      const result = await this.db.insert('course_enrollments', enrollmentData);

      // Update course enrollment count
      await this.updateCourseStats(courseId);

      // Send notifications
      try {
        const user = await this.db.getUserById(userId);

        // Notify the student about successful enrollment
        await this.notificationsService.sendNotification({
          user_id: userId,
          type: NotificationType.UPDATE,
          title: '📚 Enrolled Successfully!',
          message: `You have successfully enrolled in "${course.title}". Start learning now!`,
          priority: NotificationPriority.NORMAL,
          action_url: `/courses/${courseId}`,
          data: {
            courseId,
            courseTitle: course.title,
            enrollmentId: result.id,
          },
          send_push: true,
        });

        // Notify the instructor about new enrollment
        if (course.instructor_id && course.instructor_id !== userId) {
          await this.notificationsService.sendNotification({
            user_id: course.instructor_id,
            type: NotificationType.UPDATE,
            title: '🎓 New Student Enrolled!',
            message: `${user?.name || 'A new student'} has enrolled in your course "${course.title}".`,
            priority: NotificationPriority.NORMAL,
            action_url: `/courses/${courseId}/students`,
            data: {
              courseId,
              courseTitle: course.title,
              studentId: userId,
              studentName: user?.name,
            },
            send_push: false,
          });
        }
      } catch (error) {
        console.error('[CoursesService] Failed to send enrollment notification:', error);
      }

      return this.formatEnrollment(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to enroll in course: ${error.message}`);
    }
  }

  async getUserEnrollments(userId: string, query: Partial<CourseQueryDto> = {}): Promise<CourseEnrollmentResponseDto[]> {
    try {
      const { status = 'active' } = query;

      const whereConditions: any = { user_id: userId };
      if (status) {
        whereConditions.status = status;
      }

      const enrollments = await this.db.findMany('course_enrollments', whereConditions);
      return enrollments.map(this.formatEnrollment);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch enrollments: ${error.message}`);
    }
  }

  async getCourseProgress(userId: string, courseId: string): Promise<CourseEnrollmentResponseDto> {
    try {
      const enrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: courseId
      });

      if (!enrollment) {
        throw new NotFoundException('Not enrolled in this course');
      }

      return this.formatEnrollment(enrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch course progress: ${error.message}`);
    }
  }

  async updateCourseProgress(userId: string, courseId: string, updateProgressDto: CourseProgressDto): Promise<CourseEnrollmentResponseDto> {
    try {
      const enrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: courseId
      });

      if (!enrollment) {
        throw new NotFoundException('Not enrolled in this course');
      }

      const updateData: any = {
        last_accessed_at: new Date().toISOString(),
        ...updateProgressDto
      };

      const updatedEnrollment = await this.db.update('course_enrollments', enrollment.id, updateData);
      return this.formatEnrollment(updatedEnrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update course progress: ${error.message}`);
    }
  }

  async completeLessonProgress(userId: string, courseId: string, lessonId: string): Promise<CourseEnrollmentResponseDto> {
    try {
      const enrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: courseId
      });

      if (!enrollment) {
        throw new NotFoundException('Not enrolled in this course');
      }

      const completedLessons = enrollment.completed_lessons || [];
      if (!completedLessons.includes(lessonId)) {
        completedLessons.push(lessonId);
      }

      // Calculate progress percentage based on completed lessons
      const course = await this.db.findOne('courses', { id: courseId });
      const progressPercentage = course.total_lessons > 0 
        ? (completedLessons.length / course.total_lessons) * 100 
        : 0;

      const isNowComplete = progressPercentage >= 100 && !enrollment.completion_date;

      const updateData = {
        completed_lessons: completedLessons,
        current_lesson_id: lessonId,
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString(),
        completion_date: progressPercentage >= 100 ? new Date().toISOString() : null,
      };

      const updatedEnrollment = await this.db.update('course_enrollments', enrollment.id, updateData);

      // Send notification when course is completed
      if (isNowComplete) {
        try {
          // Notify student about course completion
          await this.notificationsService.sendNotification({
            user_id: userId,
            type: NotificationType.ACHIEVEMENT,
            title: '🎉 Course Completed!',
            message: `Congratulations! You have completed "${course.title}". ${course.certificate ? 'Your certificate is now available!' : 'Well done!'}`,
            priority: NotificationPriority.HIGH,
            action_url: `/courses/${courseId}/certificate`,
            data: { courseId, courseTitle: course.title, completedAt: new Date().toISOString() },
            send_push: true,
          });

          // Notify instructor about student completion
          if (course.instructor_id && course.instructor_id !== userId) {
            const user = await this.db.getUserById(userId);
            await this.notificationsService.sendNotification({
              user_id: course.instructor_id,
              type: NotificationType.UPDATE,
              title: '🎓 Student Completed Course!',
              message: `${user?.name || 'A student'} has completed your course "${course.title}".`,
              priority: NotificationPriority.NORMAL,
              action_url: `/courses/${courseId}/students`,
              data: { courseId, courseTitle: course.title, studentId: userId },
              send_push: false,
            });
          }
        } catch (notifError) {
          console.error('[CoursesService] Error sending completion notification:', notifError);
        }
      }

      return this.formatEnrollment(updatedEnrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update lesson progress: ${error.message}`);
    }
  }

  // =============================================
  // INSTRUCTOR OPERATIONS
  // =============================================

  async getInstructorCourses(userId: string, query: CourseQueryDto): Promise<PaginatedCoursesDto> {
    try {
      const modifiedQuery = { ...query, instructor_id: userId };
      delete modifiedQuery.status; // Allow instructors to see all their course statuses

      return this.getCourses(modifiedQuery);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch instructor courses: ${error.message}`);
    }
  }

  async getCourseEnrollments(instructorId: string, courseId: string): Promise<CourseEnrollmentResponseDto[]> {
    try {
      // Verify instructor owns the course
      const course = await this.db.findOne('courses', { 
        id: courseId, 
        instructor_id: instructorId 
      });

      if (!course) {
        throw new NotFoundException('Course not found or you do not have permission to view enrollments');
      }

      const enrollments = await this.db.findMany('course_enrollments', { course_id: courseId });
      return enrollments.map(this.formatEnrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch course enrollments: ${error.message}`);
    }
  }

  async getEnrolledCoursesWithLimit(userId: string, limit = 10): Promise<CourseResponseDto[]> {
    try {
      // Get user's enrollments
      const enrollments = await this.db.select('course_enrollments', {
        where: { user_id: userId, status: 'active' },
        orderBy: 'enrolled_date',
        order: 'desc',
        limit
      });

      const courseIds = enrollments.map((e: any) => e.course_id);
      
      if (courseIds.length === 0) {
        return [];
      }

      // Get course details for enrolled courses
      const courses = await this.db.findMany('courses', {
        id: { $in: courseIds }
      });

      return courses.map((course) => this.formatCourse(course));
    } catch (error) {
      throw new BadRequestException(`Failed to fetch enrolled courses: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async updateCourseStats(courseId: string): Promise<void> {
    try {
      const enrollments = await this.db.findMany('course_enrollments', { course_id: courseId });
      const enrollmentCount = enrollments.length;

      // Calculate completion rate
      const completedEnrollments = enrollments.filter((e: any) => e.progress_percentage >= 100);
      const completionRate = enrollmentCount > 0 ? (completedEnrollments.length / enrollmentCount) * 100 : 0;

      await this.db.update('courses', courseId, {
        enrollment_count: enrollmentCount,
        completion_rate: completionRate,
      });
    } catch (error) {
      console.error('Failed to update course stats:', error);
    }
  }

  private formatCourse(course: any, modules?: any[]): CourseResponseDto {
    // Extract pricing from JSONB field
    const pricing = course.pricing || { type: 'free', price: 0 };

    // Extract settings from ai_recommendation_reasons array (where we stored them)
    const settings = (course.ai_recommendation_reasons || []).reduce((acc: any, item: any) => {
      if (item.type) acc[item.type] = item.data;
      return acc;
    }, {});

    // Extract features
    const features = course.features || [];

    return {
      id: course.id,
      instructorId: course.instructor_id,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      category: course.category,
      subcategory: course.subcategory,
      level: course.level,
      language: course.language,

      // Pricing (from JSONB pricing field)
      price: pricing.price || null,
      originalPrice: pricing.originalPrice || null,
      currency: pricing.currency || 'USD',
      refundPolicy: pricing.refundPolicy || null,

      // Media
      thumbnailUrl: course.thumbnail,
      promoVideoUrl: course.trailer,
      promoVideoType: course.trailer ? (course.trailer.includes('youtube') ? 'youtube' : 'url') : null,

      // Curriculum
      modules: modules || [],

      // Arrays
      tags: course.tags || [],
      prerequisites: course.requirements || [],
      learningOutcomes: course.learning_objectives || [],
      targetAudience: course.target_audience || [],

      // Features (extracted from features array)
      certificateEnabled: course.certificate || features.includes('certificate'),
      discussionEnabled: features.includes('discussion') || !features.length,
      qnaEnabled: features.includes('qna') || !features.length,
      downloadableResources: features.includes('downloadable_resources'),
      mobileAccess: features.includes('mobile_access') || !features.length,
      lifetimeAccess: features.includes('lifetime_access') || !features.length,

      // Settings (extracted from ai_recommendation_reasons)
      certificateSettings: settings.certificateSettings || {},
      publishSettings: settings.publishSettings || {},
      seoSettings: settings.seoSettings || {},

      // Status
      status: course.status,

      // Analytics (mock data for now)
      analytics: {
        views: 0,
        enrollments: 0,
        rating: 0,
        reviews: 0
      },

      // Timestamps
      createdAt: course.created_at,
      updatedAt: course.updated_at,
    };
  }

  private formatEnrollment(enrollment: any): CourseEnrollmentResponseDto {
    return {
      id: enrollment.id,
      user_id: enrollment.user_id,
      course_id: enrollment.course_id,
      enrollment_date: enrollment.enrollment_date,
      completion_date: enrollment.completion_date,
      progress_percentage: parseFloat(enrollment.progress_percentage || 0),
      total_study_time: enrollment.total_study_time || 0,
      current_lesson_id: enrollment.current_lesson_id,
      current_chapter_id: enrollment.current_chapter_id,
      completed_lessons: enrollment.completed_lessons || [],
      bookmarked_lessons: enrollment.bookmarked_lessons || [],
      last_accessed_at: enrollment.last_accessed_at,
      status: enrollment.status,
      certificate_issued: enrollment.certificate_issued || false,
      certificate_issued_at: enrollment.certificate_issued_at,
      rating: enrollment.rating,
      review: enrollment.review,
      reviewed_at: enrollment.reviewed_at,
    };
  }
}