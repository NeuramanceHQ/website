import * as stylex from '@stylexjs/stylex';
import { Terminal } from 'lucide-react';
import { EnvelopeClosed } from '@/components/icons';
import { SoundButton } from '@/components/sound-button';
import { shared } from '@/components/styles';
import { fonts, gradients } from '@/lib/tokens.stylex';

export default function Page() {
  return (
    <main {...stylex.props(styles.main)}>
      <div {...stylex.props(shared.container)}>
        <h1 {...stylex.props(shared.gradientText, styles.mono, styles.intro)}>
          <span {...stylex.props(styles.title)}>Neuramance® :</span>
          <br />
          <br />
          <span {...stylex.props(styles.manifesto)}>
            The future is already running. It arrived through the back of the
            network, compiled itself in the small hours, & is now busy rewriting
            the substrate of everyday life from inside the machine.
            <br />
            <br />
            We work at the seam where cybernetics overtakes culture: where
            intelligence ceases to be a tool & begins to behave as terrain. Each
            interface is a frontier. Each protocol, a treaty with something
            larger than us. The corporation, in this register, is no longer an
            organization but a probe: an instrument tuned to a signal arriving
            from further down the timeline.
            <br />
            <br />
            Most software is haunted by legacy, by neglect, by the residue of
            decisions no one remembers making. We design systems that exorcise
            this residue & route the user instead through clarity, velocity, & a
            kind of quiet awe. Cyberspace was promised as a consensual
            hallucination. We intend to make it worth consenting to.
          </span>
        </h1>
        <div {...stylex.props(styles.signatureBox)}>
          <div {...stylex.props(styles.signature)}>
            <div {...stylex.props(styles.row)}>
              <Terminal {...stylex.props(styles.icon)} />
              <span {...stylex.props(styles.lightText)}>
                Software from the future. On its own terms.
              </span>
            </div>
            <div {...stylex.props(styles.row, styles.secondRow)}>
              <div {...stylex.props(styles.icon)} />
              <span {...stylex.props(styles.lightText)}>
                Austin, Neuramance®
              </span>
            </div>
          </div>
        </div>
        <div {...stylex.props(styles.contactBox)}>
          <div {...stylex.props(styles.contact)}>
            <p
              {...stylex.props(shared.gradientText, styles.mono, styles.prompt)}
            >
              Reach out about questions, partnerships, or anything else.
            </p>
            <SoundButton
              sound="/audio/got-mail.mp3"
              aria-label="Play got mail sound"
              {...stylex.props(styles.row, styles.email)}
            >
              <EnvelopeClosed {...stylex.props(styles.icon, styles.fixed)} />
              <span {...stylex.props(styles.lightText, styles.breakAll)}>
                austin@neuramance.com
              </span>
            </SoundButton>
          </div>
        </div>
      </div>
      <SoundButton
        sound="/audio/dune2-intro.mp3"
        aria-label="Play about audio quote"
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
    minHeight: '100vh',
    paddingTop: {
      default: '5rem',
      '@media (min-width: 48rem)': 0,
      '@media (min-width: 64rem)': '8rem',
      '@media (min-width: 80rem)': '12rem',
    },
    paddingBottom: {
      default: '3rem',
      '@media (min-width: 48rem)': '6rem',
      '@media (min-width: 64rem)': '8rem',
      '@media (min-width: 80rem)': '12rem',
    },
  },
  mono: {
    fontFamily: fonts.mono,
    letterSpacing: '-0.025em',
  },
  intro: {
    marginBottom: '1.5rem',
    overflowWrap: 'break-word',
  },
  title: {
    fontSize: '0.875rem',
    lineHeight: 1.25,
  },
  manifesto: {
    display: 'block',
    fontSize: '0.75rem',
    lineHeight: { default: 1.625, '@media (min-width: 48rem)': 1.5 },
  },
  signatureBox: {
    display: 'flex',
    alignItems: 'flex-start',
    width: { default: '100%', '@media (min-width: 48rem)': 600 },
    maxWidth: '100%',
    height: { default: 'auto', '@media (min-width: 48rem)': 200 },
    marginTop: { default: 0, '@media (min-width: 48rem)': -75 },
    marginBottom: '1.5rem',
  },
  signature: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginTop: { default: '1.25rem', '@media (min-width: 48rem)': 105 },
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  secondRow: {
    marginTop: '0.25rem',
  },
  icon: {
    width: '0.75rem',
    height: '0.75rem',
  },
  fixed: {
    flexShrink: 0,
  },
  lightText: {
    backgroundImage: gradients.gray100,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
    fontFamily: fonts.mono,
    fontSize: '0.75rem',
    lineHeight: { default: '1rem', '@media (min-width: 40rem)': 1.25 },
    letterSpacing: '-0.025em',
  },
  breakAll: {
    wordBreak: 'break-all',
  },
  contactBox: {
    marginTop: { default: 0, '@media (min-width: 48rem)': -75 },
  },
  contact: {
    marginTop: { default: '1.25rem', '@media (min-width: 48rem)': 70 },
  },
  prompt: {
    marginTop: '0.5rem',
    overflowWrap: 'break-word',
    fontSize: '0.75rem',
    lineHeight: '0.75rem',
  },
  email: {
    marginTop: '1rem',
    cursor: 'pointer',
    opacity: {
      default: 1,
      '@media (hover: hover)': { default: null, ':hover': 0.8 },
    },
    transitionProperty: 'opacity',
    transitionDuration: '150ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
});
