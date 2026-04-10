import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import {
  CreateLessonDto,
  CreateResourceDto,
  LessonResponseDto,
  ResourceResponseDto,
  PaginatedLessonsDto,
  PaginatedResourcesDto,
  ContentQueryDto,
} from './dto';

@Injectable()
export class ContentService {
  constructor(private readonly db: DatabaseService) {}

  // =============================================
  // LESSON METHODS
  // =============================================

  async createLesson(userId: string, createLessonDto: CreateLessonDto): Promise<LessonResponseDto> {
    try {
      const lessonId = `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const lessonData: LessonResponseDto = {
        id: lessonId,
        title: createLessonDto.title,
        description: createLessonDto.description,
        type: createLessonDto.type,
        courseId: createLessonDto.courseId,
        chapterId: createLessonDto.chapterId,
        content: createLessonDto.content,
        difficulty: createLessonDto.difficulty,
        duration: createLessonDto.duration,
        order: createLessonDto.order || 1,
        tags: createLessonDto.tags || [],
        prerequisites: createLessonDto.prerequisites || [],
        objectives: createLessonDto.objectives || [],
        resources: createLessonDto.resources || [],
        isPublished: createLessonDto.isPublished || false,
        isFree: createLessonDto.isFree || false,
        interactiveElements: createLessonDto.interactiveElements || {},
        completionCriteria: createLessonDto.completionCriteria || {},
        viewCount: 0,
        averageRating: 0,
        ratingCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: userId,
          username: `user_${userId.split('_')[1] || userId}`,
          fullName: 'Content Creator',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      // Store lesson data using database
      // await this.db.storeData(`lesson_${lessonId}`, lessonData);

      return lessonData;
    } catch (error) {
      throw new BadRequestException('Failed to create lesson: ' + error.message);
    }
  }

  async getLessons(userId: string, query: ContentQueryDto): Promise<PaginatedLessonsDto> {
    try {
      // Mock implementation - in real app, this would query the database
      const mockLessons: LessonResponseDto[] = [
        {
          id: 'lesson_1',
          title: 'Introduction to React Hooks',
          description: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks',
          type: 'video' as any,
          courseId: 'course_react_advanced',
          chapterId: 'chapter_hooks',
          content: '# Introduction to React Hooks\n\nReact Hooks are functions that let you use state...',
          difficulty: 'intermediate' as any,
          duration: 45,
          order: 1,
          tags: ['react', 'hooks', 'javascript', 'frontend'],
          prerequisites: ['Basic JavaScript', 'React Components'],
          objectives: [
            'Understand what React Hooks are',
            'Use useState for component state',
            'Apply useEffect for side effects',
          ],
          resources: [
            {
              type: 'video',
              url: 'https://example.com/lesson-video.mp4',
              title: 'React Hooks Tutorial',
              duration: 1800,
            },
          ],
          isPublished: true,
          isFree: false,
          interactiveElements: {
            hasQuiz: true,
            hasCodeEditor: true,
            hasDiscussions: true,
          },
          completionCriteria: {
            requiresQuizPass: true,
            minimumScore: 70,
            requiresTimeSpent: 30,
          },
          viewCount: 1234,
          averageRating: 4.5,
          ratingCount: 89,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z',
          author: {
            id: 'user_123',
            username: 'react_instructor',
            fullName: 'React Instructor',
            avatar: 'https://example.com/instructor-avatar.jpg',
          },
        },
        {
          id: 'lesson_2',
          title: 'Advanced useEffect Patterns',
          description: 'Master advanced patterns with useEffect including cleanup, dependencies, and custom hooks',
          type: 'interactive' as any,
          courseId: 'course_react_advanced',
          chapterId: 'chapter_hooks',
          content: '# Advanced useEffect Patterns\n\nIn this lesson, we\'ll explore...',
          difficulty: 'advanced' as any,
          duration: 60,
          order: 2,
          tags: ['react', 'useeffect', 'hooks', 'advanced'],
          prerequisites: ['React Hooks Basics', 'JavaScript ES6+'],
          objectives: [
            'Master useEffect cleanup functions',
            'Understand dependency arrays',
            'Create custom hooks with useEffect',
          ],
          resources: [],
          isPublished: true,
          isFree: false,
          interactiveElements: {
            hasQuiz: true,
            hasCodeEditor: true,
            hasAssignment: true,
          },
          completionCriteria: {
            requiresQuizPass: true,
            minimumScore: 80,
            requiresAssignmentSubmission: true,
          },
          viewCount: 856,
          averageRating: 4.7,
          ratingCount: 45,
          createdAt: '2024-01-16T14:00:00Z',
          updatedAt: '2024-01-16T14:00:00Z',
          author: {
            id: 'user_123',
            username: 'react_instructor',
            fullName: 'React Instructor',
            avatar: 'https://example.com/instructor-avatar.jpg',
          },
        },
      ];

      // Apply filters
      let filteredLessons = mockLessons;

      if (query.search) {
        filteredLessons = filteredLessons.filter(
          lesson =>
            lesson.title.toLowerCase().includes(query.search.toLowerCase()) ||
            (lesson.description && lesson.description.toLowerCase().includes(query.search.toLowerCase())),
        );
      }

      if (query.courseId) {
        filteredLessons = filteredLessons.filter(lesson => lesson.courseId === query.courseId);
      }

      if (query.chapterId) {
        filteredLessons = filteredLessons.filter(lesson => lesson.chapterId === query.chapterId);
      }

      if (query.type) {
        filteredLessons = filteredLessons.filter(lesson => lesson.type === query.type);
      }

      if (query.difficulty) {
        filteredLessons = filteredLessons.filter(lesson => lesson.difficulty === query.difficulty);
      }

      if (query.freeOnly) {
        filteredLessons = filteredLessons.filter(lesson => lesson.isFree);
      }

      if (query.publishedOnly !== false) {
        filteredLessons = filteredLessons.filter(lesson => lesson.isPublished);
      }

      // Add user progress if authenticated
      if (userId !== 'guest') {
        filteredLessons = filteredLessons.map(lesson => ({
          ...lesson,
          userProgress: {
            isCompleted: Math.random() > 0.5,
            progress: Math.floor(Math.random() * 100),
            timeSpent: Math.floor(Math.random() * 60),
            lastAccessedAt: new Date().toISOString(),
            score: Math.floor(Math.random() * 100),
          },
        }));
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedLessons = filteredLessons.slice(startIndex, endIndex);
      const total = filteredLessons.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: paginatedLessons,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch lessons: ' + error.message);
    }
  }

  async getLessonById(userId: string, id: string): Promise<LessonResponseDto> {
    try {
      // Mock implementation
      const mockLesson: LessonResponseDto = {
        id,
        title: 'Introduction to React Hooks',
        description: 'Learn the fundamentals of React Hooks including useState, useEffect, and custom hooks',
        type: 'video' as any,
        courseId: 'course_react_advanced',
        chapterId: 'chapter_hooks',
        content: '# Introduction to React Hooks\n\nReact Hooks are functions that let you use state and other React features without writing a class. They were introduced in React 16.8 and have revolutionized how we write React components.\n\n## What are Hooks?\n\nHooks are JavaScript functions that start with "use" and allow you to hook into React state and lifecycle features from function components.\n\n## Most Common Hooks\n\n### useState\n\nThe useState hook allows you to add state to function components:\n\n```javascript\nimport React, { useState } from \'react\';\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```\n\n### useEffect\n\nThe useEffect hook lets you perform side effects in function components:\n\n```javascript\nimport React, { useState, useEffect } from \'react\';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n\n  useEffect(() => {\n    document.title = `You clicked ${count} times`;\n  });\n\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>\n        Click me\n      </button>\n    </div>\n  );\n}\n```',
        difficulty: 'intermediate' as any,
        duration: 45,
        order: 1,
        tags: ['react', 'hooks', 'javascript', 'frontend'],
        prerequisites: ['Basic JavaScript', 'React Components'],
        objectives: [
          'Understand what React Hooks are and why they were introduced',
          'Use useState to manage component state',
          'Apply useEffect for side effects and lifecycle methods',
          'Recognize the rules of hooks and follow best practices',
        ],
        resources: [
          {
            type: 'video',
            url: 'https://example.com/lesson-video.mp4',
            title: 'React Hooks Tutorial Video',
            description: 'Complete video tutorial covering React Hooks basics',
            duration: 1800,
          },
          {
            type: 'document',
            url: 'https://example.com/hooks-cheatsheet.pdf',
            title: 'React Hooks Cheat Sheet',
            description: 'Quick reference guide for React Hooks',
          },
          {
            type: 'code',
            url: 'https://github.com/example/react-hooks-examples',
            title: 'Code Examples Repository',
            description: 'GitHub repository with all code examples from this lesson',
          },
        ],
        isPublished: true,
        isFree: false,
        interactiveElements: {
          hasQuiz: true,
          hasCodeEditor: true,
          hasDiscussions: true,
          hasDownloads: true,
        },
        completionCriteria: {
          requiresQuizPass: true,
          minimumScore: 70,
          requiresTimeSpent: 30,
        },
        viewCount: 1235, // Increment view count
        averageRating: 4.5,
        ratingCount: 89,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z',
        author: {
          id: 'user_123',
          username: 'react_instructor',
          fullName: 'React Instructor',
          avatar: 'https://example.com/instructor-avatar.jpg',
        },
      };

      // Add user progress if authenticated
      if (userId !== 'guest') {
        mockLesson.userProgress = {
          isCompleted: false,
          progress: 65,
          timeSpent: 28,
          lastAccessedAt: new Date().toISOString(),
        };
      }

      return mockLesson;
    } catch (error) {
      throw new NotFoundException('Lesson not found');
    }
  }

  async updateLesson(userId: string, id: string, updateData: Partial<CreateLessonDto>): Promise<LessonResponseDto> {
    try {
      const lesson = await this.getLessonById(userId, id);

      // Check if user is the author or has permission to update
      if (lesson.author.id !== userId) {
        throw new ForbiddenException('Only the lesson author can update this lesson');
      }

      const updatedLesson = {
        ...lesson,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      return updatedLesson;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update lesson: ' + error.message);
    }
  }

  async deleteLesson(userId: string, id: string): Promise<void> {
    try {
      const lesson = await this.getLessonById(userId, id);

      if (lesson.author.id !== userId) {
        throw new ForbiddenException('Only the lesson author can delete this lesson');
      }

      // Mock deletion - in real app, would delete from database
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete lesson: ' + error.message);
    }
  }

  // =============================================
  // RESOURCE METHODS
  // =============================================

  async createResource(userId: string, createResourceDto: CreateResourceDto): Promise<ResourceResponseDto> {
    try {
      const resourceId = `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const resourceData: ResourceResponseDto = {
        id: resourceId,
        title: createResourceDto.title,
        description: createResourceDto.description,
        type: createResourceDto.type,
        url: createResourceDto.url,
        courseId: createResourceDto.courseId,
        lessonId: createResourceDto.lessonId,
        chapterId: createResourceDto.chapterId,
        visibility: createResourceDto.visibility,
        size: createResourceDto.size,
        duration: createResourceDto.duration,
        mimeType: createResourceDto.mimeType,
        extension: createResourceDto.extension,
        thumbnailUrl: createResourceDto.thumbnailUrl,
        isDownloadable: createResourceDto.isDownloadable || false,
        requiresAuth: createResourceDto.requiresAuth || false,
        metadata: createResourceDto.metadata || {},
        altText: createResourceDto.altText,
        transcription: createResourceDto.transcription,
        downloadCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        uploader: {
          id: userId,
          username: `user_${userId.split('_')[1] || userId}`,
          fullName: 'Content Creator',
          avatar: 'https://example.com/avatar.jpg',
        },
      };

      // Store resource data using database
      // await this.db.storeData(`resource_${resourceId}`, resourceData);

      return resourceData;
    } catch (error) {
      throw new BadRequestException('Failed to create resource: ' + error.message);
    }
  }

  async getResources(userId: string, query: ContentQueryDto): Promise<PaginatedResourcesDto> {
    try {
      // Mock implementation
      const mockResources: ResourceResponseDto[] = [
        {
          id: 'resource_1',
          title: 'React Hooks Cheat Sheet',
          description: 'Comprehensive cheat sheet covering all React Hooks with examples',
          type: 'document' as any,
          url: 'https://example.com/resources/react-hooks-cheatsheet.pdf',
          courseId: 'course_react_advanced',
          lessonId: 'lesson_hooks_intro',
          chapterId: 'chapter_hooks',
          visibility: 'course_members' as any,
          size: 2048576,
          mimeType: 'application/pdf',
          extension: 'pdf',
          thumbnailUrl: 'https://example.com/thumbnails/cheatsheet-thumb.jpg',
          isDownloadable: true,
          requiresAuth: false,
          metadata: {
            author: 'React Team',
            version: '1.2',
            language: 'en',
            format: 'PDF',
          },
          altText: 'React Hooks reference guide with code examples',
          downloadCount: 456,
          createdAt: '2024-01-15T12:00:00Z',
          updatedAt: '2024-01-15T12:00:00Z',
          uploader: {
            id: 'user_123',
            username: 'react_instructor',
            fullName: 'React Instructor',
            avatar: 'https://example.com/instructor-avatar.jpg',
          },
        },
      ];

      // Apply basic filtering
      let filteredResources = mockResources;

      if (query.courseId) {
        filteredResources = filteredResources.filter(resource => resource.courseId === query.courseId);
      }

      // Apply pagination
      const page = query.page || 1;
      const limit = query.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      const paginatedResources = filteredResources.slice(startIndex, endIndex);
      const total = filteredResources.length;
      const totalPages = Math.ceil(total / limit);

      return {
        data: paginatedResources,
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      };
    } catch (error) {
      throw new BadRequestException('Failed to fetch resources: ' + error.message);
    }
  }

  async getResourceById(userId: string, id: string): Promise<ResourceResponseDto> {
    try {
      // Mock implementation
      const mockResource: ResourceResponseDto = {
        id,
        title: 'React Hooks Cheat Sheet',
        description: 'Comprehensive cheat sheet covering all React Hooks with examples and best practices',
        type: 'document' as any,
        url: 'https://example.com/resources/react-hooks-cheatsheet.pdf',
        courseId: 'course_react_advanced',
        lessonId: 'lesson_hooks_intro',
        chapterId: 'chapter_hooks',
        visibility: 'course_members' as any,
        size: 2048576,
        duration: undefined,
        mimeType: 'application/pdf',
        extension: 'pdf',
        thumbnailUrl: 'https://example.com/thumbnails/cheatsheet-thumb.jpg',
        isDownloadable: true,
        requiresAuth: false,
        metadata: {
          author: 'React Team',
          version: '1.2',
          language: 'en',
          format: 'PDF',
          pages: 8,
          keywords: ['react', 'hooks', 'javascript', 'frontend'],
        },
        altText: 'React Hooks reference guide with code examples and explanations',
        transcription: undefined,
        downloadCount: 457, // Increment download count
        createdAt: '2024-01-15T12:00:00Z',
        updatedAt: '2024-01-15T12:00:00Z',
        uploader: {
          id: 'user_123',
          username: 'react_instructor',
          fullName: 'React Instructor',
          avatar: 'https://example.com/instructor-avatar.jpg',
        },
      };

      return mockResource;
    } catch (error) {
      throw new NotFoundException('Resource not found');
    }
  }

  async updateResource(userId: string, id: string, updateData: Partial<CreateResourceDto>): Promise<ResourceResponseDto> {
    try {
      const resource = await this.getResourceById(userId, id);

      if (resource.uploader.id !== userId) {
        throw new ForbiddenException('Only the resource uploader can update this resource');
      }

      const updatedResource = {
        ...resource,
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      return updatedResource;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to update resource: ' + error.message);
    }
  }

  async deleteResource(userId: string, id: string): Promise<void> {
    try {
      const resource = await this.getResourceById(userId, id);

      if (resource.uploader.id !== userId) {
        throw new ForbiddenException('Only the resource uploader can delete this resource');
      }

      // Mock deletion - in real app, would delete from database and storage
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete resource: ' + error.message);
    }
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  async getUserContent(userId: string, type: 'lessons' | 'resources'): Promise<LessonResponseDto[] | ResourceResponseDto[]> {
    try {
      if (type === 'lessons') {
        const result = await this.getLessons(userId, { publishedOnly: false });
        return result.data.filter(lesson => lesson.author.id === userId);
      } else {
        const result = await this.getResources(userId, {});
        return result.data.filter(resource => resource.uploader.id === userId);
      }
    } catch (error) {
      throw new BadRequestException(`Failed to get user ${type}: ` + error.message);
    }
  }

  async getCourseContent(courseId: string, userId?: string): Promise<{
    lessons: LessonResponseDto[];
    resources: ResourceResponseDto[];
  }> {
    try {
      const [lessonsResult, resourcesResult] = await Promise.all([
        this.getLessons(userId || 'guest', { courseId, publishedOnly: true }),
        this.getResources(userId || 'guest', { courseId }),
      ]);

      return {
        lessons: lessonsResult.data,
        resources: resourcesResult.data,
      };
    } catch (error) {
      throw new BadRequestException('Failed to get course content: ' + error.message);
    }
  }
}