# AI Provider Setup

This document explains how to configure AI providers for the Opportunity Hunter pipeline.

## Overview

Opportunity Hunter supports three AI providers:

- **Mock** (default) - Fake AI responses for development/testing
- **OpenAI** - GPT models for production use
- **Gemini** - Google's Gemini models for production use

## Configuration

AI provider is configured via environment variables in `.env.local` (or your deployment environment).

### Mock Provider (Default)

No configuration needed. The system uses mock responses by default.

```bash
# .env.local
AI_PROVIDER=mock
# or omit AI_PROVIDER entirely (defaults to mock)
```

**Use case:** Development, testing, CI/CD pipelines

### OpenAI Provider

Requires an OpenAI API key.

```bash
# .env.local
AI_PROVIDER=openai
OPENAI_API_KEY=sk-proj-...
OPENAI_MODEL=gpt-4o-mini  # Optional, defaults to gpt-4o-mini
```

**Models supported:**
- `gpt-4o` - Most capable, higher cost
- `gpt-4o-mini` - Recommended, good balance of quality and cost
- `gpt-3.5-turbo` - Faster, lower cost

**Get API key:** https://platform.openai.com/api-keys

### Gemini Provider

Requires a Google AI API key.

```bash
# .env.local
AI_PROVIDER=gemini
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-1.5-flash  # Optional, defaults to gemini-1.5-flash
```

**Models supported:**
- `gemini-1.5-pro` - Most capable, higher cost
- `gemini-1.5-flash` - Recommended, fast and cost-effective
- `gemini-1.0-pro` - Previous generation

**Get API key:** https://makersuite.google.com/app/apikey

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `AI_PROVIDER` | No | `mock` | Provider to use: `mock`, `openai`, or `gemini` |
| `OPENAI_API_KEY` | Yes (if provider=openai) | - | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model to use |
| `GEMINI_API_KEY` | Yes (if provider=gemini) | - | Google AI API key |
| `GEMINI_MODEL` | No | `gemini-1.5-flash` | Gemini model to use |

## Validation

Environment variables are validated at runtime. If you set `AI_PROVIDER=openai` but forget to set `OPENAI_API_KEY`, you'll get a clear error message.

```bash
# Test your configuration
npm run type-check
npm run pipeline
```

## Cost Considerations

### OpenAI Pricing (as of 2024)

- **gpt-4o-mini**: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens
- **gpt-4o**: ~$5 per 1M input tokens, ~$15 per 1M output tokens

**Estimated cost per pipeline run (25 Reddit posts):**
- Pain point extraction: ~50K tokens → $0.01
- Clustering: ~20K tokens → $0.005
- Opportunities: ~10K tokens → $0.002
- Ideas: ~10K tokens → $0.002

**Total: ~$0.02 per pipeline run** (using gpt-4o-mini)

### Gemini Pricing (as of 2024)

- **gemini-1.5-flash**: Free tier: 15 requests/minute, 1M tokens/day
- **gemini-1.5-pro**: $0.35 per 1M input tokens, $1.40 per 1M output tokens

**Estimated cost per pipeline run: ~$0.005 - $0.01** (using gemini-1.5-flash)

## Development Workflow

1. **Start with Mock**: Develop and test with `AI_PROVIDER=mock`
2. **Test with Real AI**: Switch to `openai` or `gemini` for integration testing
3. **Deploy to Production**: Use real AI provider with API keys in deployment environment

## Switching Providers

You can switch providers at any time by changing `AI_PROVIDER`:

```bash
# Development
AI_PROVIDER=mock npm run pipeline

# Test with OpenAI
AI_PROVIDER=openai OPENAI_API_KEY=sk-... npm run pipeline

# Test with Gemini
AI_PROVIDER=gemini GEMINI_API_KEY=... npm run pipeline
```

## Troubleshooting

### "OPENAI_API_KEY is required"

You set `AI_PROVIDER=openai` but didn't provide the API key. Add `OPENAI_API_KEY` to `.env.local`.

### "GEMINI_API_KEY is required"

You set `AI_PROVIDER=gemini` but didn't provide the API key. Add `GEMINI_API_KEY` to `.env.local`.

### Rate Limiting

Both OpenAI and Gemini have rate limits. If you hit them:

1. Add retry logic (coming in future sprint)
2. Reduce pipeline frequency
3. Upgrade to higher tier

### Invalid Responses

If AI responses are malformed:

1. Check model version
2. Verify API key is valid
3. Check provider status page
4. Fall back to mock provider for testing

## Next Steps

- Sprint 19B: Implement OpenAIProvider
- Sprint 19C: Implement GeminiProvider
- Sprint 20: Add retry logic and error handling
- Sprint 21: Add response validation and fallbacks
