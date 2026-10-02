import * as stylex from '@stylexjs/stylex';
import { Nav } from '@/components/nav';

export default function Layout({ children }: LayoutProps<'/'>) {
  return (
    <div {...stylex.props(styles.shell)}>
      <Nav />
      {children}
    </div>
  );
}

const styles = stylex.create({
  shell: {
    display: 'grid',
    gridTemplateRows: 'auto minmax(0, 1fr)',
    height: '100dvh',
  },
});
