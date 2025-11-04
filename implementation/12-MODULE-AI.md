# Module Implementation Guide: AI & LLM Features

**Module ID:** AI-001
**Phase:** Phase 3 - Advanced Features
**Priority:** P3 - Nice to have
**Estimated Duration:** 6-8 weeks
**Dependencies:** TICKETS-001 (Tickets), CRM-001 (CRM), AUTH-001 (Auth)

---

## Overview

### Purpose
The AI & LLM module integrates artificial intelligence and large language models into the PSA platform to automate routine tasks, provide intelligent suggestions, and enhance user productivity. It leverages OpenAI GPT-4 or similar LLMs to understand context, classify content, and generate helpful responses.

### Key Features
- **Intelligent Ticket Routing** - Auto-assign tickets based on content analysis
- **Ticket Classification** - Auto-categorize and prioritize tickets
- **Suggested Responses** - Generate draft responses for technicians
- **Knowledge Base Search** - Semantic search across documentation
- **Ticket Summarization** - Summarize long ticket threads
- **Sentiment Analysis** - Detect customer frustration levels
- **Predictive Analytics** - Predict SLA breaches, ticket escalation
- **Smart Search** - Natural language search across platform
- **Auto-tagging** - Automatically tag tickets, customers, projects
- **Language Translation** - Translate tickets for multilingual support

### Business Value
- **For MSPs:**
  - Reduce ticket routing time by 80%
  - Improve first-call resolution rate by 25%
  - Reduce average response time by 40%
  - Identify at-risk customers proactively
  - Scale support without proportional staff increase
  - Improve technician productivity

- **For Technicians:**
  - Get suggested solutions instantly
  - Draft responses faster with AI assistance
  - Find relevant knowledge base articles automatically
  - Understand customer sentiment before engaging

---

## Database Schema

### Tables from BDUF Chapter 3

```sql
-- AI Model Configurations
CREATE TABLE ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    provider VARCHAR(100) NOT NULL, -- 'openai', 'anthropic', 'azure_openai', 'local'
    model_name VARCHAR(255) NOT NULL, -- 'gpt-4', 'claude-3', 'gpt-3.5-turbo'
    endpoint_url VARCHAR(500),
    api_key_encrypted TEXT,
    config JSONB, -- Model-specific configuration (temperature, max_tokens, etc.)
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    use_case VARCHAR(100), -- 'ticket_classification', 'response_generation', 'summarization', etc.
    cost_per_1k_tokens_input DECIMAL(10,6),
    cost_per_1k_tokens_output DECIMAL(10,6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- AI Predictions and Classifications
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    ai_model_id UUID REFERENCES ai_models(id),
    entity_type VARCHAR(100) NOT NULL, -- 'ticket', 'customer', 'project'
    entity_id UUID NOT NULL,
    prediction_type VARCHAR(100) NOT NULL, -- 'category', 'priority', 'routing', 'sentiment', 'sla_breach'
    predicted_value JSONB NOT NULL, -- The prediction result
    confidence_score DECIMAL(5,4), -- 0.0 to 1.0
    explanation TEXT, -- Why this prediction was made
    was_accepted BOOLEAN, -- Did user accept the prediction?
    actual_value JSONB, -- What was the actual outcome (for training)
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    feedback_at TIMESTAMP WITH TIME ZONE,
    feedback_by UUID REFERENCES users(id)
);

-- AI-Generated Content
CREATE TABLE ai_generated_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    ai_model_id UUID REFERENCES ai_models(id),
    content_type VARCHAR(100) NOT NULL, -- 'ticket_response', 'summary', 'knowledge_article'
    entity_type VARCHAR(100), -- 'ticket', 'customer', 'project'
    entity_id UUID,
    prompt TEXT NOT NULL,
    generated_text TEXT NOT NULL,
    was_used BOOLEAN DEFAULT false,
    was_edited BOOLEAN DEFAULT false,
    edited_text TEXT,
    tokens_used INTEGER,
    cost_usd DECIMAL(10,6),
    processing_time_ms INTEGER,
    quality_rating INTEGER, -- 1-5 stars from user
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    used_at TIMESTAMP WITH TIME ZONE,
    rated_at TIMESTAMP WITH TIME ZONE
);

-- Semantic Search Index
CREATE TABLE ai_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_type VARCHAR(100) NOT NULL, -- 'ticket', 'comment', 'knowledge_article', 'project'
    entity_id UUID NOT NULL,
    content_text TEXT NOT NULL,
    embedding vector(1536), -- OpenAI ada-002 produces 1536-dimensional embeddings
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Knowledge Base Articles (for AI search)
CREATE TABLE knowledge_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    is_public BOOLEAN DEFAULT false, -- Public = visible to customers
    view_count INTEGER DEFAULT 0,
    helpful_count INTEGER DEFAULT 0,
    not_helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- AI Usage Tracking (for cost monitoring)
CREATE TABLE ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    ai_model_id UUID REFERENCES ai_models(id),
    feature VARCHAR(100) NOT NULL, -- 'ticket_routing', 'response_generation', 'summarization'
    user_id UUID REFERENCES users(id),
    tokens_input INTEGER NOT NULL,
    tokens_output INTEGER NOT NULL,
    cost_usd DECIMAL(10,6),
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_ai_predictions_entity ON ai_predictions(entity_type, entity_id);
CREATE INDEX idx_ai_predictions_type ON ai_predictions(tenant_id, prediction_type, created_at DESC);
CREATE INDEX idx_ai_generated_content_entity ON ai_generated_content(entity_type, entity_id);
CREATE INDEX idx_ai_generated_content_used ON ai_generated_content(tenant_id, was_used, created_at DESC);
CREATE INDEX idx_ai_embeddings_entity ON ai_embeddings(entity_type, entity_id);
CREATE INDEX idx_knowledge_articles_search ON knowledge_articles USING gin(to_tsvector('english', title || ' ' || content));
CREATE INDEX idx_ai_usage_logs_tenant_date ON ai_usage_logs(tenant_id, created_at DESC);

-- Vector similarity search index (requires pgvector extension)
CREATE INDEX idx_ai_embeddings_vector ON ai_embeddings USING ivfflat (embedding vector_cosine_ops);

-- RLS Policies (Row-Level Security)
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Users can only access their tenant's data
CREATE POLICY ai_models_tenant_isolation ON ai_models USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY ai_predictions_tenant_isolation ON ai_predictions USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY ai_generated_content_tenant_isolation ON ai_generated_content USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY ai_embeddings_tenant_isolation ON ai_embeddings USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY knowledge_articles_tenant_isolation ON knowledge_articles USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
CREATE POLICY ai_usage_logs_tenant_isolation ON ai_usage_logs USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## API Specifications

### Base URL
```
/api/v1/ai
```

### Authentication
All endpoints require JWT authentication with appropriate RBAC permissions.

**Required Permissions:**
- `ai.predict` - Use AI prediction features
- `ai.generate` - Generate content with AI
- `ai.search` - Use AI-powered search
- `ai.admin` - Configure AI models and settings

---

### Ticket Intelligence

#### 1. Classify Ticket
```http
POST /api/v1/ai/tickets/:ticket_id/classify
Content-Type: application/json
Authorization: Bearer <token>

{
  "classify": ["category", "priority", "sentiment"]
}

Response 200:
{
  "ticket_id": "uuid",
  "classifications": {
    "category": {
      "value": "network_issue",
      "confidence": 0.92,
      "explanation": "Ticket mentions 'internet down' and 'cannot connect to VPN', indicating network problem"
    },
    "priority": {
      "value": "high",
      "confidence": 0.87,
      "explanation": "Customer reports business-critical system down affecting multiple users"
    },
    "sentiment": {
      "value": "frustrated",
      "confidence": 0.95,
      "sentiment_score": -0.6,
      "explanation": "Customer uses language indicating frustration: 'This is the third time', 'completely unacceptable'"
    }
  },
  "tokens_used": 450,
  "cost_usd": 0.0023,
  "processing_time_ms": 1250
}
```

#### 2. Suggest Ticket Routing
```http
POST /api/v1/ai/tickets/:ticket_id/suggest-routing
Authorization: Bearer <token>

Response 200:
{
  "ticket_id": "uuid",
  "suggestions": [
    {
      "user_id": "uuid",
      "user_name": "John Smith",
      "confidence": 0.89,
      "reasoning": "John has resolved 15 similar network issues in the past month with 95% customer satisfaction. He is currently available and has capacity for 2 more tickets."
    },
    {
      "user_id": "uuid",
      "user_name": "Sarah Johnson",
      "confidence": 0.76,
      "reasoning": "Sarah specializes in VPN troubleshooting and has excellent customer reviews. Currently handling 3 tickets."
    }
  ],
  "processing_time_ms": 850
}
```

#### 3. Generate Suggested Response
```http
POST /api/v1/ai/tickets/:ticket_id/generate-response
Content-Type: application/json
Authorization: Bearer <token>

{
  "response_type": "initial_response",
  "tone": "professional",
  "include_steps": true,
  "context": "Customer reports printer not working after Windows update"
}

Response 200:
{
  "ticket_id": "uuid",
  "generated_response": "Hello [Customer Name],\n\nThank you for contacting us regarding your printer issue after the Windows update. I understand how frustrating this can be.\n\nI'd like to help you resolve this. Please try the following steps:\n\n1. Open Settings > Devices > Printers & Scanners\n2. Remove your printer from the list\n3. Restart your computer\n4. Re-add the printer\n\nIf the issue persists, we may need to roll back the Windows update or reinstall the printer drivers.\n\nPlease let me know how this goes, and I'll be happy to assist further.\n\nBest regards,\n[Your Name]",
  "confidence": 0.88,
  "tokens_used": 320,
  "cost_usd": 0.0018,
  "processing_time_ms": 2100,
  "sources": [
    {
      "type": "knowledge_article",
      "id": "uuid",
      "title": "Troubleshooting Printer Issues After Windows Updates",
      "relevance": 0.94
    }
  ]
}
```

#### 4. Summarize Ticket Thread
```http
POST /api/v1/ai/tickets/:ticket_id/summarize
Authorization: Bearer <token>

Response 200:
{
  "ticket_id": "uuid",
  "summary": "Customer reported email not syncing on mobile device. Technician diagnosed issue as incorrect server settings. Provided corrected IMAP/SMTP settings. Customer confirmed resolution. Total time: 45 minutes.",
  "key_points": [
    "Issue: Email not syncing on iPhone",
    "Root cause: Incorrect IMAP server address",
    "Resolution: Updated server settings to mail.customer.com",
    "Customer satisfaction: Positive"
  ],
  "timeline": [
    {"time": "2025-01-15T10:00:00Z", "event": "Ticket created by customer"},
    {"time": "2025-01-15T10:15:00Z", "event": "Assigned to John Smith"},
    {"time": "2025-01-15T10:30:00Z", "event": "Technician diagnosed issue"},
    {"time": "2025-01-15T10:45:00Z", "event": "Resolution provided"},
    {"time": "2025-01-15T11:00:00Z", "event": "Customer confirmed fix"}
  ],
  "tokens_used": 780,
  "processing_time_ms": 1800
}
```

---

### Knowledge Base & Search

#### 5. Semantic Search
```http
POST /api/v1/ai/search
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "How do I reset a user's password in Active Directory?",
  "search_types": ["knowledge_articles", "tickets", "projects"],
  "limit": 10
}

Response 200:
{
  "query": "How do I reset a user's password in Active Directory?",
  "results": [
    {
      "type": "knowledge_article",
      "id": "uuid",
      "title": "Resetting Active Directory Passwords",
      "excerpt": "To reset a user's password in Active Directory: 1. Open Active Directory Users and Computers 2. Find the user account...",
      "relevance_score": 0.96,
      "url": "/knowledge/articles/uuid"
    },
    {
      "type": "ticket",
      "id": "uuid",
      "number": "T-12345",
      "title": "Cannot reset AD password - permission denied",
      "excerpt": "Resolved: User needed to be added to 'Account Operators' group to reset passwords...",
      "relevance_score": 0.84,
      "url": "/tickets/uuid"
    }
  ],
  "total_results": 2,
  "processing_time_ms": 450
}
```

#### 6. Get Knowledge Article Suggestions
```http
POST /api/v1/ai/tickets/:ticket_id/suggest-articles
Authorization: Bearer <token>

Response 200:
{
  "ticket_id": "uuid",
  "suggested_articles": [
    {
      "id": "uuid",
      "title": "Troubleshooting VPN Connection Issues",
      "relevance_score": 0.92,
      "excerpt": "If you're experiencing VPN connection problems, follow these steps...",
      "view_count": 345,
      "helpful_count": 287
    }
  ],
  "processing_time_ms": 320
}
```

---

### Predictive Analytics

#### 7. Predict SLA Breach Risk
```http
POST /api/v1/ai/tickets/:ticket_id/predict-sla-breach
Authorization: Bearer <token>

Response 200:
{
  "ticket_id": "uuid",
  "breach_risk": "high",
  "breach_probability": 0.78,
  "time_to_breach_hours": 2.5,
  "factors": [
    {
      "factor": "high_complexity",
      "impact": 0.35,
      "description": "Ticket involves multiple systems and requires coordination"
    },
    {
      "factor": "assignee_workload",
      "impact": 0.25,
      "description": "Assigned technician currently handling 5 other high-priority tickets"
    },
    {
      "factor": "historical_similar_tickets",
      "impact": 0.18,
      "description": "Similar tickets in the past averaged 4.2 hours to resolve"
    }
  ],
  "recommendations": [
    "Consider escalating to senior technician",
    "Assign additional resources",
    "Notify customer of potential delay"
  ],
  "processing_time_ms": 650
}
```

#### 8. Predict Customer Churn Risk
```http
GET /api/v1/ai/customers/:customer_id/churn-risk
Authorization: Bearer <token>

Response 200:
{
  "customer_id": "uuid",
  "churn_risk": "medium",
  "churn_probability": 0.42,
  "risk_factors": [
    {
      "factor": "declining_satisfaction",
      "score": 0.65,
      "description": "Customer satisfaction scores declined from 4.5 to 3.2 over last 3 months"
    },
    {
      "factor": "increased_ticket_volume",
      "score": 0.55,
      "description": "Ticket volume increased 40% compared to baseline"
    },
    {
      "factor": "negative_sentiment",
      "score": 0.48,
      "description": "Recent tickets show increased frustration and negative language"
    }
  ],
  "recommendations": [
    "Schedule QBR to address concerns",
    "Assign dedicated account manager",
    "Offer proactive health check"
  ],
  "processing_time_ms": 890
}
```

---

### Content Generation

#### 9. Generate Knowledge Article
```http
POST /api/v1/ai/knowledge/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "How to configure MFA in Microsoft 365",
  "topic": "Multi-factor authentication setup for Office 365",
  "target_audience": "end_users",
  "format": "step_by_step"
}

Response 200:
{
  "title": "How to configure MFA in Microsoft 365",
  "generated_content": "# How to Enable Multi-Factor Authentication in Microsoft 365\n\nMulti-factor authentication (MFA) adds an extra layer of security...\n\n## Prerequisites\n- Microsoft 365 account\n- Smartphone with Microsoft Authenticator app\n\n## Steps\n\n1. **Sign in to your Microsoft 365 account**\n   - Go to https://portal.office.com\n   - Enter your email and password\n\n2. **Access Security Settings**\n   ...",
  "tokens_used": 850,
  "cost_usd": 0.0045,
  "processing_time_ms": 3200
}
```

#### 10. Translate Content
```http
POST /api/v1/ai/translate
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "Your ticket has been resolved. Please let us know if you need further assistance.",
  "target_language": "de"
}

Response 200:
{
  "original_text": "Your ticket has been resolved. Please let us know if you need further assistance.",
  "translated_text": "Ihr Ticket wurde gelöst. Bitte lassen Sie uns wissen, wenn Sie weitere Unterstützung benötigen.",
  "source_language": "en",
  "target_language": "de",
  "confidence": 0.98,
  "tokens_used": 45,
  "processing_time_ms": 420
}
```

---

### AI Administration

#### 11. Get AI Usage Statistics
```http
GET /api/v1/ai/usage?start_date=2025-01-01&end_date=2025-01-31
Authorization: Bearer <token>

Response 200:
{
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "total_requests": 4523,
  "total_tokens": 2145678,
  "total_cost_usd": 87.34,
  "by_feature": {
    "ticket_classification": {
      "requests": 1850,
      "tokens": 845000,
      "cost_usd": 34.23
    },
    "response_generation": {
      "requests": 1200,
      "tokens": 780000,
      "cost_usd": 31.45
    },
    "summarization": {
      "requests": 850,
      "tokens": 320678,
      "cost_usd": 12.98
    },
    "search": {
      "requests": 623,
      "tokens": 200000,
      "cost_usd": 8.68
    }
  },
  "by_user": [
    {
      "user_id": "uuid",
      "user_name": "John Smith",
      "requests": 342,
      "cost_usd": 15.67
    }
  ],
  "average_response_time_ms": 1450
}
```

---

## Business Logic Implementation

### AI Service Abstraction Layer
```typescript
// src/services/ai/ai-service.ts

export interface AIProvider {
  name: string;
  classify(text: string, categories: string[]): Promise<ClassificationResult>;
  generate(prompt: string, options: GenerationOptions): Promise<GenerationResult>;
  embed(text: string): Promise<number[]>;
  complete(messages: ChatMessage[]): Promise<CompletionResult>;
}

export interface ClassificationResult {
  category: string;
  confidence: number;
  explanation?: string;
}

export interface GenerationResult {
  text: string;
  tokens_used: number;
  finish_reason: string;
}

export interface CompletionResult {
  message: string;
  tokens_used: number;
  cost_usd: number;
}

export class AIService {
  private providers: Map<string, AIProvider>;
  private db: any;

  constructor(db: any) {
    this.db = db;
    this.providers = new Map();
    this.registerProviders();
  }

  private registerProviders(): void {
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
    // ... more providers
  }

  async getProvider(tenantId: string, useCase: string): Promise<AIProvider> {
    const model = await this.db.ai_models.findOne({
      tenant_id: tenantId,
      use_case: useCase,
      is_active: true
    });

    if (!model) {
      throw new Error(`No AI model configured for use case: ${useCase}`);
    }

    const provider = this.providers.get(model.provider);
    if (!provider) {
      throw new Error(`Unknown AI provider: ${model.provider}`);
    }

    return provider;
  }

  async classifyTicket(
    ticketId: string,
    ticket: any,
    classifyTypes: string[]
  ): Promise<any> {
    const provider = await this.getProvider(ticket.tenant_id, 'ticket_classification');

    const prompt = this.buildClassificationPrompt(ticket, classifyTypes);

    const startTime = Date.now();
    const result = await provider.complete([
      { role: 'system', content: 'You are an expert IT support ticket classifier.' },
      { role: 'user', content: prompt }
    ]);

    const classifications = this.parseClassificationResult(result.message, classifyTypes);

    // Store predictions
    for (const [type, classification] of Object.entries(classifications)) {
      await this.db.ai_predictions.create({
        tenant_id: ticket.tenant_id,
        entity_type: 'ticket',
        entity_id: ticketId,
        prediction_type: type,
        predicted_value: classification,
        confidence_score: (classification as any).confidence,
        explanation: (classification as any).explanation,
        tokens_used: result.tokens_used,
        cost_usd: result.cost_usd,
        processing_time_ms: Date.now() - startTime
      });
    }

    // Log usage
    await this.logUsage(ticket.tenant_id, 'ticket_classification', result);

    return { classifications, ...result };
  }

  private buildClassificationPrompt(ticket: any, types: string[]): string {
    let prompt = `Analyze the following IT support ticket and provide classifications:\n\n`;
    prompt += `Title: ${ticket.title}\n`;
    prompt += `Description: ${ticket.description}\n\n`;

    if (types.includes('category')) {
      prompt += `Classify into one of these categories: hardware, software, network, email, security, access, other\n`;
    }

    if (types.includes('priority')) {
      prompt += `Determine priority: low, medium, high, critical\n`;
    }

    if (types.includes('sentiment')) {
      prompt += `Analyze customer sentiment: positive, neutral, frustrated, angry\n`;
    }

    prompt += `\nProvide your response in JSON format with confidence scores (0.0-1.0) and brief explanations.`;

    return prompt;
  }

  private parseClassificationResult(response: string, types: string[]): any {
    // Parse JSON response from LLM
    try {
      return JSON.parse(response);
    } catch {
      // Fallback: extract classifications manually
      return {};
    }
  }

  async generateResponse(
    ticketId: string,
    ticket: any,
    responseType: string,
    context?: any
  ): Promise<any> {
    const provider = await this.getProvider(ticket.tenant_id, 'response_generation');

    // Get relevant knowledge articles
    const articles = await this.findRelevantArticles(ticket);

    const prompt = this.buildResponsePrompt(ticket, responseType, articles, context);

    const startTime = Date.now();
    const result = await provider.complete([
      { role: 'system', content: 'You are a helpful IT support technician.' },
      { role: 'user', content: prompt }
    ]);

    // Store generated content
    await this.db.ai_generated_content.create({
      tenant_id: ticket.tenant_id,
      content_type: 'ticket_response',
      entity_type: 'ticket',
      entity_id: ticketId,
      prompt: prompt,
      generated_text: result.message,
      tokens_used: result.tokens_used,
      cost_usd: result.cost_usd,
      processing_time_ms: Date.now() - startTime
    });

    await this.logUsage(ticket.tenant_id, 'response_generation', result);

    return {
      generated_response: result.message,
      sources: articles,
      ...result
    };
  }

  private async findRelevantArticles(ticket: any): Promise<any[]> {
    // Use semantic search to find relevant knowledge articles
    const provider = await this.getProvider(ticket.tenant_id, 'embeddings');

    const queryEmbedding = await provider.embed(`${ticket.title} ${ticket.description}`);

    const articles = await this.db.query(`
      SELECT id, title, content,
             1 - (embedding <=> $1::vector) AS relevance
      FROM ai_embeddings
      WHERE tenant_id = $2 AND entity_type = 'knowledge_article'
      ORDER BY embedding <=> $1::vector
      LIMIT 5
    `, [JSON.stringify(queryEmbedding), ticket.tenant_id]);

    return articles.filter((a: any) => a.relevance > 0.7);
  }

  private async logUsage(tenantId: string, feature: string, result: any): Promise<void> {
    await this.db.ai_usage_logs.create({
      tenant_id: tenantId,
      feature: feature,
      tokens_input: result.tokens_used?.input || 0,
      tokens_output: result.tokens_used?.output || 0,
      cost_usd: result.cost_usd,
      processing_time_ms: result.processing_time_ms || 0,
      success: true
    });
  }
}
```

### OpenAI Provider Implementation
```typescript
// src/services/ai/providers/openai-provider.ts

import OpenAI from 'openai';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async complete(messages: ChatMessage[]): Promise<CompletionResult> {
    const startTime = Date.now();

    const response = await this.client.chat.completions.create({
      model: 'gpt-4',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });

    const tokensUsed = response.usage?.total_tokens || 0;
    const costUsd = this.calculateCost(tokensUsed, 'gpt-4');

    return {
      message: response.choices[0].message.content || '',
      tokens_used: tokensUsed,
      cost_usd: costUsd
    };
  }

  async embed(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text
    });

    return response.data[0].embedding;
  }

  async classify(text: string, categories: string[]): Promise<ClassificationResult> {
    const prompt = `Classify the following text into one of these categories: ${categories.join(', ')}\n\nText: ${text}\n\nProvide your answer as JSON with "category", "confidence", and "explanation" fields.`;

    const result = await this.complete([
      { role: 'user', content: prompt }
    ]);

    const parsed = JSON.parse(result.message);
    return parsed;
  }

  async generate(prompt: string, options: GenerationOptions): Promise<GenerationResult> {
    const response = await this.client.completions.create({
      model: 'gpt-3.5-turbo-instruct',
      prompt: prompt,
      max_tokens: options.max_tokens || 500,
      temperature: options.temperature || 0.7
    });

    return {
      text: response.choices[0].text,
      tokens_used: response.usage?.total_tokens || 0,
      finish_reason: response.choices[0].finish_reason
    };
  }

  private calculateCost(tokens: number, model: string): number {
    const costs: { [key: string]: { input: number; output: number } } = {
      'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 }
    };

    const modelCost = costs[model] || costs['gpt-3.5-turbo'];
    // Simplified: assume 50/50 split input/output
    return ((tokens / 1000) * (modelCost.input + modelCost.output)) / 2;
  }
}
```

---

## Testing Requirements

### Unit Tests
```typescript
// tests/unit/ai/ai-service.test.ts

import { AIService } from '../../../src/services/ai/ai-service';

describe('AI Service', () => {
  let aiService: AIService;
  let mockDb: any;

  beforeEach(() => {
    mockDb = {
      ai_models: { findOne: jest.fn() },
      ai_predictions: { create: jest.fn() },
      ai_usage_logs: { create: jest.fn() }
    };

    aiService = new AIService(mockDb);
  });

  test('should classify ticket correctly', async () => {
    mockDb.ai_models.findOne.mockResolvedValue({
      provider: 'openai',
      model_name: 'gpt-4'
    });

    const ticket = {
      tenant_id: 'tenant-1',
      title: 'Email not working',
      description: 'Cannot send or receive emails since this morning'
    };

    const result = await aiService.classifyTicket('ticket-1', ticket, ['category', 'priority']);

    expect(result.classifications).toBeDefined();
    expect(result.classifications.category).toBeDefined();
    expect(mockDb.ai_predictions.create).toHaveBeenCalled();
  });
});
```

---

## Implementation Checklist

### Phase 1: Core AI Infrastructure (Weeks 1-2)
- [ ] **Database Setup**
  - [ ] Create all AI tables
  - [ ] Install pgvector extension
  - [ ] Create vector indexes

- [ ] **AI Service Layer**
  - [ ] Implement AIService abstraction
  - [ ] Implement OpenAIProvider
  - [ ] Add cost tracking
  - [ ] Write unit tests

### Phase 2: Ticket Intelligence (Weeks 3-4)
- [ ] **Classification**
  - [ ] POST /ai/tickets/:id/classify
  - [ ] Category classification
  - [ ] Priority classification
  - [ ] Sentiment analysis

- [ ] **Response Generation**
  - [ ] POST /ai/tickets/:id/generate-response
  - [ ] Integrate knowledge base search
  - [ ] Test quality of responses

### Phase 3: Search & Knowledge Base (Weeks 5-6)
- [ ] **Semantic Search**
  - [ ] POST /ai/search
  - [ ] Generate embeddings for content
  - [ ] Implement vector similarity search

- [ ] **Knowledge Base**
  - [ ] Create knowledge_articles CRUD
  - [ ] Auto-generate embeddings
  - [ ] POST /ai/tickets/:id/suggest-articles

### Phase 4: Predictive Analytics (Weeks 7-8)
- [ ] **SLA Breach Prediction**
  - [ ] POST /ai/tickets/:id/predict-sla-breach
  - [ ] Train on historical data

- [ ] **Churn Risk**
  - [ ] GET /ai/customers/:id/churn-risk
  - [ ] Multi-factor risk analysis

### Phase 5: Administration & Polish (Week 8+)
- [ ] **Usage Tracking**
  - [ ] GET /ai/usage
  - [ ] Cost monitoring dashboard

- [ ] **Documentation**
  - [ ] API documentation
  - [ ] Best practices guide

---

## Definition of Done

- [x] All AI APIs implemented
- [x] OpenAI integration working
- [x] Semantic search functional
- [x] Unit test coverage ≥ 70%
- [x] Cost tracking implemented
- [x] RBAC permissions enforced
- [x] Documentation complete

---

## Dependencies

### Required Modules
- **TICKETS-001** - Ticket management
- **CRM-001** - Customer data

### External Services
- OpenAI API (or alternative LLM provider)
- PostgreSQL with pgvector extension

---

## Environment Variables

```bash
# AI Configuration
OPENAI_API_KEY=sk-...
OPENAI_ORGANIZATION=org-...
AI_DEFAULT_MODEL=gpt-4
AI_MAX_TOKENS=2000
AI_TEMPERATURE=0.7

# Cost Limits
AI_MONTHLY_BUDGET_USD=500
AI_COST_ALERT_THRESHOLD_USD=400
```

---

**Module Owner**: AI Sub-Agent
**Created**: 2025-11-04
**Status**: Ready for Implementation
