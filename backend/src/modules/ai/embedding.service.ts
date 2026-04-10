import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private openai: OpenAI;
  private readonly model: string;
  private readonly dimensions = 1536; // text-embedding-3-small default

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn('OpenAI API key not configured. Embedding service will be disabled.');
      return;
    }

    this.openai = new OpenAI({ apiKey });
    this.model = this.configService.get<string>('OPENAI_EMBEDDING_MODEL') || 'text-embedding-3-small';

    this.logger.log(`Embedding service initialized with model: ${this.model}`);
  }

  /**
   * Check if the service is properly configured
   */
  isConfigured(): boolean {
    return !!this.openai;
  }

  /**
   * Get the vector dimensions for this embedding model
   */
  getDimensions(): number {
    return this.dimensions;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.openai) {
      this.logger.warn('OpenAI not configured. Cannot generate embedding.');
      return [];
    }

    if (!text || text.trim().length === 0) {
      this.logger.warn('Empty text provided for embedding generation.');
      return [];
    }

    try {
      // Truncate text if too long (max ~8191 tokens for text-embedding-3-small)
      const truncatedText = text.slice(0, 30000);

      const response = await this.openai.embeddings.create({
        model: this.model,
        input: truncatedText,
      });

      if (!response.data || response.data.length === 0) {
        this.logger.error('Empty response from OpenAI embeddings API');
        return [];
      }

      this.logger.debug(`Generated embedding for text (${truncatedText.length} chars)`);
      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.openai) {
      this.logger.warn('OpenAI not configured. Cannot generate embeddings.');
      return [];
    }

    if (!texts || texts.length === 0) {
      return [];
    }

    try {
      // Filter out empty texts and truncate
      const processedTexts = texts
        .filter(t => t && t.trim().length > 0)
        .map(t => t.slice(0, 30000));

      if (processedTexts.length === 0) {
        return [];
      }

      // OpenAI batch limit is typically 2048 inputs
      const batchSize = 100;
      const allEmbeddings: number[][] = [];

      for (let i = 0; i < processedTexts.length; i += batchSize) {
        const batch = processedTexts.slice(i, i + batchSize);

        const response = await this.openai.embeddings.create({
          model: this.model,
          input: batch,
        });

        const batchEmbeddings = response.data.map(d => d.embedding);
        allEmbeddings.push(...batchEmbeddings);

        this.logger.debug(`Generated embeddings batch ${Math.floor(i / batchSize) + 1}`);
      }

      this.logger.log(`Generated ${allEmbeddings.length} embeddings`);
      return allEmbeddings;
    } catch (error) {
      this.logger.error(`Failed to generate embeddings: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate embedding for profile/job data
   * Combines relevant fields into a single searchable text
   */
  async generateProfileEmbedding(data: {
    summary?: string;
    skills?: string[];
    role?: string;
    specializations?: string[];
    rawData?: Record<string, any>;
  }): Promise<number[]> {
    const parts: string[] = [];

    if (data.summary) {
      parts.push(data.summary);
    }

    if (data.role) {
      parts.push(`Role: ${data.role}`);
    }

    if (data.skills && data.skills.length > 0) {
      parts.push(`Skills: ${data.skills.join(', ')}`);
    }

    if (data.specializations && data.specializations.length > 0) {
      parts.push(`Specializations: ${data.specializations.join(', ')}`);
    }

    // Include additional context from raw data if available
    if (data.rawData) {
      if (data.rawData.bio) {
        parts.push(data.rawData.bio);
      }
      if (data.rawData.company) {
        parts.push(`Company: ${data.rawData.company}`);
      }
      if (data.rawData.location) {
        parts.push(`Location: ${data.rawData.location}`);
      }
    }

    const combinedText = parts.join('\n');
    return this.generateEmbedding(combinedText);
  }

  /**
   * Generate embedding for job post data
   */
  async generateJobEmbedding(data: {
    summary?: string;
    technologies?: string[];
    projectType?: string;
    complexity?: string;
    rawData?: Record<string, any>;
  }): Promise<number[]> {
    const parts: string[] = [];

    if (data.summary) {
      parts.push(data.summary);
    }

    if (data.projectType) {
      parts.push(`Project Type: ${data.projectType}`);
    }

    if (data.technologies && data.technologies.length > 0) {
      parts.push(`Technologies: ${data.technologies.join(', ')}`);
    }

    if (data.complexity) {
      parts.push(`Complexity: ${data.complexity}`);
    }

    // Include additional context from raw data if available
    if (data.rawData) {
      if (data.rawData.text) {
        parts.push(data.rawData.text);
      } else if (data.rawData.description) {
        parts.push(data.rawData.description);
      }
      if (data.rawData.company) {
        parts.push(`Company: ${data.rawData.company}`);
      }
    }

    const combinedText = parts.join('\n');
    return this.generateEmbedding(combinedText);
  }
}
