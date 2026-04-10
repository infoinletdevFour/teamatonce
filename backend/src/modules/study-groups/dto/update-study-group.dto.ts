import { PartialType } from '@nestjs/swagger';
import { CreateStudyGroupDto } from './create-study-group.dto';

export class UpdateStudyGroupDto extends PartialType(CreateStudyGroupDto) {}