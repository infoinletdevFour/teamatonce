import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Req,
  Res,
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ProjectService } from './project.service';
import {
  UploadFileDto,
  UploadDeliverableDto,
  FileResponseDto,
  FileListQueryDto,
  UpdateFileDto,
} from './dto/file.dto';

@ApiTags('project-files')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly projectService: ProjectService) {}

  // ============================================
  // FILE UPLOAD
  // ============================================

  @Post(':projectId/files/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file to project' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        description: {
          type: 'string',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
        milestoneId: {
          type: 'string',
        },
        isPublic: {
          type: 'boolean',
        },
        sharedWith: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async uploadFile(
    @Param('projectId') projectId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.sub || req.user.userId;
    return this.projectService.uploadProjectFile(projectId, userId, file, dto);
  }

  @Post(':projectId/milestones/:milestoneId/deliverables/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a milestone deliverable' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        deliverableIndex: {
          type: 'number',
        },
        description: {
          type: 'string',
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
  })
  async uploadDeliverable(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadDeliverableDto,
    @Req() req,
  ): Promise<FileResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user.sub || req.user.userId;
    return this.projectService.uploadMilestoneDeliverable(
      projectId,
      milestoneId,
      userId,
      file,
      dto,
    );
  }

  // ============================================
  // FILE LISTING & RETRIEVAL
  // ============================================

  @Get(':projectId/files')
  @ApiOperation({ summary: 'List all files for a project' })
  async getProjectFiles(
    @Param('projectId') projectId: string,
    @Query() query: FileListQueryDto,
    @Req() req,
  ) {
    const userId = req.user.sub || req.user.userId;
    // Service now returns camelCase transformed data
    return this.projectService.getProjectFiles(projectId, query);
  }

  @Get(':projectId/files/:fileId')
  @ApiOperation({ summary: 'Get file details by ID' })
  async getFileDetails(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ): Promise<FileResponseDto> {
    return this.projectService.getFileById(projectId, fileId);
  }

  // ============================================
  // FILE DOWNLOAD
  // ============================================

  @Get(':projectId/files/:fileId/download')
  @ApiOperation({ summary: 'Download a file' })
  async downloadFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const fileData = await this.projectService.downloadProjectFile(projectId, fileId);

    res.set({
      'Content-Type': fileData.mimeType,
      'Content-Disposition': `attachment; filename="${fileData.fileName}"`,
    });

    return new StreamableFile(fileData.buffer);
  }

  @Get(':projectId/files/:fileId/url')
  @ApiOperation({ summary: 'Get signed URL for file access' })
  async getFileUrl(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectService.getFileUrl(projectId, fileId);
  }

  // ============================================
  // FILE MANAGEMENT
  // ============================================

  @Delete(':projectId/files/:fileId')
  @ApiOperation({ summary: 'Delete a file' })
  async deleteFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.projectService.deleteProjectFile(projectId, fileId);
  }

  @Post(':projectId/files/:fileId/share')
  @ApiOperation({ summary: 'Share file with users' })
  async shareFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() body: { userIds: string[] },
  ) {
    return this.projectService.shareFile(projectId, fileId, body.userIds);
  }

  // ============================================
  // FILE METADATA
  // ============================================

  @Post(':projectId/files/:fileId')
  @ApiOperation({ summary: 'Update file metadata' })
  async updateFileMetadata(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @Body() dto: UpdateFileDto,
  ) {
    return this.projectService.updateFileMetadata(projectId, fileId, dto);
  }

  // ============================================
  // MILESTONE FILES
  // ============================================

  @Get(':projectId/milestones/:milestoneId/files')
  @ApiOperation({ summary: 'Get all files for a milestone' })
  async getMilestoneFiles(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.projectService.getMilestoneFiles(projectId, milestoneId);
  }

  @Get(':projectId/milestones/:milestoneId/deliverables')
  @ApiOperation({ summary: 'Get deliverable files for a milestone' })
  async getMilestoneDeliverables(
    @Param('projectId') projectId: string,
    @Param('milestoneId') milestoneId: string,
  ) {
    return this.projectService.getMilestoneDeliverables(projectId, milestoneId);
  }
}
