import * as stylex from '@stylexjs/stylex';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { GlitchWordmark } from '@/components/glitch-wordmark';
import { FaceLevel } from '@/components/icons';
import { SoundButton } from '@/components/sound-button';
import { button, shared } from '@/components/styles';
import { fonts } from '@/lib/tokens.stylex';

export default function Page() {
  return (
    <main {...stylex.props(styles.main)}>
      <div {...stylex.props(shared.container, styles.content)}>
        <div>
          <GlitchWordmark />
          <div {...stylex.props(shared.gradientText, styles.tagline)}>
            Software From the Future.
          </div>
        </div>
        <div {...stylex.props(styles.cta)}>
          <FaceLevel {...stylex.props(styles.face)} />
          <Link
            href="/about"
            aria-label="Contact Neuramance"
            {...stylex.props(button.base)}
          >
            <Plus {...stylex.props(styles.plus)} />
            Contact us
          </Link>
        </div>
      </div>
      <SoundButton
        sound="/audio/dune1-intro.mp3"
        aria-label="Play audio quote"
        {...stylex.props(shared.gradientText, shared.quote)}
      >
        A company&apos;s excellence is conveyed in everything it does.
      </SoundButton>
    </main>
  );
}

const styles = stylex.create({
  main: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '100vh',
    paddingBlock: {
      default: '3rem',
      '@media (min-width: 48rem)': '6rem',
      '@media (min-width: 64rem)': '8rem',
      '@media (min-width: 80rem)': '12rem',
    },
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    textAlign: 'center',
  },
  tagline: {
    fontFamily: fonts.mono,
    fontSize: '0.75rem',
    lineHeight: '1rem',
    letterSpacing: '-0.025em',
  },
  cta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  face: {
    width: 95,
    height: 'auto',
    marginBottom: 2,
  },
  plus: {
    width: '0.75rem',
    height: '0.75rem',
  },
});
