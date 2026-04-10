/**
 * FCM Device Token DTOs
 *
 * DTOs for managing Firebase Cloud Messaging device tokens
 */

import { IsString, IsEnum, IsOptional, IsBoolean, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DeviceType {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM registration token from the device',
    example: 'fMJsRgKLXkE:APA91bH...',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'Type of device',
    enum: DeviceType,
    example: DeviceType.ANDROID,
  })
  @IsEnum(DeviceType)
  device_type: DeviceType;

  @ApiPropertyOptional({
    description: 'Device name (e.g., "iPhone 15 Pro", "Samsung Galaxy S24")',
    example: 'iPhone 15 Pro',
  })
  @IsOptional()
  @IsString()
  device_name?: string;

  @ApiPropertyOptional({
    description: 'Unique device identifier',
    example: 'device_abc123',
  })
  @IsOptional()
  @IsString()
  device_id?: string;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  app_version?: string;

  @ApiPropertyOptional({
    description: 'Operating system version',
    example: 'iOS 17.0',
  })
  @IsOptional()
  @IsString()
  os_version?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { timezone: 'America/New_York' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UnregisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM registration token to unregister',
    example: 'fMJsRgKLXkE:APA91bH...',
  })
  @IsString()
  token: string;
}

export class UpdateDeviceTokenDto {
  @ApiPropertyOptional({
    description: 'New FCM registration token (when token is refreshed)',
    example: 'fMJsRgKLXkE:APA91bH...',
  })
  @IsOptional()
  @IsString()
  new_token?: string;

  @ApiPropertyOptional({
    description: 'Whether the token is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'App version',
    example: '1.0.1',
  })
  @IsOptional()
  @IsString()
  app_version?: string;

  @ApiPropertyOptional({
    description: 'Operating system version',
    example: 'iOS 17.1',
  })
  @IsOptional()
  @IsString()
  os_version?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata',
    example: { timezone: 'America/New_York' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class DeviceTokenResponseDto {
  @ApiProperty({ description: 'Token record ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  user_id: string;

  @ApiProperty({ description: 'Device type', enum: DeviceType })
  device_type: DeviceType;

  @ApiProperty({ description: 'Device name' })
  device_name: string | null;

  @ApiProperty({ description: 'Device ID' })
  device_id: string | null;

  @ApiProperty({ description: 'App version' })
  app_version: string | null;

  @ApiProperty({ description: 'OS version' })
  os_version: string | null;

  @ApiProperty({ description: 'Whether token is active' })
  is_active: boolean;

  @ApiProperty({ description: 'Last used timestamp' })
  last_used_at: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;
}

export class SendTestNotificationDto {
  @ApiProperty({
    description: 'Notification title',
    example: 'Test Notification',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Notification body',
    example: 'This is a test notification',
  })
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Additional data payload',
    example: { action: 'test' },
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, string>;
}
