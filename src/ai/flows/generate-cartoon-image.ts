'use server';

/**
 * @fileOverview An AI agent that generates a cartoon image from a photo.
 *
 * - generateCartoonImage - A function that generates a cartoon image.
 * - GenerateCartoonImageInput - The input type for the generateCartoonImage function.
 * - GenerateCartoonImageOutput - The return type for the generateCartoonImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCartoonImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo to turn into a cartoon, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  style: z.string().describe('The cartoon style to apply.'),
  palette: z.string().describe('The color palette to use.'),
  lineArtDetail: z.number().describe('The level of detail for the line art (0-100).'),
});
export type GenerateCartoonImageInput = z.infer<typeof GenerateCartoonImageInputSchema>;

const GenerateCartoonImageOutputSchema = z.object({
  generatedImageUri: z
    .string()
    .describe(
      "The generated cartoon image, as a data URI that must include a MIME type and use Base64 encoding."
    ),
});
export type GenerateCartoonImageOutput = z.infer<typeof GenerateCartoonImageOutputSchema>;

export async function generateCartoonImage(
  input: GenerateCartoonImageInput
): Promise<GenerateCartoonImageOutput> {
  return generateCartoonImageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCartoonImagePrompt',
  input: {schema: GenerateCartoonImageInputSchema},
  output: {schema: GenerateCartoonImageOutputSchema},
  prompt: `You are an expert AI artist specializing in creating cartoon images from photos.
  Generate an image based on the provided photo.

  Instructions:
  1. Transform the photo into a cartoon.
  2. Apply the style: {{{style}}}.
  3. Use the color palette: {{{palette}}}.
  4. Adjust the line art detail to a level of {{{lineArtDetail}}} (where 0 is very soft and 100 is very bold and detailed).
  5. The output must be the generated image itself.

  Photo: {{media url=photoDataUri}}
  `,
});

const generateCartoonImageFlow = ai.defineFlow(
  {
    name: 'generateCartoonImageFlow',
    inputSchema: GenerateCartoonImageInputSchema,
    outputSchema: GenerateCartoonImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: input.photoDataUri } },
        { text: `Generate an image of the subject in a cartoon style.
          Style: ${input.style}.
          Color Palette: ${input.palette}.
          Line Art Detail: ${input.lineArtDetail}/100.`
        },
      ],
      config: {
        responseModalities: ['IMAGE'],
      },
    });

    if (!media.url) {
      throw new Error('Image generation failed.');
    }
    
    return { generatedImageUri: media.url };
  }
);
