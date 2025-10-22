// src/app/(public)/home/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">Welcome to Al Mushrif Pet Shop</h1>
        
        <p className="mb-6">Your public homepage content goes here!</p>
        
        <ul className="list-disc text-left max-w-md mx-auto mb-8">
          <li className="mb-2">
            This page uses the Public Layout with the new Header and Footer.
          </li>
          <li className="mb-2">
            The Admin pages are correctly isolated.
          </li>
        </ul>

        <div className="mt-8">
          <Link href="/mushrif-admin" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Go to Admin Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}