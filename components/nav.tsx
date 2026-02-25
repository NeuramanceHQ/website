import Link from 'next/link';
import Image from 'next/image';
import AccountBlock from './account-block';
import HomeNavMenu from './home-nav-menu';
import MobileNavMenu from './mobile-nav-menu';
import GlitchWordmark from './ui/glitch-wordmark';
import { Button } from './ui/button';
import { LogIn, Circle, Terminal } from 'lucide-react';
import { DashboardIcon, ReaderIcon } from '@radix-ui/react-icons';



export default function HomepageNav() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 flex w-full justify-center border-b bg-secondary px-1 sm:px-2 py-1">
      <div className="flex w-full items-center justify-between gap-1">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <Link href="/" className="shrink-0">
            <Button size="nav" variant="secondary" className="gap-1 font-mono px-1.5 sm:px-2 sm:pr-2.5">
              <Image src="/hand.svg" alt="Hand icon" width={10} height={8} className="h-[8px] w-[10px]" />
              <span className="hidden min-[360px]:inline">Neuramance</span>
            </Button>
          </Link>
          <MobileNavMenu />
        </div>

        <div className="shrink-0">
          <Link href="/about">
            <Button size="nav" variant="secondary" className="gap-1 font-mono">
              <Terminal className="h-[8px] w-[10px]" />
              <span className="hidden sm:inline">About/Contact</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
