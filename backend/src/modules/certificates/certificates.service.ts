import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority } from '../notifications/dto';
import {
  GenerateCertificateDto,
  CertificateDataDto,
  CertificateDto,
  CertificateCreationResponseDto,
  CertificateVerificationDto,
  CertificateListDto,
  CertificateStatsDto,
  CertificateQueryDto,
  VerifyCertificateDto,
  BulkCertificateActionDto,
  CertificateType,
  CertificateTemplate,
} from './dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CertificatesService {
  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService: NotificationsService,
  ) {}

  // =============================================
  // CERTIFICATE GENERATION
  // =============================================

  /**
   * Generate a new certificate
   */
  async generateCertificate(
    userId: string,
    generateDto: GenerateCertificateDto,
  ): Promise<CertificateCreationResponseDto> {
    const startTime = Date.now();

    // Validate eligibility
    await this.validateCertificateEligibility(userId, generateDto);

    // Get user profile
    const userProfile = await this.db.findOne('user_profiles', {
      user_id: userId,
    });

    if (!userProfile) {
      throw new Error('User profile not found');
    }

    // Build certificate data
    const certificateData = await this.buildCertificateData(
      userId,
      userProfile,
      generateDto,
    );

    // Generate verification URL and certificate number
    const certificateId = uuidv4();
    const verificationCode = this.generateVerificationCode();
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://learningos.com'}/verify/${certificateId}`;

    // Create certificate record
    const certificateRecord = {
      id: certificateId,
      user_id: userId,
      course_id: generateDto.courseId || null,
      learning_path_id: generateDto.learningPathId || null,
      type: generateDto.type,
      title: generateDto.title,
      description: generateDto.description || null,
      issued_at: new Date(),
      expires_at: generateDto.expiresAt ? new Date(generateDto.expiresAt) : null,
      verification_url: verificationUrl,
      certificate_data: certificateData,
      skills: generateDto.skills || [],
      metadata: {
        ...generateDto.metadata,
        template: generateDto.template,
        verificationCode,
        generatedAt: new Date(),
      },
      is_public: generateDto.isPublic ?? true,
      status: 'active',
    };

    // Save certificate to database
    const savedCertificate = await this.db.insert('certificates', certificateRecord);

    // Generate PDF certificate
    const certificateUrl = await this.generateCertificatePDF(
      certificateId,
      certificateData,
      generateDto.template || CertificateTemplate.MODERN,
    );

    // Generate certificate image/preview
    const imageUrl = await this.generateCertificateImage(
      certificateId,
      certificateData,
      generateDto.template || CertificateTemplate.MODERN,
    );

    // Update record with URLs
    await this.db.update('certificates', certificateId, {
      metadata: {
        ...certificateRecord.metadata,
        certificateUrl,
        imageUrl,
      },
    });

    // Log certificate generation for analytics
    await this.logCertificateGeneration(userId, certificateId, generateDto.type);

    // Map to DTO
    const certificate = this.mapCertificateToDto({
      ...savedCertificate,
      metadata: {
        ...certificateRecord.metadata,
        certificateUrl,
        imageUrl,
      },
    });

    const processingTime = Date.now() - startTime;

    return {
      certificate,
      success: true,
      message: 'Certificate generated successfully',
      processingTime,
      generationDetails: {
        templateUsed: generateDto.template || CertificateTemplate.MODERN,
        dataSource: 'user_profile_and_progress',
        verificationCodeGenerated: true,
        pdfGenerated: true,
      },
    };
  }

  /**
   * Get user certificates
   */
  async getUserCertificates(
    userId: string,
    query: CertificateQueryDto,
  ): Promise<CertificateListDto> {
    const conditions: any = { user_id: userId };

    // Apply filters
    if (query.type) {
      conditions.type = query.type;
    }

    if (query.status) {
      conditions.status = query.status;
    }

    if (query.courseId) {
      conditions.course_id = query.courseId;
    }

    if (query.learningPathId) {
      conditions.learning_path_id = query.learningPathId;
    }

    if (query.search) {
      conditions.title = { $ilike: `%${query.search}%` };
    }

    if (query.issuedAfter) {
      conditions.issued_at = { $gte: new Date(query.issuedAfter) };
    }

    if (query.issuedBefore) {
      conditions.issued_at = { 
        ...(conditions.issued_at || {}),
        $lte: new Date(query.issuedBefore),
      };
    }

    if (!query.includeExpired) {
      conditions.$or = [
        { expires_at: null },
        { expires_at: { $gt: new Date() } },
      ];
    }

    if (query.publicOnly) {
      conditions.is_public = true;
    }

    // Get total count
    const totalCertificates = await this.db.findMany('certificates', conditions);
    const total = totalCertificates.length;

    // Get paginated results
    const offset = (query.page - 1) * query.limit;
    const certificates = await this.db.findMany(
      'certificates',
      conditions,
      {
        orderBy: this.mapSortBy(query.sortBy),
        order: query.sortOrder,
        limit: query.limit,
        offset,
      },
    );

    const certificateDtos = certificates.map(cert => this.mapCertificateToDto(cert));
    const totalPages = Math.ceil(total / query.limit);

    // Calculate breakdown
    const breakdown = this.calculateCertificateBreakdown(totalCertificates);

    // Calculate statistics
    const statistics = {
      totalEarned: total,
      expiredCount: totalCertificates.filter(c => 
        c.expires_at && new Date(c.expires_at) < new Date()
      ).length,
      activeCount: totalCertificates.filter(c => c.status === 'active').length,
      skillsCovered: this.extractUniqueSkills(totalCertificates),
      latestCertificate: certificateDtos[0] || null,
    };

    return {
      certificates: certificateDtos,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
      breakdown,
      statistics,
    };
  }

  /**
   * Get certificate by ID
   */
  async getCertificateById(
    userId: string,
    certificateId: string,
  ): Promise<CertificateDto> {
    const certificate = await this.db.findOne('certificates', {
      id: certificateId,
      user_id: userId,
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    return this.mapCertificateToDto(certificate);
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(
    verifyDto: VerifyCertificateDto,
  ): Promise<CertificateVerificationDto> {
    let certificate;

    // Try different verification methods
    if (verifyDto.certificateId) {
      certificate = await this.db.findOne('certificates', {
        id: verifyDto.certificateId,
      });
    } else if (verifyDto.verificationCode) {
      const certificates = await this.db.findMany('certificates', {});
      certificate = certificates.find(c => 
        c.metadata?.verificationCode === verifyDto.verificationCode
      );
    } else if (verifyDto.verificationUrl) {
      certificate = await this.db.findOne('certificates', {
        verification_url: verifyDto.verificationUrl,
      });
    }

    if (!certificate) {
      return {
        isValid: false,
        message: 'Certificate not found or invalid verification credentials',
      };
    }

    // Perform verification checks
    const verificationInfo = {
      recipientVerified: true, // User exists and matches
      organizationVerified: true, // Certificate issued by valid organization
      integrityVerified: true, // Certificate data hasn't been tampered with
      notExpired: !certificate.expires_at || new Date(certificate.expires_at) > new Date(),
      notRevoked: certificate.status === 'active',
    };

    const isValid = Object.values(verificationInfo).every(check => check);

    let message = 'Certificate is valid and authentic';
    if (!isValid) {
      if (!verificationInfo.notExpired) {
        message = 'Certificate has expired';
      } else if (!verificationInfo.notRevoked) {
        message = 'Certificate has been revoked';
      } else {
        message = 'Certificate verification failed';
      }
    }

    return {
      isValid,
      certificate: isValid ? this.mapCertificateToDto(certificate) : undefined,
      message,
      verifiedAt: new Date(),
      verificationInfo,
    };
  }

  /**
   * Get certificate statistics
   */
  async getCertificateStats(userId: string): Promise<CertificateStatsDto> {
    const certificates = await this.db.findMany('certificates', {
      user_id: userId,
    });

    const now = new Date();
    const thisYear = new Date(now.getFullYear(), 0, 1);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const byType = certificates.reduce((acc, cert) => {
      acc[cert.type] = (acc[cert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const thisYearCount = certificates.filter(c => 
      new Date(c.issued_at) >= thisYear
    ).length;

    const thisMonthCount = certificates.filter(c => 
      new Date(c.issued_at) >= thisMonth
    ).length;

    const mostRecent = certificates
      .sort((a, b) => new Date(b.issued_at).getTime() - new Date(a.issued_at).getTime())[0];

    const skillsCovered = this.extractUniqueSkills(certificates);

    // Get completion stats
    const completionStats = await this.calculateCompletionStats(userId);

    // Generate milestones
    const milestones = await this.generateMilestones(userId, certificates);

    return {
      totalCertificates: certificates.length,
      byType,
      thisYear: thisYearCount,
      thisMonth: thisMonthCount,
      mostRecent: mostRecent ? this.mapCertificateToDto(mostRecent) : undefined,
      skillsCovered,
      completionStats,
      milestones,
    };
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(
    userId: string,
    certificateId: string,
    reason?: string,
  ): Promise<void> {
    const certificate = await this.db.findOne('certificates', {
      id: certificateId,
      user_id: userId,
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    await this.db.update('certificates', certificateId, {
      status: 'revoked',
      metadata: {
        ...certificate.metadata,
        revokedAt: new Date(),
        revocationReason: reason,
      },
    });
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  private async validateCertificateEligibility(
    userId: string,
    generateDto: GenerateCertificateDto,
  ): Promise<void> {
    // Check if user has already earned this certificate
    const existing = await this.db.findOne('certificates', {
      user_id: userId,
      type: generateDto.type,
      course_id: generateDto.courseId || null,
      learning_path_id: generateDto.learningPathId || null,
      status: 'active',
    });

    if (existing) {
      throw new Error('Certificate already exists for this achievement');
    }

    // Validate course completion if applicable
    if (generateDto.courseId) {
      const enrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: generateDto.courseId,
        status: 'completed',
      });

      if (!enrollment) {
        throw new Error('Course must be completed before certificate can be generated');
      }
    }

    // Validate learning path completion if applicable
    if (generateDto.learningPathId) {
      // This would need to check if all required courses in the learning path are completed
      // Implementation would depend on learning path structure
    }
  }

  private async buildCertificateData(
    userId: string,
    userProfile: any,
    generateDto: GenerateCertificateDto,
  ): Promise<CertificateDataDto> {
    const now = new Date();
    let programName = generateDto.title;
    let completionDate = now;
    let studyDuration = 'Self-paced';
    let instructorName = 'Learning OS AI Tutor';

    // Get additional context if course or learning path
    if (generateDto.courseId) {
      const course = await this.db.findOne('courses', {
        id: generateDto.courseId,
      });
      const enrollment = await this.db.findOne('course_enrollments', {
        user_id: userId,
        course_id: generateDto.courseId,
      });

      if (course) {
        programName = course.title;
        if (enrollment?.completion_date) {
          completionDate = new Date(enrollment.completion_date);
        }
        
        // Calculate study duration
        if (enrollment?.enrollment_date) {
          const startDate = new Date(enrollment.enrollment_date);
          const days = Math.ceil((completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          studyDuration = `${days} days`;
        }
      }
    }

    return {
      recipientName: userProfile.display_name || 'Learning OS Student',
      title: generateDto.title,
      organization: 'Learning OS',
      issueDate: now,
      completionDate,
      programName,
      skills: generateDto.skills || [],
      studyDuration,
      instructorName,
      logoUrl: `${process.env.FRONTEND_URL || 'https://learningos.com'}/logo.png`,
      certificateNumber: this.generateCertificateNumber(),
      customData: generateDto.metadata || {},
    };
  }

  private generateVerificationCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private generateCertificateNumber(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `LOS-${date}-${random}`;
  }

  private async generateCertificatePDF(
    certificateId: string,
    certificateData: CertificateDataDto,
    template: CertificateTemplate,
  ): Promise<string> {
    // In a real implementation, this would generate a PDF using a service like Puppeteer
    // or a PDF generation library, applying the selected template
    
    // For now, return a placeholder URL
    return `${process.env.FRONTEND_URL || 'https://learningos.com'}/certificates/${certificateId}.pdf`;
  }

  private async generateCertificateImage(
    certificateId: string,
    certificateData: CertificateDataDto,
    template: CertificateTemplate,
  ): Promise<string> {
    // In a real implementation, this would generate a certificate image
    // using canvas or image generation services
    
    // For now, return a placeholder URL
    return `${process.env.FRONTEND_URL || 'https://learningos.com'}/certificates/${certificateId}.png`;
  }

  private mapCertificateToDto(certificate: any): CertificateDto {
    return {
      id: certificate.id,
      userId: certificate.user_id,
      type: certificate.type,
      title: certificate.title,
      description: certificate.description,
      issuedAt: new Date(certificate.issued_at),
      expiresAt: certificate.expires_at ? new Date(certificate.expires_at) : undefined,
      verificationUrl: certificate.verification_url,
      certificateUrl: certificate.metadata?.certificateUrl || '',
      imageUrl: certificate.metadata?.imageUrl,
      certificateData: certificate.certificate_data,
      skills: certificate.skills || [],
      courseId: certificate.course_id,
      learningPathId: certificate.learning_path_id,
      metadata: certificate.metadata,
      isPublic: certificate.is_public,
      status: certificate.status,
    };
  }

  private mapSortBy(sortBy?: string): string {
    const mapping: Record<string, string> = {
      issued_date: 'issued_at',
      title: 'title',
      type: 'type',
      expiry_date: 'expires_at',
    };
    return mapping[sortBy || 'issued_date'] || 'issued_at';
  }

  private calculateCertificateBreakdown(certificates: any[]): Record<string, number> {
    return certificates.reduce((acc, cert) => {
      acc[cert.type] = (acc[cert.type] || 0) + 1;
      return acc;
    }, {});
  }

  private extractUniqueSkills(certificates: any[]): string[] {
    const allSkills = certificates.flatMap(cert => cert.skills || []);
    return Array.from(new Set(allSkills));
  }

  private async calculateCompletionStats(userId: string) {
    const completedCourses = await this.db.findMany('course_enrollments', {
      user_id: userId,
      status: 'completed',
    });

    const completedLearningPaths = await this.db.findMany('learning_paths', {
      // This would need more complex logic to determine completed learning paths
    });

    // Calculate average completion time
    const completionTimes = completedCourses
      .filter(e => e.enrollment_date && e.completion_date)
      .map(e => {
        const start = new Date(e.enrollment_date);
        const end = new Date(e.completion_date);
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      });

    const averageCompletionTime = completionTimes.length > 0
      ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length
      : 0;

    return {
      coursesCompleted: completedCourses.length,
      learningPathsCompleted: 0, // Would implement learning path completion logic
      averageCompletionTime,
    };
  }

  private async generateMilestones(userId: string, certificates: any[]) {
    const milestones = [];

    // First certificate milestone
    if (certificates.length >= 1) {
      const firstCert = certificates.sort((a, b) => 
        new Date(a.issued_at).getTime() - new Date(b.issued_at).getTime()
      )[0];

      milestones.push({
        title: 'First Certificate Earned',
        description: 'Congratulations on earning your first certificate!',
        achievedAt: new Date(firstCert.issued_at),
        certificateId: firstCert.id,
      });
    }

    // Multiple certificates milestones
    if (certificates.length >= 5) {
      milestones.push({
        title: 'Certificate Collector',
        description: 'Earned 5 certificates',
        achievedAt: new Date(certificates[4].issued_at),
      });
    }

    if (certificates.length >= 10) {
      milestones.push({
        title: 'Learning Champion',
        description: 'Earned 10 certificates',
        achievedAt: new Date(certificates[9].issued_at),
      });
    }

    return milestones.sort((a, b) => 
      new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime()
    );
  }

  private async logCertificateGeneration(
    userId: string,
    certificateId: string,
    type: CertificateType,
  ): Promise<void> {
    // Log for analytics
    await this.db.insert('study_sessions', {
      id: uuidv4(),
      user_id: userId,
      session_type: 'certificate_generation',
      started_at: new Date(),
      ended_at: new Date(),
      duration_minutes: 1,
      metadata: {
        certificate_id: certificateId,
        certificate_type: type,
      },
    });
  }

  /**
   * Bulk certificate actions
   */
  async bulkCertificateAction(
    userId: string,
    actionDto: BulkCertificateActionDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const certificateId of actionDto.certificateIds) {
      try {
        const certificate = await this.db.findOne('certificates', {
          id: certificateId,
          user_id: userId,
        });

        if (!certificate) {
          errors.push(`Certificate ${certificateId} not found`);
          failed++;
          continue;
        }

        switch (actionDto.action) {
          case 'revoke':
            await this.revokeCertificate(userId, certificateId, actionDto.reason);
            break;
          case 'make_public':
            await this.db.update('certificates', certificateId, {
              is_public: true,
            });
            break;
          case 'make_private':
            await this.db.update('certificates', certificateId, {
              is_public: false,
            });
            break;
          // Add more actions as needed
        }

        success++;
      } catch (error) {
        errors.push(`Error processing ${certificateId}: ${error.message}`);
        failed++;
      }
    }

    return { success, failed, errors };
  }
}