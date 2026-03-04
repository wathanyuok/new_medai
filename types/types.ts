export type OpenAIModel = 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-20250219';

export interface ChatBody {
  inputCode: string;
  model: OpenAIModel;
  apiKey?: string | undefined;
  imageBest64?: string;
}
