import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CertificatesService } from './certificates.service';
import {
  GenerateCertificateDto,
  CertificateDto,
  CertificateCreationResponseDto,
  CertificateVerificationDto,
  CertificateListDto,
  CertificateStatsDto,
  CertificateQueryDto,
  VerifyCertificateDto,
  BulkCertificateActionDto,
} from './dto';

@ApiTags('Certificates')
@Controller('certificates')
export class CertificatesController {
  constructor(private readonly certificatesService: CertificatesService) {}

  // =============================================
  // CERTIFICATE GENERATION ENDPOINTS
  // =============================================

  @Post('generate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a new certificate' })
  @ApiResponse({
    status: 201,
    description: 'Certificate generated successfully',
    type: CertificateCreationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - invalid data or eligibility' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateCertificate(
    @Request() req: any,
    @Body() generateDto: GenerateCertificateDto,
  ): Promise<CertificateCreationResponseDto> {
    return this.certificatesService.generateCertificate(req.user.sub, generateDto);
  }

  // =============================================
  // CERTIFICATE RETRIEVAL ENDPOINTS
  // =============================================

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s certificates' })
  @ApiResponse({
    status: 200,
    description: 'Certificates retrieved successfully',
    type: CertificateListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserCertificates(
    @Request() req: any,
    @Query() query: CertificateQueryDto,
  ): Promise<CertificateListDto> {
    return this.certificatesService.getUserCertificates(req.user.sub, query);
  }

  @Get('my/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s certificate statistics' })
  @ApiResponse({
    status: 200,
    description: 'Certificate statistics retrieved successfully',
    type: CertificateStatsDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCertificateStats(
    @Request() req: any,
  ): Promise<CertificateStatsDto> {
    return this.certificatesService.getCertificateStats(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get certificate by ID' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate retrieved successfully',
    type: CertificateDto,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCertificateById(
    @Request() req: any,
    @Param('id') certificateId: string,
  ): Promise<CertificateDto> {
    return this.certificatesService.getCertificateById(req.user.sub, certificateId);
  }

  // =============================================
  // CERTIFICATE VERIFICATION ENDPOINTS
  // =============================================

  @Post('verify')
  @ApiOperation({ summary: 'Verify a certificate' })
  @ApiResponse({
    status: 200,
    description: 'Certificate verification completed',
    type: CertificateVerificationDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  async verifyCertificate(
    @Body() verifyDto: VerifyCertificateDto,
  ): Promise<CertificateVerificationDto> {
    return this.certificatesService.verifyCertificate(verifyDto);
  }

  @Get('verify/:code')
  @ApiOperation({ summary: 'Verify certificate by verification code' })
  @ApiParam({ name: 'code', description: 'Verification code' })
  @ApiResponse({
    status: 200,
    description: 'Certificate verification completed',
    type: CertificateVerificationDto,
  })
  async verifyCertificateByCode(
    @Param('code') verificationCode: string,
  ): Promise<CertificateVerificationDto> {
    return this.certificatesService.verifyCertificate({ verificationCode });
  }

  // =============================================
  // CERTIFICATE MANAGEMENT ENDPOINTS
  // =============================================

  @Put(':id/revoke')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a certificate' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate revoked successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async revokeCertificate(
    @Request() req: any,
    @Param('id') certificateId: string,
    @Body() body: { reason?: string },
  ): Promise<{ success: boolean; message: string }> {
    await this.certificatesService.revokeCertificate(
      req.user.sub,
      certificateId,
      body.reason,
    );

    return {
      success: true,
      message: 'Certificate revoked successfully',
    };
  }

  @Post('bulk-action')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform bulk actions on certificates' })
  @ApiResponse({
    status: 200,
    description: 'Bulk action completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'number' },
        failed: { type: 'number' },
        errors: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async bulkCertificateAction(
    @Request() req: any,
    @Body() actionDto: BulkCertificateActionDto,
  ): Promise<{ success: number; failed: number; errors: string[] }> {
    return this.certificatesService.bulkCertificateAction(req.user.sub, actionDto);
  }

  // =============================================
  // PUBLIC CERTIFICATE ENDPOINTS
  // =============================================

  @Get('public/:id')
  @ApiOperation({ summary: 'Get public certificate details' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Public certificate retrieved successfully',
    type: CertificateDto,
  })
  @ApiResponse({ status: 404, description: 'Certificate not found or not public' })
  async getPublicCertificate(
    @Param('id') certificateId: string,
  ): Promise<Partial<CertificateDto>> {
    // First verify the certificate exists and is public
    const verification = await this.certificatesService.verifyCertificate({
      certificateId,
    });

    if (!verification.isValid || !verification.certificate?.isPublic) {
      throw new Error('Certificate not found or not public');
    }

    // Return limited public information
    const cert = verification.certificate;
    return {
      id: cert.id,
      type: cert.type,
      title: cert.title,
      description: cert.description,
      issuedAt: cert.issuedAt,
      expiresAt: cert.expiresAt,
      skills: cert.skills,
      status: cert.status,
      certificateData: {
        recipientName: cert.certificateData.recipientName,
        title: cert.certificateData.title,
        organization: cert.certificateData.organization,
        issueDate: cert.certificateData.issueDate,
        completionDate: cert.certificateData.completionDate,
        programName: cert.certificateData.programName,
        skills: cert.certificateData.skills,
        certificateNumber: cert.certificateData.certificateNumber,
      },
    };
  }

  // =============================================
  // CERTIFICATE SHARING ENDPOINTS
  // =============================================

  @Get(':id/share-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get shareable URL for certificate' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Share URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        shareUrl: { type: 'string' },
        embedCode: { type: 'string' },
        socialSharing: {
          type: 'object',
          properties: {
            linkedin: { type: 'string' },
            twitter: { type: 'string' },
            facebook: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCertificateShareUrl(
    @Request() req: any,
    @Param('id') certificateId: string,
  ): Promise<any> {
    const certificate = await this.certificatesService.getCertificateById(
      req.user.sub,
      certificateId,
    );

    if (!certificate.isPublic) {
      throw new Error('Certificate must be public to generate share URLs');
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://learningos.com';
    const shareUrl = `${baseUrl}/certificates/public/${certificateId}`;
    
    const embedCode = `<iframe src="${shareUrl}?embed=true" width="600" height="400" frameborder="0"></iframe>`;

    const certificateTitle = encodeURIComponent(certificate.title);
    const socialText = encodeURIComponent(`I just earned a certificate in ${certificate.title}!`);

    return {
      shareUrl,
      embedCode,
      socialSharing: {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
        twitter: `https://twitter.com/intent/tweet?text=${socialText}&url=${encodeURIComponent(shareUrl)}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      },
    };
  }

  @Put(':id/visibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update certificate visibility' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate visibility updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        isPublic: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateCertificateVisibility(
    @Request() req: any,
    @Param('id') certificateId: string,
    @Body() body: { isPublic: boolean },
  ): Promise<{ success: boolean; isPublic: boolean }> {
    // First verify the certificate exists and belongs to the user
    await this.certificatesService.getCertificateById(req.user.sub, certificateId);

    // Update visibility (this would be a method in the service)
    await this.certificatesService.bulkCertificateAction(req.user.sub, {
      certificateIds: [certificateId],
      action: body.isPublic ? 'make_public' : 'make_private',
    });

    return {
      success: true,
      isPublic: body.isPublic,
    };
  }

  // =============================================
  // CERTIFICATE EXPORT ENDPOINTS
  // =============================================

  @Get(':id/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download certificate PDF' })
  @ApiParam({ name: 'id', description: 'Certificate ID' })
  @ApiResponse({
    status: 200,
    description: 'Certificate download initiated',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: { type: 'string' },
        expiresAt: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Certificate not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async downloadCertificate(
    @Request() req: any,
    @Param('id') certificateId: string,
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const certificate = await this.certificatesService.getCertificateById(
      req.user.sub,
      certificateId,
    );

    // Generate temporary download URL (in production, this would create a signed URL)
    const downloadUrl = certificate.certificateUrl;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    return {
      downloadUrl,
      expiresAt,
    };
  }

  @Post('export')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export multiple certificates' })
  @ApiResponse({
    status: 200,
    description: 'Certificate export initiated',
    schema: {
      type: 'object',
      properties: {
        exportId: { type: 'string' },
        downloadUrl: { type: 'string' },
        expiresAt: { type: 'string' },
        totalCertificates: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportCertificates(
    @Request() req: any,
    @Body() body: {
      certificateIds?: string[];
      format: 'pdf' | 'zip' | 'portfolio';
    },
  ): Promise<any> {
    // Get certificates to export
    let certificates;
    if (body.certificateIds && body.certificateIds.length > 0) {
      certificates = await Promise.all(
        body.certificateIds.map(id =>
          this.certificatesService.getCertificateById(req.user.sub, id)
        )
      );
    } else {
      // Export all certificates
      const result = await this.certificatesService.getUserCertificates(req.user.sub, {
        page: 1,
        limit: 1000, // Get all certificates
      });
      certificates = result.certificates;
    }

    // In production, this would initiate an async export job
    const exportId = `export_${Date.now()}_${req.user.sub}`;
    const downloadUrl = `${process.env.FRONTEND_URL || 'https://learningos.com'}/api/v1/certificates/exports/${exportId}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      exportId,
      downloadUrl,
      expiresAt,
      totalCertificates: certificates.length,
    };
  }

  // =============================================
  // CERTIFICATE TEMPLATES ENDPOINTS
  // =============================================

  @Get('templates/preview')
  @ApiOperation({ summary: 'Preview certificate templates' })
  @ApiQuery({ name: 'template', required: false, description: 'Template name' })
  @ApiResponse({
    status: 200,
    description: 'Template previews retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        templates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              displayName: { type: 'string' },
              description: { type: 'string' },
              previewUrl: { type: 'string' },
              features: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
  })
  async getCertificateTemplates(
    @Query('template') template?: string,
  ): Promise<any> {
    const templates = [
      {
        name: 'modern',
        displayName: 'Modern',
        description: 'Clean, contemporary design with subtle gradients',
        previewUrl: '/templates/modern-preview.png',
        features: ['Gradient background', 'Modern typography', 'QR code'],
      },
      {
        name: 'classic',
        displayName: 'Classic',
        description: 'Traditional academic style with ornate borders',
        previewUrl: '/templates/classic-preview.png',
        features: ['Ornate borders', 'Traditional fonts', 'Seal design'],
      },
      {
        name: 'professional',
        displayName: 'Professional',
        description: 'Business-oriented design for corporate training',
        previewUrl: '/templates/professional-preview.png',
        features: ['Corporate styling', 'Logo placement', 'Signature lines'],
      },
      {
        name: 'academic',
        displayName: 'Academic',
        description: 'University-style design for formal education',
        previewUrl: '/templates/academic-preview.png',
        features: ['Academic styling', 'Institution branding', 'Formal layout'],
      },
      {
        name: 'minimal',
        displayName: 'Minimal',
        description: 'Clean, simple design with focus on content',
        previewUrl: '/templates/minimal-preview.png',
        features: ['Minimal styling', 'Clean typography', 'Content focus'],
      },
    ];

    return {
      templates: template 
        ? templates.filter(t => t.name === template)
        : templates,
    };
  }
}