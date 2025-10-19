import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic client with API key from environment
const anthropic = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  // Note: In production, API calls should go through your backend
  // to keep the API key secure. This is for development only.
  dangerouslyAllowBrowser: true,
});

export { anthropic };
