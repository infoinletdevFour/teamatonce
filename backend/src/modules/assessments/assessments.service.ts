import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import {
  CreateAssessmentDto,
  StartAssessmentDto,
  SubmitAssessmentDto,
  AssessmentResponseDto,
  AssessmentAttemptResponseDto,
  QuestionResponseDto,
  QuestionFeedbackDto,
  AttemptStatus
} from './dto';

@Injectable()
export class AssessmentsService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // =============================================
  // ASSESSMENT CRUD OPERATIONS
  // =============================================

  async createAssessment(userId: string, createAssessmentDto: CreateAssessmentDto): Promise<AssessmentResponseDto> {
    try {
      // Validate course/lesson ownership if specified
      if (createAssessmentDto.courseId) {
        await this.validateCourseAccess(userId, createAssessmentDto.courseId);
      }

      // Prepare assessment data for database
      const assessmentData = {
        title: createAssessmentDto.title,
        description: createAssessmentDto.description,
        type: createAssessmentDto.type,
        course_id: createAssessmentDto.courseId,
        lesson_id: createAssessmentDto.lessonId,
        creator_id: userId,
        questions: JSON.stringify(this.processQuestionsForStorage(createAssessmentDto.questions)),
        time_limit_minutes: createAssessmentDto.timeLimitMinutes,
        passing_score: createAssessmentDto.passingScore || 70,
        max_attempts: createAssessmentDto.maxAttempts || 3,
        randomize_questions: createAssessmentDto.randomizeQuestions || false,
        show_correct_answers: createAssessmentDto.showCorrectAnswers !== false,
        allow_review: createAssessmentDto.allowReview !== false,
        difficulty: createAssessmentDto.difficulty,
        points: createAssessmentDto.points || this.calculateTotalPoints(createAssessmentDto.questions),
        skills_assessed: JSON.stringify(createAssessmentDto.skillsAssessed || []),
        is_required: createAssessmentDto.isRequired || false,
        status: 'draft'
      };

      const result = await this.db.insert('assessments', assessmentData);
      return this.formatAssessmentResponse(result);
    } catch (error) {
      throw new BadRequestException(`Failed to create assessment: ${error.message}`);
    }
  }

  async getAssessmentById(id: string): Promise<AssessmentResponseDto> {
    try {
      const result = await this.db.findOne('assessments', { id });
      if (!result) {
        throw new NotFoundException('Assessment not found');
      }
      return this.formatAssessmentResponse(result);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new BadRequestException(`Failed to fetch assessment: ${error.message}`);
    }
  }

  async updateAssessment(userId: string, id: string, updateData: Partial<CreateAssessmentDto>): Promise<AssessmentResponseDto> {
    try {
      // Verify ownership
      const assessment = await this.db.findOne('assessments', { id });
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }
      if (assessment.creator_id !== userId) {
        throw new ForbiddenException('You can only update your own assessments');
      }

      const updatePayload: any = {};
      if (updateData.title) updatePayload.title = updateData.title;
      if (updateData.description !== undefined) updatePayload.description = updateData.description;
      if (updateData.questions) {
        updatePayload.questions = JSON.stringify(this.processQuestionsForStorage(updateData.questions));
        updatePayload.points = this.calculateTotalPoints(updateData.questions);
      }
      if (updateData.timeLimitMinutes !== undefined) updatePayload.time_limit_minutes = updateData.timeLimitMinutes;
      if (updateData.passingScore !== undefined) updatePayload.passing_score = updateData.passingScore;
      if (updateData.maxAttempts !== undefined) updatePayload.max_attempts = updateData.maxAttempts;
      if (updateData.randomizeQuestions !== undefined) updatePayload.randomize_questions = updateData.randomizeQuestions;
      if (updateData.showCorrectAnswers !== undefined) updatePayload.show_correct_answers = updateData.showCorrectAnswers;
      if (updateData.allowReview !== undefined) updatePayload.allow_review = updateData.allowReview;
      if (updateData.difficulty) updatePayload.difficulty = updateData.difficulty;
      if (updateData.skillsAssessed) updatePayload.skills_assessed = JSON.stringify(updateData.skillsAssessed);
      if (updateData.isRequired !== undefined) updatePayload.is_required = updateData.isRequired;

      const result = await this.db.update('assessments', id, updatePayload);
      return this.formatAssessmentResponse(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(`Failed to update assessment: ${error.message}`);
    }
  }

  async deleteAssessment(userId: string, id: string): Promise<void> {
    try {
      // Verify ownership
      const assessment = await this.db.findOne('assessments', { id });
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }
      if (assessment.creator_id !== userId) {
        throw new ForbiddenException('You can only delete your own assessments');
      }

      await this.db.delete('assessments', id);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(`Failed to delete assessment: ${error.message}`);
    }
  }

  async publishAssessment(userId: string, id: string): Promise<AssessmentResponseDto> {
    try {
      const assessment = await this.db.findOne('assessments', { id });
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }
      if (assessment.creator_id !== userId) {
        throw new ForbiddenException('You can only publish your own assessments');
      }

      const result = await this.db.update('assessments', id, {
        status: 'published',
        published_at: new Date().toISOString()
      });

      return this.formatAssessmentResponse(result);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(`Failed to publish assessment: ${error.message}`);
    }
  }

  // =============================================
  // ASSESSMENT ATTEMPTS
  // =============================================

  async startAssessmentAttempt(userId: string, assessmentId: string, startAssessmentDto: StartAssessmentDto): Promise<AssessmentAttemptResponseDto> {
    try {
      const assessment = await this.db.findOne('assessments', { id: assessmentId });
      if (!assessment || assessment.status !== 'published') {
        throw new NotFoundException('Assessment not found or not published');
      }

      // Check if user has exceeded max attempts
      const existingAttempts = await this.db.findMany('assessment_attempts', {
        user_id: userId,
        assessment_id: assessmentId
      });

      if (existingAttempts.length >= assessment.max_attempts) {
        throw new BadRequestException('Maximum attempts exceeded');
      }

      // Create new attempt
      const attemptData = {
        assessment_id: assessmentId,
        user_id: userId,
        attempt_number: existingAttempts.length + 1,
        started_at: new Date().toISOString(),
        answers: JSON.stringify({}),
        max_score: assessment.points,
        status: 'in_progress',
        metadata: JSON.stringify(startAssessmentDto.metadata || {})
      };

      const result = await this.db.insert('assessment_attempts', attemptData);
      return this.formatAttemptResponse(result, assessment);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to start assessment attempt: ${error.message}`);
    }
  }

  async submitAssessment(userId: string, attemptId: string, submitAssessmentDto: SubmitAssessmentDto): Promise<AssessmentAttemptResponseDto> {
    try {
      const attempt = await this.db.findOne('assessment_attempts', { id: attemptId });
      if (!attempt) {
        throw new NotFoundException('Assessment attempt not found');
      }
      if (attempt.user_id !== userId) {
        throw new ForbiddenException('You can only submit your own attempts');
      }
      if (attempt.status !== 'in_progress') {
        throw new BadRequestException('This attempt has already been submitted or expired');
      }

      const assessment = await this.db.findOne('assessments', { id: attempt.assessment_id });
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      // Check time limit
      if (assessment.time_limit_minutes) {
        const startedAt = new Date(attempt.started_at);
        const timeElapsed = (Date.now() - startedAt.getTime()) / (1000 * 60); // minutes
        if (timeElapsed > assessment.time_limit_minutes) {
          throw new BadRequestException('Time limit exceeded');
        }
      }

      // Grade the assessment
      const gradingResult = await this.gradeAssessment(assessment, submitAssessmentDto.answers);

      // Update attempt record
      const updateData = {
        submitted_at: new Date().toISOString(),
        time_spent_minutes: submitAssessmentDto.timeSpentMinutes,
        answers: JSON.stringify(submitAssessmentDto.answers),
        score: gradingResult.score,
        percentage: gradingResult.percentage,
        passed: gradingResult.percentage >= assessment.passing_score,
        feedback: JSON.stringify(gradingResult.feedback),
        status: 'submitted'
      };

      const result = await this.db.update('assessment_attempts', attemptId, updateData);
      
      // Update user progress and XP if passed
      if (gradingResult.percentage >= assessment.passing_score) {
        await this.updateUserProgressForAssessment(userId, assessment, gradingResult);
      }

      return this.formatAttemptResponse(result, assessment);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException || error instanceof BadRequestException) throw error;
      throw new BadRequestException(`Failed to submit assessment: ${error.message}`);
    }
  }

  async getAssessmentResults(userId: string, attemptId: string): Promise<AssessmentAttemptResponseDto> {
    try {
      const attempt = await this.db.findOne('assessment_attempts', { id: attemptId });
      if (!attempt) {
        throw new NotFoundException('Assessment attempt not found');
      }
      if (attempt.user_id !== userId) {
        throw new ForbiddenException('You can only view your own results');
      }

      const assessment = await this.db.findOne('assessments', { id: attempt.assessment_id });
      if (!assessment) {
        throw new NotFoundException('Assessment not found');
      }

      return this.formatAttemptResponse(attempt, assessment);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ForbiddenException) throw error;
      throw new BadRequestException(`Failed to get assessment results: ${error.message}`);
    }
  }

  async getUserAssessmentAttempts(userId: string, assessmentId?: string): Promise<AssessmentAttemptResponseDto[]> {
    try {
      const conditions: any = { user_id: userId };
      if (assessmentId) conditions.assessment_id = assessmentId;

      const attempts = await this.db.findMany('assessment_attempts', conditions);
      
      // Get assessments for formatting
      const assessmentIds = [...new Set(attempts.map(attempt => attempt.assessment_id))];
      const assessments = await Promise.all(
        assessmentIds.map(id => this.db.findOne('assessments', { id }))
      );
      const assessmentMap = Object.fromEntries(assessments.filter(a => a).map(a => [a.id, a]));

      return attempts.map(attempt => this.formatAttemptResponse(attempt, assessmentMap[attempt.assessment_id]));
    } catch (error) {
      throw new BadRequestException(`Failed to get user attempts: ${error.message}`);
    }
  }

  // =============================================
  // HELPER METHODS
  // =============================================

  private async validateCourseAccess(userId: string, courseId: string): Promise<void> {
    const course = await this.db.findOne('courses', { id: courseId });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    if (course.instructor_id !== userId) {
      throw new ForbiddenException('You can only create assessments for your own courses');
    }
  }

  private processQuestionsForStorage(questions: any[]): any[] {
    return questions.map((question, index) => ({
      id: `q_${index + 1}`,
      ...question,
      points: question.points || 1
    }));
  }

  private calculateTotalPoints(questions: any[]): number {
    return questions.reduce((total, question) => total + (question.points || 1), 0);
  }

  private async gradeAssessment(assessment: any, answers: any[]): Promise<{
    score: number;
    percentage: number;
    feedback: QuestionFeedbackDto[];
  }> {
    const questions = JSON.parse(assessment.questions);
    const answerMap = Object.fromEntries(answers.map(a => [a.questionId, a.answer]));
    
    let totalScore = 0;
    const feedback: QuestionFeedbackDto[] = [];

    for (const question of questions) {
      const userAnswer = answerMap[question.id];
      const isCorrect = this.checkAnswer(question, userAnswer);
      const pointsEarned = isCorrect ? (question.points || 1) : 0;
      
      totalScore += pointsEarned;
      
      feedback.push({
        questionId: question.id,
        userAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        pointsEarned,
        maxPoints: question.points || 1,
        explanation: question.explanation
      });
    }

    const percentage = (totalScore / assessment.points) * 100;

    return {
      score: totalScore,
      percentage,
      feedback
    };
  }

  private checkAnswer(question: any, userAnswer: any): boolean {
    if (!userAnswer && userAnswer !== 0 && userAnswer !== false) return false;

    switch (question.type) {
      case 'multiple_choice':
        return Array.isArray(question.correctAnswer) 
          ? question.correctAnswer.includes(userAnswer)
          : question.correctAnswer === userAnswer;
      
      case 'true_false':
        return question.correctAnswer === userAnswer;
      
      case 'short_answer':
        return question.correctAnswer?.toLowerCase() === userAnswer?.toLowerCase();
      
      case 'fill_blank':
        return Array.isArray(question.correctAnswer)
          ? question.correctAnswer.some((answer: string) => 
              answer.toLowerCase() === userAnswer?.toLowerCase())
          : question.correctAnswer?.toLowerCase() === userAnswer?.toLowerCase();
      
      default:
        // For essay, coding, etc. - manual grading required
        return false;
    }
  }

  private async updateUserProgressForAssessment(userId: string, assessment: any, gradingResult: any): Promise<void> {
    try {
      // Update user XP
      const xpGained = Math.floor(assessment.points * 0.1); // 10% of points as XP
      
      const profile = await this.db.findOne('user_profiles', { user_id: userId });

      if (profile) {
        const currentXp = profile.xp_points || 0;
        await this.db.update('user_profiles', profile.id, {
          xp_points: currentXp + xpGained
        });
      } else {
        // Create profile if doesn't exist
        await this.db.insert('user_profiles', {
          user_id: userId,
          xp_points: xpGained
        });
      }

      // Create progress record
      const progressData = {
        user_id: userId,
        entity_type: 'assessment',
        entity_id: assessment.id,
        progress_percentage: 100,
        completed_at: new Date().toISOString(),
        last_accessed_at: new Date().toISOString(),
        status: 'completed',
        metadata: JSON.stringify({
          score: gradingResult.score,
          percentage: gradingResult.percentage,
          xp_gained: xpGained
        })
      };

      await this.db.insert('user_progress', progressData);
    } catch (error) {
      console.error('Failed to update user progress:', error);
      // Don't throw error here as assessment submission was successful
    }
  }

  private formatAssessmentResponse(data: any): AssessmentResponseDto {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      type: data.type,
      courseId: data.course_id,
      lessonId: data.lesson_id,
      creatorId: data.creator_id,
      questions: this.formatQuestionsForResponse(JSON.parse(data.questions || '[]')),
      timeLimitMinutes: data.time_limit_minutes,
      passingScore: data.passing_score,
      maxAttempts: data.max_attempts,
      randomizeQuestions: data.randomize_questions,
      showCorrectAnswers: data.show_correct_answers,
      allowReview: data.allow_review,
      difficulty: data.difficulty,
      points: data.points,
      skillsAssessed: JSON.parse(data.skills_assessed || '[]'),
      isRequired: data.is_required,
      status: data.status,
      publishedAt: data.published_at ? new Date(data.published_at) : undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at)
    };
  }

  private formatQuestionsForResponse(questions: any[]): QuestionResponseDto[] {
    return questions.map(q => ({
      id: q.id,
      question: q.question,
      type: q.type,
      options: q.options?.map((option: any, index: number) => ({
        id: `opt_${index + 1}`,
        text: option.text
      })) || [],
      points: q.points,
      metadata: q.metadata
    }));
  }

  private formatAttemptResponse(attempt: any, assessment: any): AssessmentAttemptResponseDto {
    return {
      id: attempt.id,
      assessmentId: attempt.assessment_id,
      userId: attempt.user_id,
      attemptNumber: attempt.attempt_number,
      startedAt: new Date(attempt.started_at),
      submittedAt: attempt.submitted_at ? new Date(attempt.submitted_at) : undefined,
      timeSpentMinutes: attempt.time_spent_minutes,
      answers: JSON.parse(attempt.answers || '{}'),
      score: attempt.score,
      maxScore: attempt.max_score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      feedback: assessment?.show_correct_answers && attempt.feedback 
        ? JSON.parse(attempt.feedback) 
        : undefined,
      status: attempt.status as AttemptStatus,
      metadata: JSON.parse(attempt.metadata || '{}')
    };
  }
}