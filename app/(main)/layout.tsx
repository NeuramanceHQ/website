import { Nav } from '@/components/nav';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Nav />
      {children}
    </>
  );
}
