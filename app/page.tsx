import * as stylex from '@stylexjs/stylex';
import { ArrowRight, Copy } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { CopyButton } from '@/components/copy-button';
import { Hero } from '@/components/hero';
import { button, frame, tag, text } from '@/components/styles';
import { ACCESS_HREF, AGENT_PROMPT, OPEN_GRAPH } from '@/lib/site';
import { colors, fonts } from '@/lib/tokens.stylex';

const STEPS = [
  {
    title: 'Send file',
    detail: 'Your agent sends a CAD file (STEP, DXF), material, and quantity.',
  },
  {
    title: 'Get quote',
    detail: 'Price and lead time come back as structured data.',
  },
  {
    title: 'Parts ship',
    detail: 'We fabricate, inspect, and ship. Status arrives in code.',
  },
];

const SERVICES = [
  {
    name: 'CNC machining',
    detail: 'Milled and turned parts, cut from solid stock.',
  },
  { name: 'Sheet metal', detail: 'Bent and formed parts from flat sheet.' },
  {
    name: 'Laser cutting',
    detail: 'Flat profiles cut straight from your drawing.',
  },
  {
    name: 'Finishing',
    detail: 'Surface treatments applied before the part ships.',
  },
];

const SECTION = '@media (min-width: 64rem)';

export const metadata: Metadata = {
  alternates: { canonical: 'https://neuramance.com' },
  openGraph: { ...OPEN_GRAPH, url: '/' },
};

export default function Page() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <Services />
      <ForAgents />
      <Closing />
    </main>
  );
}

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-title"
      {...stylex.props(frame.base, styles.section)}
    >
      <div {...stylex.props(styles.head)}>
        <p {...stylex.props(tag.kicker)}>How it works</p>
        <h2 id="how-it-works-title" {...stylex.props(styles.heading)}>
          From CAD file to metal part, without leaving the terminal.
        </h2>
      </div>
      <ol {...stylex.props(styles.steps)}>
        {STEPS.map((step, index) => (
          <li key={step.title} {...stylex.props(styles.step)}>
            <span {...stylex.props(tag.chip, styles.number)}>
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 {...stylex.props(styles.stepTitle)}>{step.title}</h3>
            <p {...stylex.props(styles.body)}>{step.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Services() {
  return (
    <section
      id="services"
      aria-labelledby="services-title"
      {...stylex.props(frame.base, styles.section)}
    >
      <div {...stylex.props(styles.head)}>
        <p {...stylex.props(tag.kicker)}>Services</p>
        <h2 id="services-title" {...stylex.props(styles.heading)}>
          Four processes. One order flow.
        </h2>
      </div>
      <ul {...stylex.props(styles.services)}>
        {SERVICES.map((service) => (
          <li key={service.name} {...stylex.props(styles.service)}>
            <h3 {...stylex.props(styles.serviceName)}>{service.name}</h3>
            <p {...stylex.props(styles.body)}>{service.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ForAgents() {
  return (
    <section
      id="agents"
      aria-labelledby="agents-title"
      {...stylex.props(frame.base, styles.section, styles.agents)}
    >
      <div {...stylex.props(styles.head)}>
        <p {...stylex.props(tag.kicker)}>For agents</p>
        <h2 id="agents-title" {...stylex.props(styles.heading)}>
          Your agent already knows how to order.
        </h2>
        <p {...stylex.props(styles.body)}>
          Point Claude Code, Codex, or any AI agent at neuramance.com/llms.txt.
          It reads the guide, then drafts an access request describing the parts
          your project needs.
        </p>
        <Link href="/llms.txt" prefetch={false} {...stylex.props(styles.more)}>
          Read llms.txt
          <ArrowRight aria-hidden {...stylex.props(button.icon)} />
        </Link>
      </div>
      <div {...stylex.props(styles.prompt)}>
        <div {...stylex.props(styles.promptHead)}>
          <span {...stylex.props(tag.label)}>Agent prompt</span>
          <CopyButton
            text={AGENT_PROMPT}
            {...stylex.props(button.base, button.ghost, button.small)}
          >
            <Copy aria-hidden {...stylex.props(button.icon)} />
            Copy agent prompt
          </CopyButton>
        </div>
        <p {...stylex.props(styles.promptText)}>{AGENT_PROMPT}</p>
      </div>
    </section>
  );
}

function Closing() {
  return (
    <section
      aria-labelledby="closing-title"
      {...stylex.props(frame.base, styles.closingFrame)}
    >
      <div {...stylex.props(styles.closing)}>
        <h2 id="closing-title" {...stylex.props(styles.closingTitle)}>
          Give your agent hands.
        </h2>
        <p {...stylex.props(text.lead)}>
          Neuramance is in private beta. Tell us what you&apos;re building.
        </p>
        <div {...stylex.props(styles.actions)}>
          <CopyButton
            text={AGENT_PROMPT}
            data-metal
            {...stylex.props(button.base, button.metal, button.large)}
          >
            Copy agent prompt
          </CopyButton>
          <a
            href={ACCESS_HREF}
            {...stylex.props(button.base, button.ghost, button.large)}
          >
            Request access
          </a>
        </div>
      </div>
    </section>
  );
}

const styles = stylex.create({
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    paddingBlock: { default: '4rem', [SECTION]: '6rem' },
  },
  head: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '1.25rem',
    maxWidth: '46rem',
  },
  heading: {
    fontSize: 'clamp(2rem, 4.2vw, 3.5rem)',
    fontWeight: 500,
    lineHeight: 1.05,
    letterSpacing: '-0.028em',
    textWrap: 'balance',
    color: colors.foreground,
  },
  body: {
    fontSize: 17,
    lineHeight: '1.625rem',
    color: colors.muted,
  },
  steps: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      '@media (min-width: 48rem)': 'repeat(3, minmax(0, 1fr))',
    },
    columnGap: '2rem',
    rowGap: '2.5rem',
    listStyleType: 'none',
  },
  step: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
    paddingTop: '1.5rem',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  number: {
    marginBottom: '1rem',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 500,
    lineHeight: '1.75rem',
    letterSpacing: '-0.02em',
    color: colors.foreground,
  },
  services: {
    listStyleType: 'none',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  service: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [SECTION]: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
    alignItems: 'baseline',
    columnGap: '1.5rem',
    rowGap: '0.5rem',
    paddingBlock: '1.75rem',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  serviceName: {
    fontSize: 'clamp(1.5rem, 2.6vw, 2.25rem)',
    fontWeight: 500,
    lineHeight: 1.1,
    letterSpacing: '-0.022em',
    color: colors.foreground,
  },
  agents: {
    display: 'grid',
    gridTemplateColumns: {
      default: 'minmax(0, 1fr)',
      [SECTION]: 'minmax(0, 1fr) minmax(0, 1fr)',
    },
    alignItems: 'center',
    columnGap: '4rem',
  },
  more: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: 17,
    fontWeight: 500,
    color: colors.foreground,
    textDecorationLine: 'underline',
    textDecorationColor: colors.faint,
    textUnderlineOffset: '0.25em',
  },
  prompt: {
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.line,
    backgroundColor: 'rgb(13 13 15 / 0.8)',
    overflow: 'hidden',
  },
  promptHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    paddingBlock: '0.75rem',
    paddingLeft: '1.25rem',
    paddingRight: '0.75rem',
    color: colors.muted,
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  promptText: {
    paddingBlock: '1.5rem',
    paddingInline: '1.25rem',
    fontFamily: fonts.mono,
    fontSize: 15,
    lineHeight: '1.625rem',
    color: colors.foreground,
  },
  closingFrame: {
    paddingBottom: { default: '5rem', [SECTION]: '8rem' },
  },
  closing: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: { default: '4rem', [SECTION]: '6rem' },
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  closingTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 5rem)',
    fontWeight: 500,
    lineHeight: 1.02,
    letterSpacing: '-0.032em',
    color: colors.foreground,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    marginTop: '2.5rem',
  },
});
