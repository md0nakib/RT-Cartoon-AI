import { ToonifyApp } from '@/components/ToonifyApp';
import { Wand2 } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col items-center min-h-dvh bg-background text-foreground p-4 sm:p-6 md:p-8 overflow-hidden">
      <header className="w-full max-w-6xl mb-6 sm:mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wand2 className="w-8 h-8 sm:w-10 sm:h-10 text-primary" />
          <div>
            <h1 className="text-3xl sm:text-4xl font-headline font-bold text-foreground">
              RT Cartoon AI
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Turn your photos into cartoons with AI
            </p>
          </div>
        </div>
      </header>
      <main className="w-full flex-grow flex justify-center items-center">
        <ToonifyApp />
      </main>
      <footer className="w-full max-w-6xl mt-8 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} RT Cartoon AI. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
