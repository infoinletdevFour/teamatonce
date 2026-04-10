/**
 * Device Token Controller
 *
 * REST API for managing FCM device tokens for mobile push notifications.
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { DeviceTokenService } from './device-token.service';
import {
  RegisterDeviceTokenDto,
  UnregisterDeviceTokenDto,
  UpdateDeviceTokenDto,
  DeviceTokenResponseDto,
  SendTestNotificationDto,
} from './dto/fcm-token.dto';

@ApiTags('Device Tokens (FCM)')
@Controller('api/device-tokens')
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class DeviceTokenController {
  constructor(private readonly deviceTokenService: DeviceTokenService) {}

  /**
   * Register a new device token for push notifications
   */
  @Post('register')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({
    status: 201,
    description: 'Device token registered successfully',
    type: DeviceTokenResponseDto,
  })
  async registerToken(
    @Request() req: any,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.deviceTokenService.registerToken(userId, dto);
  }

  /**
   * Unregister a device token
   */
  @Post('unregister')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unregister device token' })
  @ApiResponse({
    status: 200,
    description: 'Device token unregistered successfully',
  })
  async unregisterToken(
    @Request() req: any,
    @Body() dto: UnregisterDeviceTokenDto,
  ): Promise<{ success: boolean }> {
    const userId = req.user.sub || req.user.userId;
    return this.deviceTokenService.unregisterToken(userId, dto);
  }

  /**
   * Get all registered device tokens for the current user
   */
  @Get()
  @ApiOperation({ summary: 'Get all registered device tokens' })
  @ApiResponse({
    status: 200,
    description: 'List of registered device tokens',
    type: [DeviceTokenResponseDto],
  })
  async getUserTokens(@Request() req: any): Promise<DeviceTokenResponseDto[]> {
    const userId = req.user.sub || req.user.userId;
    return this.deviceTokenService.getUserTokens(userId);
  }

  /**
   * Update a device token
   */
  @Put(':tokenId')
  @ApiOperation({ summary: 'Update a device token' })
  @ApiResponse({
    status: 200,
    description: 'Device token updated successfully',
    type: DeviceTokenResponseDto,
  })
  async updateToken(
    @Request() req: any,
    @Param('tokenId') tokenId: string,
    @Body() dto: UpdateDeviceTokenDto,
  ): Promise<DeviceTokenResponseDto> {
    const userId = req.user.sub || req.user.userId;
    return this.deviceTokenService.updateToken(userId, tokenId, dto);
  }

  /**
   * Send a test notification to the current user's devices
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send test notification to your devices' })
  @ApiResponse({
    status: 200,
    description: 'Test notification sent',
  })
  async sendTestNotification(
    @Request() req: any,
    @Body() dto: SendTestNotificationDto,
  ): Promise<{ success: boolean; sentTo: number; failed: number }> {
    const userId = req.user.sub || req.user.userId;
    return this.deviceTokenService.sendTestNotification(
      userId,
      dto.title,
      dto.body,
      dto.data,
    );
  }
}
