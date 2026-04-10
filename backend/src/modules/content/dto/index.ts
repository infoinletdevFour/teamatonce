export * from './create-lesson.dto';
export * from './create-resource.dto';
export * from './content-response.dto';
export * from './content-query.dto';

// Re-export with expected names for compatibility
export { CreateContentLessonDto as CreateLessonDto } from './create-lesson.dto';
export { ContentLessonResponseDto as LessonResponseDto } from './content-response.dto';
export { PaginatedContentLessonsDto as PaginatedLessonsDto } from './content-response.dto';
export { ContentQueryDto } from './content-response.dto';