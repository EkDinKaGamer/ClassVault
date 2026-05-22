import SubjectPageClient from '@/components/SubjectPageClient';

/**
 * Subject Library Page Shell
 * 
 * Satisfies Next.js 15 requirements for static export by awaiting params correctly.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  // Required for static export to know which paths to pre-render.
  // We provide a fallback 'initial' path.
  return [{ subjectId: 'initial' }];
}

interface PageProps {
  params: Promise<{ subjectId: string }>;
}

export default async function Page({ params }: PageProps) {
  // In Next.js 15, params is a Promise that must be awaited
  const { subjectId } = await params;
  
  return <SubjectPageClient />;
}
