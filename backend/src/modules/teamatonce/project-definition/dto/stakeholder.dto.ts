import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum StakeholderRole {
  PRODUCT_OWNER = 'product-owner',
  END_USER = 'end-user',
  BUSINESS_STAKEHOLDER = 'business-stakeholder',
  TECHNICAL_STAKEHOLDER = 'technical-stakeholder',
}

export class CreateStakeholderDto {
  @ApiProperty({ description: 'Stakeholder name', example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Stakeholder role', enum: StakeholderRole, example: StakeholderRole.PRODUCT_OWNER })
  @IsEnum(StakeholderRole)
  role: StakeholderRole;

  @ApiProperty({ description: 'Expected outcome from stakeholder perspective', example: 'Improve user engagement by 30%' })
  @IsString()
  expectedOutcome: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+1234567890' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}

export class UpdateStakeholderDto {
  @ApiPropertyOptional({ description: 'Stakeholder name', example: 'Jane Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Stakeholder role', enum: StakeholderRole })
  @IsOptional()
  @IsEnum(StakeholderRole)
  role?: StakeholderRole;

  @ApiPropertyOptional({ description: 'Expected outcome', example: 'Updated expected outcome' })
  @IsOptional()
  @IsString()
  expectedOutcome?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'jane.doe@example.com' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+9876543210' })
  @IsOptional()
  @IsString()
  contactPhone?: string;
}
