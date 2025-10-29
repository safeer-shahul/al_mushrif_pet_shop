// src/app/page.tsx
import { redirect } from 'next/navigation';

/**
 * Root page file. Immediately redirects to the public homepage
 * Note: We redirect to '/home' not '/(public)'
 */
export default function RootPage() {
  redirect('/home');
}