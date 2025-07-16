'use server';

/**
 * @fileOverview An AI agent that suggests cartoon styles based on the input photo.
 *
 * - suggestCartoonStyles - A function that suggests cartoon styles based on the input photo.
 * - SuggestCartoonStylesInput - The input type for the suggestCartoonStyles function.
 * - SuggestCartoonStylesOutput - The return type for the suggestCartoonStyles function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestCartoonStylesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to generate cartoon styles for, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestCartoonStylesInput = z.infer<typeof SuggestCartoonStylesInputSchema>;

const SuggestCartoonStylesOutputSchema = z.object({
  suggestedStyles: z
    .array(z.string())
    .describe('An array of suggested cartoon styles based on the input photo.'),
});
export type SuggestCartoonStylesOutput = z.infer<typeof SuggestCartoonStylesOutputSchema>;

export async function suggestCartoonStyles(
  input: SuggestCartoonStylesInput
): Promise<SuggestCartoonStylesOutput> {
  return suggestCartoonStylesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCartoonStylesPrompt',
  input: {schema: SuggestCartoonStylesInputSchema},
  output: {schema: SuggestCartoonStylesOutputSchema},
  prompt: `You are an AI expert in image analysis and cartoon style suggestion.

  Based on the photo provided, suggest a list of cartoon styles that would be most suitable for the image.
  Consider the content, composition, and overall aesthetic of the photo when making your suggestions.
  Respond with a comma-separated list of cartoon styles.

  Here is the photo: {{media url=photoDataUri}}
  `,
});

const suggestCartoonStylesFlow = ai.defineFlow(
  {
    name: 'suggestCartoonStylesFlow',
    inputSchema: SuggestCartoonStylesInputSchema,
    outputSchema: SuggestCartoonStylesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
