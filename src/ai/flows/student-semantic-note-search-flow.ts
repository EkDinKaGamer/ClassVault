'use server';
/**
 * @fileOverview Provides a Genkit flow for intelligent semantic search of study notes.
 *
 * - studentSemanticNoteSearch - A function that handles semantic search for student notes.
 * - StudentSemanticSearchInput - The input type for the studentSemanticNoteSearch function.
 * - StudentSemanticSearchOutput - The return type for the studentSemanticNoteSearch function.
 */
import { z } from "zod";
import {ai} from '@/ai/genkit';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/**
 * Input schema for the semantic note search flow.
 */
const StudentSemanticSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query from the student.'),
});
export type StudentSemanticSearchInput = z.infer<typeof StudentSemanticSearchInputSchema>;

/**
 * Schema for a simplified note card output in search results.
 */
const NoteCardOutputSchema = z.object({
  type NoteCardOutput = z.infer<typeof NoteCardOutputSchema>;
  id: z.string().describe('Unique identifier for the note.'),
  title: z.string().describe('The title of the note.'),
  subject: z.string().optional().describe('The subject the note belongs to.'),
  chapter: z.string().describe('The specific chapter or topic within the subject.'),
  description: z.string().describe('A brief description or summary of the note content.'),
  fileUrl: z.string().describe('The URL to download or view the note file.'),
  thumbnail: z.string().describe('The URL for the note thumbnail image.'),
  isPremium: z.boolean().describe('Indicates if the note requires premium access.'),
  uploadDate: z.any().describe('The date the note was uploaded.'),
});

/**
 * Output schema for the semantic note search flow.
 */
const StudentSemanticSearchOutputSchema = z.array(NoteCardOutputSchema);
export type StudentSemanticSearchOutput = z.infer<typeof StudentSemanticSearchOutputSchema>;

/**
 * Defines a prompt to semantically match a user's query against available note metadata.
 */
const semanticNoteSearchPrompt = ai.definePrompt({
  name: 'semanticNoteSearchPrompt',
  input: {
    schema: z.object({
      userQuery: z.string().describe('The natural language search query from the student.'),
      notesMetadata: z.array(
        z.object({
          id: z.string().describe('Unique identifier for the note.'),
          title: z.string().describe('The title of the note.'),
          subject: z.string().optional().describe('The subject.'),
          chapter: z.string().describe('The topic.'),
          description: z.string().describe('The summary.'),
        })
      ).describe('A list of available notes.'),
    }),
  },
  output: {
    schema: z.array(z.object({ id: z.string().describe('The ID of a relevant note.') })),
  },
  prompt: `You are an intelligent search assistant for ClassVault.
Your goal is to identify relevant study notes from the provided list based on the user's query.

Query: {{{userQuery}}}

Notes: {{json notesMetadata}}

Identify up to 5 most relevant note 'id's. Return as JSON array of objects with 'id'.`,
});

/**
 * Genkit flow for performing a semantic search on student notes using live Firestore data.
 */
const studentSemanticNoteSearchFlow = ai.defineFlow(
  {
    name: 'studentSemanticNoteSearchFlow',
    inputSchema: StudentSemanticSearchInputSchema,
    outputSchema: StudentSemanticSearchOutputSchema,
  },
  async (input) => {
    const { query } = input;

    // Initialize Firebase if not already initialized
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Fetch live notes from Firestore
    const notesSnapshot = await getDocs(collection(db, 'notes'));
    const allNotes = notesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as any[];

    if (allNotes.length === 0) return [];

    // Prepare metadata for LLM
    const notesMetadata = allNotes.map(note => ({
      id: note.id,
      title: note.title,
      subject: note.subjectId, // In a real app, join with subject name if needed
      chapter: note.chapter,
      description: note.description,
    }));

    const { output: relevantNoteIdsOutput } = await semanticNoteSearchPrompt({
      userQuery: query,
      notesMetadata: notesMetadata,
    });

    if (!relevantNoteIdsOutput || relevantNoteIdsOutput.length === 0) {
      return [];
    }

    // Filter and return the full note data
    const relevantNotes = relevantNoteIdsOutput
      .map(result => allNotes.find(note => note.id === result.id))
      .filter(Boolean) as any[];

    return relevantNotes;
  }
);

export async function studentSemanticNoteSearch(input: StudentSemanticSearchInput): Promise<StudentSemanticSearchOutput> {
  return studentSemanticNoteSearchFlow(input);
}
