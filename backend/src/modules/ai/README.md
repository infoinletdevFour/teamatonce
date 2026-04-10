# AI Module

A comprehensive AI-powered service module for the life-os-backend that provides all AI functionalities needed by the frontend and Flutter applications.

## Features

### Text Generation
- Blog posts, articles, social media content
- Email templates and marketing copy
- Technical documentation
- Multiple tone and audience options
- SEO optimization support

### Image Generation
- AI artwork and illustrations
- Logos and branding materials
- Various artistic styles and formats
- Customizable size and quality options

### Code Generation
- Multiple programming languages support
- Framework-specific code generation
- Error handling and validation
- Unit tests and documentation

### Translation Services
- 40+ language support
- Context-aware translations
- Cultural adaptation options
- Batch translation capabilities

### Content Summarization
- Multiple summary types (extractive, abstractive, bullet points)
- Customizable length and focus areas
- URL content summarization
- Key insights extraction

### AI Chat
- Conversational AI assistant
- Customizable personalities and contexts
- Session management
- Message history tracking

### Specialized Generation
- **Recipes**: Detailed recipes with ingredients, instructions, and nutrition info
- **Travel Plans**: Comprehensive itineraries with recommendations
- **Workout Plans**: Personalized fitness routines
- **Meal Plans**: Weekly meal planning with grocery lists

## API Endpoints

### Text Generation
- `POST /ai/generate-text` - Generate text content
- Parameters: prompt, text_type, tone, target_audience, word_count, etc.

### Image Generation
- `POST /ai/generate-image` - Generate images
- Parameters: prompt, style, size, quality, count, etc.

### Code Generation
- `POST /ai/generate-code` - Generate code
- Parameters: prompt, language, framework, complexity, etc.

### Translation
- `POST /ai/translate` - Translate text
- `POST /ai/translate-batch` - Batch translation
- Parameters: text, source_language, target_language, style, context

### Summarization
- `POST /ai/summarize` - Summarize content
- `POST /ai/summarize-url` - Summarize URL content
- Parameters: content, summary_type, length, focus_areas

### Chat
- `POST /ai/chat` - AI chat conversation
- `POST /ai/chat-history` - Continue chat with history
- `GET /ai/chat-sessions` - Get chat sessions
- `GET /ai/chat-sessions/:id` - Get specific session

### Specialized Generation
- `POST /ai/recipe` - Generate recipes
- `POST /ai/travel-plan` - Generate travel plans
- `POST /ai/workout-plan` - Generate workout plans
- `POST /ai/meal-plan` - Generate meal plans

### Analytics & Management
- `GET /ai/history` - Get generation history
- `GET /ai/usage` - Get usage statistics
- `GET /ai/health` - Service health check
- `GET /ai/models` - Available models
- `GET /ai/limits` - User limits and quotas

## Authentication

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

## Usage Tracking

The module tracks:
- Total requests made
- Tokens used
- Images generated
- Characters translated
- Processing times

## Error Handling

- Comprehensive error handling with meaningful messages
- Request validation using class-validator
- Rate limiting protection
- Graceful fallback mechanisms

## Database Integration

Uses Fluxez database for:
- Generation history storage
- Usage statistics tracking
- Chat session management
- User preferences

## Response Formats

All responses include:
- Generated content
- Metadata (timestamps, request IDs)
- Usage statistics
- Processing information

## Configuration

The module integrates with:
- Fluxez AI services for generation
- JWT authentication system
- Global configuration management
- Swagger/OpenAPI documentation

## Future Enhancements

Planned features:
- Real-time streaming responses
- Custom model fine-tuning
- Advanced analytics dashboard
- Multi-modal AI capabilities
- Collaboration features

## Architecture

```
src/modules/ai/
├── ai.module.ts          # Module configuration
├── ai.controller.ts      # REST API endpoints
├── ai.service.ts         # Business logic and Fluxez integration
├── dto/                  # Data transfer objects
│   ├── text-generation.dto.ts
│   ├── image-generation.dto.ts
│   ├── code-generation.dto.ts
│   ├── translation.dto.ts
│   ├── summarization.dto.ts
│   ├── chat.dto.ts
│   ├── specialized-generation.dto.ts
│   ├── ai-response.dto.ts
│   ├── ai-query.dto.ts
│   └── index.ts
├── index.ts             # Module exports
└── README.md           # This file
```

## Dependencies

- `@nestjs/common` - Core NestJS functionality
- `@nestjs/swagger` - API documentation
- `class-validator` - Request validation
- `class-transformer` - Data transformation
- `uuid` - Unique ID generation
- Fluxez SDK - AI service integration

## Usage Examples

### Generate Text
```javascript
POST /ai/generate-text
{
  "prompt": "Write about sustainable living",
  "text_type": "blog_post",
  "tone": "friendly",
  "target_audience": "general_public",
  "word_count": 500
}
```

### Generate Recipe
```javascript
POST /ai/recipe
{
  "recipe_request": "chocolate chip cookies",
  "servings": 4,
  "dietary_restrictions": ["vegetarian"],
  "include_nutrition": true
}
```

### AI Chat
```javascript
POST /ai/chat
{
  "message": "Help me plan a workout routine",
  "personality": "friendly",
  "context": "fitness_training"
}
```

This AI module provides a comprehensive foundation for AI-powered features in the life-os application, with robust error handling, usage tracking, and extensive customization options.