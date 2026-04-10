import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CourseResponseDto } from '../courses/dto';
import {
  CreateLearningPathDto,
  UpdateLearningPathDto,
  AddCourseToPathDto,
  UpdateCourseOrderDto,
  LearningPathQueryDto,
  LearningPathResponseDto,
  LearningPathWithCoursesDto,
  LearningPathCourseDto,
  LearningPathEnrollmentDto,
  PaginatedLearningPathsDto,
} from './dto';

@Injectable()
export class LearningPathsService {
  constructor(private readonly db: DatabaseService) {}

  // =============================================
  // LEARNING PATH CRUD OPERATIONS
  // =============================================

  async createLearningPath(userId: string, createLearningPathDto: CreateLearningPathDto): Promise<LearningPathResponseDto> {
    try {
      const learningPathData = {
        title: createLearningPathDto.title,
        description: createLearningPathDto.description,
        thumbnail_url: createLearningPathDto.thumbnail_url || null,
        creator_id: userId,
        category: createLearningPathDto.category,
        level: createLearningPathDto.level,
        estimated_duration_weeks: createLearningPathDto.estimated_duration_weeks,
        skills: createLearningPathDto.skills || [],
        prerequisites: createLearningPathDto.prerequisites || [],
        learning_objectives: createLearningPathDto.learning_objectives || [],
        is_public: createLearningPathDto.is_public ?? true,
        metadata: createLearningPathDto.metadata || {},
      };

      console.log('Creating learning path with data:', JSON.stringify(learningPathData, null, 2));

      const result = await this.db.insert('learning_paths', learningPathData);
      return this.formatLearningPath(result);
    } catch (error) {
      console.error('Learning path creation error:', error);
      throw new BadRequestException(`Failed to create learning path: ${error.message}`);
    }
  }

  async getLearningPaths(query: LearningPathQueryDto): Promise<PaginatedLearningPathsDto> {
    try {
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
      const offset = (page - 1) * limit;

      const whereConditions: any = {};

      // Add published status filter by default (only show published paths to public)
      if (!filters.status) {
        whereConditions.status = 'published';
      } else if (filters.status) {
        whereConditions.status = filters.status;
      }

      // Default to public paths only
      if (filters.is_public === undefined) {
        whereConditions.is_public = true;
      } else if (filters.is_public !== undefined) {
        whereConditions.is_public = filters.is_public;
      }

      if (filters.search) {
        whereConditions.$or = [
          { title: { $ilike: `%${filters.search}%` } },
          { description: { $ilike: `%${filters.search}%` } }
        ];
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.level) {
        whereConditions.level = filters.level;
      }

      if (filters.creator_id) {
        whereConditions.creator_id = filters.creator_id;
      }

      if (filters.is_featured !== undefined) {
        whereConditions.is_featured = filters.is_featured;
      }

      if (filters.min_duration || filters.max_duration) {
        whereConditions.estimated_duration_weeks = {};
        if (filters.min_duration) {
          whereConditions.estimated_duration_weeks.$gte = filters.min_duration;
        }
        if (filters.max_duration) {
          whereConditions.estimated_duration_weeks.$lte = filters.max_duration;
        }
      }

      if (filters.min_rating) {
        whereConditions.rating_average = { $gte: filters.min_rating };
      }

      const learningPaths = await this.db.select('learning_paths', {
        where: whereConditions,
        orderBy: sort_by,
        order: sort_order,
        limit,
        offset,
      });

      const allRecords = await this.db.findMany('learning_paths', whereConditions);
      const totalCount = allRecords.length;

      return {
        data: learningPaths.map(this.formatLearningPath),
        total: totalCount,
        page,
        limit,
        total_pages: Math.ceil(totalCount / limit),
      };
    } catch (error) {
      throw new BadRequestException(`Failed to fetch learning paths: ${error.message}`);
    }
  }

  async getLearningPathById(pathId: string, includePrivate = false): Promise<LearningPathWithCoursesDto> {
    try {
      const learningPath = await this.db.findOne('learning_paths', { id: pathId });

      if (!learningPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Check if path is public or if private access is allowed
      if (!learningPath.is_public && !includePrivate) {
        throw new NotFoundException('Learning path not found');
      }

      // Get associated courses
      const pathCourses = await this.db.select('learning_path_courses', {
        where: { learning_path_id: pathId },
        orderBy: 'order_index',
        order: 'asc',
      });

      // Fetch course details for each path course
      const coursesWithDetails = await Promise.all(
        pathCourses.map(async (pathCourse: any) => {
          try {
            const course = await this.db.findOne('courses', { id: pathCourse.course_id });
            return {
              ...this.formatPathCourse(pathCourse),
              course: course ? {
                id: course.id,
                title: course.title,
                description: course.description,
                level: course.level,
                duration_minutes: course.duration_minutes,
                thumbnail_url: course.thumbnail_url,
                status: course.status,
              } : null,
            };
          } catch (error) {
            console.warn(`Failed to fetch course ${pathCourse.course_id}:`, error.message);
            return this.formatPathCourse(pathCourse);
          }
        })
      );

      return {
        ...this.formatLearningPath(learningPath),
        courses: coursesWithDetails as (LearningPathCourseDto & { course?: Partial<CourseResponseDto> })[],
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch learning path: ${error.message}`);
    }
  }

  async updateLearningPath(userId: string, pathId: string, updateLearningPathDto: UpdateLearningPathDto): Promise<LearningPathResponseDto> {
    try {
      const existingPath = await this.db.findOne('learning_paths', { id: pathId });

      if (!existingPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Check if user is the creator
      if (existingPath.creator_id !== userId) {
        throw new ForbiddenException('You can only update your own learning paths');
      }

      const updateData: any = { ...updateLearningPathDto };
      delete updateData.creator_id; // Prevent changing creator

      const updatedPath = await this.db.update('learning_paths', pathId, updateData);
      return this.formatLearningPath(updatedPath);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update learning path: ${error.message}`);
    }
  }

  async deleteLearningPath(userId: string, pathId: string): Promise<void> {
    try {
      const existingPath = await this.db.findOne('learning_paths', { id: pathId });

      if (!existingPath) {
        throw new NotFoundException('Learning path not found');
      }

      // Check if user is the creator
      if (existingPath.creator_id !== userId) {
        throw new ForbiddenException('You can only delete your own learning paths');
      }

      // Delete associated courses first
      const pathCourses = await this.db.findMany('learning_path_courses', { learning_path_id: pathId });
      for (const pathCourse of pathCourses) {
        await this.db.delete('learning_path_courses', pathCourse.id);
      }

      // Delete the learning path
      await this.db.delete('learning_paths', pathId);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete learning path: ${error.message}`);
    }
  }

  // =============================================
  // COURSE MANAGEMENT OPERATIONS
  // =============================================

  async addCourseToPath(userId: string, pathId: string, addCourseDto: AddCourseToPathDto): Promise<LearningPathCourseDto> {
    try {
      // Verify user owns the learning path
      const learningPath = await this.db.findOne('learning_paths', { 
        id: pathId, 
        creator_id: userId 
      });

      if (!learningPath) {
        throw new NotFoundException('Learning path not found or you do not have permission to modify it');
      }

      // Verify course exists
      const course = await this.db.findOne('courses', { id: addCourseDto.course_id });
      if (!course) {
        throw new NotFoundException('Course not found');
      }

      // Check if course is already in path
      const existingPathCourse = await this.db.findOne('learning_path_courses', {
        learning_path_id: pathId,
        course_id: addCourseDto.course_id
      });

      if (existingPathCourse) {
        throw new BadRequestException('Course is already in this learning path');
      }

      const pathCourseData = {
        learning_path_id: pathId,
        course_id: addCourseDto.course_id,
        order_index: addCourseDto.order_index,
        is_required: addCourseDto.is_required ?? true,
        unlock_after: addCourseDto.unlock_after || [],
      };

      const result = await this.db.insert('learning_path_courses', pathCourseData);

      // Update course count
      await this.updateLearningPathStats(pathId);

      return this.formatPathCourse(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add course to learning path: ${error.message}`);
    }
  }

  async removeCourseFromPath(userId: string, pathId: string, courseId: string): Promise<void> {
    try {
      // Verify user owns the learning path
      const learningPath = await this.db.findOne('learning_paths', { 
        id: pathId, 
        creator_id: userId 
      });

      if (!learningPath) {
        throw new NotFoundException('Learning path not found or you do not have permission to modify it');
      }

      const pathCourse = await this.db.findOne('learning_path_courses', {
        learning_path_id: pathId,
        course_id: courseId
      });

      if (!pathCourse) {
        throw new NotFoundException('Course not found in this learning path');
      }

      await this.db.delete('learning_path_courses', pathCourse.id);

      // Update course count
      await this.updateLearningPathStats(pathId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove course from learning path: ${error.message}`);
    }
  }

  async updateCourseOrder(userId: string, pathId: string, courseId: string, updateOrderDto: UpdateCourseOrderDto): Promise<LearningPathCourseDto> {
    try {
      // Verify user owns the learning path
      const learningPath = await this.db.findOne('learning_paths', { 
        id: pathId, 
        creator_id: userId 
      });

      if (!learningPath) {
        throw new NotFoundException('Learning path not found or you do not have permission to modify it');
      }

      const pathCourse = await this.db.findOne('learning_path_courses', {
        learning_path_id: pathId,
        course_id: courseId
      });

      if (!pathCourse) {
        throw new NotFoundException('Course not found in this learning path');
      }

      const updatedPathCourse = await this.db.update('learning_path_courses', pathCourse.id, updateOrderDto);
      return this.formatPathCourse(updatedPathCourse);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update course order: ${error.message}`);
    }
  }

  // =============================================
  // ENROLLMENT OPERATIONS
  // =============================================

  async enrollInLearningPath(userId: string, pathId: string): Promise<LearningPathEnrollmentDto> {
    try {
      // Check if learning path exists and is available
      const learningPath = await this.db.findOne('learning_paths', { 
        id: pathId,
        status: 'published',
        is_public: true
      });

      if (!learningPath) {
        throw new NotFoundException('Learning path not found or not available');
      }

      // Check if user is already enrolled
      const existingEnrollment = await this.db.findOne('user_progress', {
        user_id: userId,
        entity_type: 'learning_path',
        entity_id: pathId
      });

      if (existingEnrollment) {
        throw new BadRequestException('Already enrolled in this learning path');
      }

      // Create enrollment record
      const enrollmentData = {
        user_id: userId,
        entity_type: 'learning_path',
        entity_id: pathId,
        progress_percentage: 0,
        status: 'in_progress',
        metadata: { enrolled_at: new Date().toISOString() },
      };

      const result = await this.db.insert('user_progress', enrollmentData);

      // Update enrollment count
      await this.updateLearningPathStats(pathId);

      return this.formatPathEnrollment(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to enroll in learning path: ${error.message}`);
    }
  }

  async getLearningPathProgress(userId: string, pathId: string): Promise<LearningPathEnrollmentDto> {
    try {
      const enrollment = await this.db.findOne('user_progress', {
        user_id: userId,
        entity_type: 'learning_path',
        entity_id: pathId
      });

      if (!enrollment) {
        throw new NotFoundException('Not enrolled in this learning path');
      }

      return this.formatPathEnrollment(enrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch learning path progress: ${error.message}`);
    }
  }

  async updateLearningPathProgress(userId: string, pathId: string, courseId: string): Promise<LearningPathEnrollmentDto> {
    try {
      const enrollment = await this.db.findOne('user_progress', {
        user_id: userId,
        entity_type: 'learning_path',
        entity_id: pathId
      });

      if (!enrollment) {
        throw new NotFoundException('Not enrolled in this learning path');
      }

      // Get path courses to calculate progress
      const pathCourses = await this.db.findMany('learning_path_courses', { learning_path_id: pathId });
      const totalCourses = pathCourses.length;

      // Get completed courses from metadata
      const metadata = enrollment.metadata || {};
      const completedCourses = new Set(metadata.completed_courses || []);
      completedCourses.add(courseId);

      const progressPercentage = totalCourses > 0 ? (completedCourses.size / totalCourses) * 100 : 0;

      const updateData = {
        progress_percentage: progressPercentage,
        last_accessed_at: new Date().toISOString(),
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null,
        status: progressPercentage >= 100 ? 'completed' : 'in_progress',
        metadata: {
          ...metadata,
          completed_courses: Array.from(completedCourses),
          current_course_id: courseId,
        },
      };

      const updatedEnrollment = await this.db.update('user_progress', enrollment.id, updateData);
      return this.formatPathEnrollment(updatedEnrollment);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update learning path progress: ${error.message}`);
    }
  }

  // =============================================
  // CREATOR OPERATIONS
  // =============================================

  async getCreatorLearningPaths(userId: string, query: LearningPathQueryDto): Promise<PaginatedLearningPathsDto> {
    try {
      const modifiedQuery = { ...query, creator_id: userId };
      delete modifiedQuery.status; // Allow creators to see all their path statuses
      delete modifiedQuery.is_public; // Allow creators to see both public and private paths

      return this.getLearningPathsInternal(modifiedQuery);
    } catch (error) {
      throw new BadRequestException(`Failed to fetch creator learning paths: ${error.message}`);
    }
  }

  private async getLearningPathsInternal(query: LearningPathQueryDto): Promise<PaginatedLearningPathsDto> {
    const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'desc', ...filters } = query;
    const offset = (page - 1) * limit;

    const whereConditions: any = {};

    if (filters.creator_id) {
      whereConditions.creator_id = filters.creator_id;
    }

    if (filters.status) {
      whereConditions.status = filters.status;
    }

    if (filters.is_public !== undefined) {
      whereConditions.is_public = filters.is_public;
    }

    if (filters.search) {
      whereConditions.$or = [
        { title: { $ilike: `%${filters.search}%` } },
        { description: { $ilike: `%${filters.search}%` } }
      ];
    }

    if (filters.category) {
      whereConditions.category = filters.category;
    }

    if (filters.level) {
      whereConditions.level = filters.level;
    }

    const learningPaths = await this.db.select('learning_paths', {
      where: whereConditions,
      orderBy: sort_by,
      order: sort_order,
      limit,
      offset,
    });

    const allRecords = await this.db.findMany('learning_paths', whereConditions);
    const totalCount = allRecords.length;

    return {
      data: learningPaths.map(this.formatLearningPath),
      total: totalCount,
      page,
      limit,
      total_pages: Math.ceil(totalCount / limit),
    };
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async updateLearningPathStats(pathId: string): Promise<void> {
    try {
      const pathCourses = await this.db.findMany('learning_path_courses', { learning_path_id: pathId });
      const courseCount = pathCourses.length;

      // Calculate completion rate
      const enrollments = await this.db.findMany('user_progress', { 
        entity_type: 'learning_path',
        entity_id: pathId 
      });
      const enrollmentCount = enrollments.length;
      const completedEnrollments = enrollments.filter((e: any) => e.progress_percentage >= 100);
      const completionRate = enrollmentCount > 0 ? (completedEnrollments.length / enrollmentCount) * 100 : 0;

      await this.db.update('learning_paths', pathId, {
        course_count: courseCount,
        enrollment_count: enrollmentCount,
        completion_rate: completionRate,
      });
    } catch (error) {
      console.error('Failed to update learning path stats:', error);
    }
  }

  private formatLearningPath(learningPath: any): LearningPathResponseDto {
    return {
      id: learningPath.id,
      title: learningPath.title,
      description: learningPath.description,
      thumbnail_url: learningPath.thumbnail_url,
      creator_id: learningPath.creator_id,
      category: learningPath.category,
      level: learningPath.level,
      estimated_duration_weeks: learningPath.estimated_duration_weeks,
      course_count: learningPath.course_count || 0,
      enrollment_count: learningPath.enrollment_count || 0,
      completion_rate: parseFloat(learningPath.completion_rate || 0),
      rating_average: parseFloat(learningPath.rating_average || 0),
      rating_count: learningPath.rating_count || 0,
      skills: learningPath.skills || [],
      prerequisites: learningPath.prerequisites || [],
      learning_objectives: learningPath.learning_objectives || [],
      is_public: learningPath.is_public || false,
      is_featured: learningPath.is_featured || false,
      status: learningPath.status,
      published_at: learningPath.published_at,
      metadata: learningPath.metadata || {},
      created_at: learningPath.created_at,
      updated_at: learningPath.updated_at,
    };
  }

  private formatPathCourse(pathCourse: any): LearningPathCourseDto {
    return {
      id: pathCourse.id,
      learning_path_id: pathCourse.learning_path_id,
      course_id: pathCourse.course_id,
      order_index: pathCourse.order_index,
      is_required: pathCourse.is_required || false,
      unlock_after: pathCourse.unlock_after || [],
      created_at: pathCourse.created_at,
    };
  }

  private formatPathEnrollment(enrollment: any): LearningPathEnrollmentDto {
    const metadata = enrollment.metadata || {};
    return {
      id: enrollment.id,
      user_id: enrollment.user_id,
      learning_path_id: enrollment.entity_id,
      enrollment_date: metadata.enrolled_at || enrollment.created_at,
      completion_date: enrollment.completed_at,
      progress_percentage: parseFloat(enrollment.progress_percentage || 0),
      completed_courses: metadata.completed_courses || [],
      current_course_id: metadata.current_course_id,
      last_accessed_at: enrollment.last_accessed_at,
      status: enrollment.status,
      certificate_issued: metadata.certificate_issued || false,
      certificate_issued_at: metadata.certificate_issued_at,
    };
  }
}