'use server';
/**
 * @fileOverview Analyzes facial expressions from an image to determine emotional state.
 *
 * - analyzeEmotion - A function that handles the emotion analysis process.
 * - AnalyzeEmotionInput - The input type for the analyzeEmotion function, which includes an image data URI.
 * - AnalyzeEmotionOutput - The return type for the analyzeEmotion function, including the detected emotion and a help needed flag.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeEmotionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a face, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AnalyzeEmotionInput = z.infer<typeof AnalyzeEmotionInputSchema>;

const AnalyzeEmotionOutputSchema = z.object({
  emotion: z.string().describe('The predominant emotion detected in the face.'),
  helpNeeded: z
    .boolean()
    .describe(
      'Whether or not help is likely needed based on the detected emotion.'
    ),
});
export type AnalyzeEmotionOutput = z.infer<typeof AnalyzeEmotionOutputSchema>;

export async function analyzeEmotion(input: AnalyzeEmotionInput): Promise<AnalyzeEmotionOutput> {
  return analyzeEmotionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeEmotionPrompt',
  input: {schema: AnalyzeEmotionInputSchema},
  output: {schema: AnalyzeEmotionOutputSchema},
  prompt: `Analyze the facial expression in the following image and determine the predominant emotion.  Also, determine if the user likely needs help based on their emotion.

Image: {{media url=photoDataUri}}

Respond in JSON format.`,
});

const analyzeEmotionFlow = ai.defineFlow(
  {
    name: 'analyzeEmotionFlow',
    inputSchema: AnalyzeEmotionInputSchema,
    outputSchema: AnalyzeEmotionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
