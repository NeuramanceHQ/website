import Link from 'next/link';
import * as stylex from '@stylexjs/stylex';
import { Announcement } from '@/components/announcement';
import { Footer } from '@/components/footer';
import { MetalLight } from '@/components/metal-light';
import { Nav } from '@/components/nav';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <>
      <Announcement>
        New: your AI agent can now request beta access for you.{' '}
        <Link href="/llms.txt" prefetch={false} {...stylex.props(styles.link)}>
          Read the agent guide
        </Link>
      </Announcement>
      <Nav />
      {children}
      <Footer />
      <MetalLight />
    </>
  );
}

const styles = stylex.create({
  link: {
    marginLeft: '0.5rem',
    textDecorationLine: 'underline',
    textUnderlineOffset: '0.2em',
    whiteSpace: 'nowrap',
  },
});
