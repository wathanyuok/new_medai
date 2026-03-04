export type OpenAIModel = 'claude-sonnet-4-20250514' | 'claude-3-5-sonnet-20250219';

export interface ChatBody {
  inputCode: string;
  model: string;
  apiKey?: string;
}
export interface ChatBodyImg {
  inputCode: string;
  model: string;
  apiKey?: string;
  imagebest64: string;
  imgtype: string;
}
export interface ChatBodyPdf {
  inputCode: string;
  model: string;
  apiKey?: string;
  pdfbest64: string;
}