'use server';
/**
 * @fileOverview Provides a Genkit flow for intelligent semantic search of study notes.
 */

import { z } from "zod";
import { ai } from '@/ai/genkit';
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
 * Input schema
 */
const StudentSemanticSearchInputSchema = z.object({
  query: z.string().describe('The natural language search query from the student.'),
});
export type StudentSemanticSearchInput = z.infer<typeof StudentSemanticSearchInputSchema>;

/**
 * Note schema
 */
const NoteCardOutputSchema = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.string().optional(),
  chapter: z.string(),
  description: z.string(),
  fileUrl: z.string(),
  thumbnail: z.string(),
  isPremium: z.boolean(),
  uploadDate: z.any(),
});

/**
 * ✅ FIXED TYPE (IMPORTANT)
 */
export type NoteCardOutput = z.infer<typeof NoteCardOutputSchema>;

/**
 * Output schema
 */
const StudentSemanticSearchOutputSchema = z.array(NoteCardOutputSchema);
export type StudentSemanticSearchOutput = z.infer<typeof StudentSemanticSearchOutputSchema>;

/**
 * Prompt
 */
const semanticNoteSearchPrompt = ai.definePrompt({
  name: 'semanticNoteSearchPrompt',
  input: {
    schema: z.object({
      userQuery: z.string(),
      notesMetadata: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          subject: z.string().optional(),
          chapter: z.string(),
          description: z.string(),
        })
      ),
    }),
  },
  output: {
    schema: z.array(z.object({ id: z.string() })),
  },
  prompt: `You are an intelligent search assistant for ClassVault.
Your goal is to identify relevant study notes from the provided list based on the user's query.
Query: {{{userQuery}}}
Notes: {{json notesMetadata}}
Identify up to 5 most relevant note 'id's. Return as JSON array of objects with 'id'.`,
});

/**
 * Flow
 */
const studentSemanticNoteSearchFlow = ai.defineFlow(
  {
    name: 'studentSemanticNoteSearchFlow',
    inputSchema: StudentSemanticSearchInputSchema,
    outputSchema: StudentSemanticSearchOutputSchema,
  },
  async (input) => {
    const { query } = input;

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    const notesSnapshot = await getDocs(collection(db, 'notes'));

    const allNotes = notesSnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    })) as NoteCardOutput[];

    if (allNotes.length === 0) return [];

    const notesMetadata = allNotes.map(note => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      chapter: note.chapter,
      description: note.description,
    }));

    const { output: relevantNoteIdsOutput } = await semanticNoteSearchPrompt({
      userQuery: query,
      notesMetadata,
    });

    if (!relevantNoteIdsOutput || relevantNoteIdsOutput.length === 0) {
      return [];
    }

    const relevantNotes = relevantNoteIdsOutput
      .map(result => allNotes.find(note => note.id === result.id))
      .filter(Boolean) as NoteCardOutput[];
    export type NoteCardOutput = z.infer<typeof NoteCardOutputSchema>;

    return relevantNotes;
  }
);

export async function studentSemanticNoteSearch(
  input: StudentSemanticSearchInput
): Promise<StudentSemanticSearchOutput> {
  return studentSemanticNoteSearchFlow(input);
}
