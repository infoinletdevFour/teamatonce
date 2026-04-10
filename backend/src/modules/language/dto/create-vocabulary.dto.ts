import { IsString, IsOptional, IsEnum, IsArray, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WordType {
  NOUN = 'noun',
  VERB = 'verb',
  ADJECTIVE = 'adjective',
  ADVERB = 'adverb',
  PREPOSITION = 'preposition',
  CONJUNCTION = 'conjunction',
  INTERJECTION = 'interjection',
  PRONOUN = 'pronoun',
  PHRASE = 'phrase'
}

export class CreateVocabularyDto {
  @ApiProperty({ description: 'Word or phrase', example: 'Hola' })
  @IsString()
  word: string;

  @ApiProperty({ description: 'Translation', example: 'Hello' })
  @IsString()
  translation: string;

  @ApiProperty({ 
    description: 'Language code of the word',
    example: 'es'
  })
  @IsString()
  language_code: string;

  @ApiProperty({ 
    description: 'Language code of the translation',
    example: 'en'
  })
  @IsString()
  translation_language: string;

  @ApiProperty({ 
    description: 'Type of word',
    enum: WordType,
    example: WordType.NOUN
  })
  @IsEnum(WordType)
  word_type: WordType;

  @ApiPropertyOptional({ description: 'Phonetic pronunciation', example: '/ˈoʊlə/' })
  @IsOptional()
  @IsString()
  phonetic?: string;

  @ApiPropertyOptional({ description: 'Definition or explanation' })
  @IsOptional()
  @IsString()
  definition?: string;

  @ApiPropertyOptional({ description: 'Example sentence using the word' })
  @IsOptional()
  @IsString()
  example_sentence?: string;

  @ApiPropertyOptional({ description: 'Translation of example sentence' })
  @IsOptional()
  @IsString()
  example_translation?: string;

  @ApiPropertyOptional({ description: 'Audio URL for pronunciation' })
  @IsOptional()
  @IsString()
  audio_url?: string;

  @ApiPropertyOptional({ description: 'Image URL for visual association' })
  @IsOptional()
  @IsString()
  image_url?: string;

  @ApiPropertyOptional({ description: 'Difficulty level (1-10)', example: 3 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  difficulty_level?: number;

  @ApiPropertyOptional({ description: 'Word frequency (1-10)', example: 8 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  frequency?: number;

  @ApiPropertyOptional({ description: 'Category or topic', example: 'greetings' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Tags for organizing vocabulary', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Additional vocabulary metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}