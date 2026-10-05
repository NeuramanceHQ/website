import * as stylex from '@stylexjs/stylex';
import { ArrowRight, Copy, Terminal } from 'lucide-react';
import Link from 'next/link';
import { CopyButton } from '@/components/copy-button';
import { Marquee } from '@/components/marquee';
import { button, frame, tag } from '@/components/styles';
import { ACCESS_HREF, AGENT_PROMPT } from '@/lib/site';
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

const FACTS = [
  ['Agent guide', '/llms.txt'],
  ['CAD formats', 'STEP · DXF'],
  ['Quotes return as', 'Structured data'],
  ['Order status', 'In code'],
  ['Shop', 'Austin, TX'],
];

const LINE_ITEMS = [
  ['CNC machining, 6061-T6', '25', '$950.00'],
  ['Anodize, black', '25', '$150.00'],
  ['Inspection report', '1', '$45.00'],
  ['Ground shipping', '1', '$38.00'],
];

const QUOTE = [
  ['Material', '6061-T6'],
  ['Quantity', '25'],
  ['Lead time', '6 days'],
  ['Total', '$1,183.00'],
];

const STATUS = [
  ['Status', 'Shipped'],
  ['Inspection', 'Passed'],
  ['Carrier', 'Ground'],
  ['Arrives', '10/14/26'],
];

const SECTION = '@media (min-width: 64rem)';
const STACK = '@media (max-width: 39.99rem)';

export default function Page() {
  return (
    <main>
      <div {...stylex.props(styles.hero)}>
        <div aria-hidden {...stylex.props(styles.dots)} />
        <div {...stylex.props(frame.base, styles.intro)}>
          <p {...stylex.props(tag.kicker)}>
            Metal parts ordered by AI agents
            <span {...stylex.props(tag.chip)}>Private beta</span>
          </p>
          <h1 {...stylex.props(styles.title)}>
            <span {...stylex.props(styles.line)}>
              Your agent sends the CAD file.
            </span>{' '}
            <span {...stylex.props(styles.line)}>We ship the metal part.</span>
          </h1>
          <p {...stylex.props(styles.lead)}>
            CNC machining, sheet metal, laser cutting, and finishing, ordered by
            your agent in code.
          </p>
          <div {...stylex.props(styles.form)}>
            <p {...stylex.props(styles.field)}>
              <Terminal aria-hidden {...stylex.props(styles.fieldIcon)} />
              <span {...stylex.props(styles.fieldText)}>{AGENT_PROMPT}</span>
            </p>
            <CopyButton
              text={AGENT_PROMPT}
              {...stylex.props(
                button.base,
                button.lime,
                button.large,
                styles.submit,
              )}
            >
              <Copy aria-hidden {...stylex.props(button.icon)} />
              Copy agent prompt
            </CopyButton>
          </div>
          <p {...stylex.props(styles.note)}>
            Paste it into Claude Code, Codex, or any agent. It drafts your
            access request.
          </p>
        </div>
        <div {...stylex.props(frame.base)}>
          <div aria-hidden {...stylex.props(styles.showcase)}>
            <div {...stylex.props(styles.stage)}>
              <div {...stylex.props(styles.document)}>
                <div {...stylex.props(styles.documentHead)}>
                  <span {...stylex.props(styles.cardLabel)}>Quote</span>
                  <span {...stylex.props(styles.mono)}>Q-1384</span>
                </div>
                <p {...stylex.props(styles.documentTitle)}>Bracket, rev. 3</p>
                <div {...stylex.props(styles.parties)}>
                  <div>
                    <p {...stylex.props(styles.small)}>Requested by:</p>
                    <p {...stylex.props(styles.faint)}>Claude Code</p>
                    <p {...stylex.props(styles.faint)}>via llms.txt</p>
                  </div>
                  <dl {...stylex.props(styles.details)}>
                    <dt>Issued</dt>
                    <dd>10/04/26</dd>
                    <dt>Lead time</dt>
                    <dd>6 days</dd>
                    <dt>Valid</dt>
                    <dd>30 days</dd>
                  </dl>
                </div>
                <div {...stylex.props(styles.table)}>
                  <span {...stylex.props(styles.columnHead)}>Description</span>
                  <span {...stylex.props(styles.columnHead, styles.end)}>
                    Qty
                  </span>
                  <span {...stylex.props(styles.columnHead, styles.end)}>
                    Amount
                  </span>
                  {LINE_ITEMS.map(([description, quantity, amount]) => (
                    <div key={description} {...stylex.props(styles.row)}>
                      <span>{description}</span>
                      <span {...stylex.props(styles.end, styles.mono)}>
                        {quantity}
                      </span>
                      <span {...stylex.props(styles.end, styles.mono)}>
                        {amount}
                      </span>
                    </div>
                  ))}
                </div>
                <dl {...stylex.props(styles.totals)}>
                  <dt>Subtotal</dt>
                  <dd {...stylex.props(styles.mono)}>$1,183.00</dd>
                  <dt>Total due</dt>
                  <dd {...stylex.props(styles.mono, styles.total)}>
                    $1,183.00
                  </dd>
                </dl>
              </div>
              <div {...stylex.props(styles.card, styles.files)}>
                <p {...stylex.props(styles.cardLabel)}>File received</p>
                <div {...stylex.props(styles.tiles)}>
                  <div {...stylex.props(styles.tile)}>
                    <span {...stylex.props(styles.badge)}>STEP</span>
                    <svg viewBox="0 0 120 72" {...stylex.props(styles.drawing)}>
                      <path d="M16 8h12v44h76v12H16z" />
                      <path
                        d="M8 24h28M72 44v28"
                        {...stylex.props(styles.hidden)}
                      />
                    </svg>
                    <span {...stylex.props(styles.mono)}>bracket-v3</span>
                  </div>
                  <span {...stylex.props(styles.ellipsis)}>···</span>
                  <div {...stylex.props(styles.tile)}>
                    <span {...stylex.props(styles.badge)}>DXF</span>
                    <svg viewBox="0 0 120 72" {...stylex.props(styles.drawing)}>
                      <path d="M10 14h100v44H10z" />
                      <circle cx="27" cy="36" r="5" />
                      <circle cx="77" cy="36" r="5" />
                      <path d="M44 14v44" {...stylex.props(styles.hidden)} />
                    </svg>
                    <span {...stylex.props(styles.mono)}>bracket-v3</span>
                  </div>
                </div>
              </div>
              <div {...stylex.props(styles.card, styles.quote)}>
                <p {...stylex.props(styles.cardLabel)}>
                  Quote ready
                  <span {...stylex.props(styles.dot)} />
                </p>
                <dl {...stylex.props(styles.pairs)}>
                  {QUOTE.map(([term, value]) => (
                    <div
                      key={term}
                      {...stylex.props(
                        styles.pair,
                        term === 'Lead time' && styles.flagged,
                      )}
                    >
                      <dt>{term}</dt>
                      <dd {...stylex.props(styles.mono)}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div {...stylex.props(styles.card, styles.status)}>
                <p {...stylex.props(styles.cardLabel)}>Order status</p>
                <dl {...stylex.props(styles.fields)}>
                  {STATUS.map(([term, value]) => (
                    <div key={term} {...stylex.props(styles.fieldGroup)}>
                      <dt {...stylex.props(styles.small)}>{term}</dt>
                      <dd {...stylex.props(styles.input)}>{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div {...stylex.props(styles.ticker)}>
          <div {...stylex.props(frame.base, styles.tickerRow)}>
            <Marquee label="At a glance">
              {FACTS.map(([label, value]) => (
                <li key={label} {...stylex.props(styles.fact)}>
                  {label}:<span {...stylex.props(tag.chip)}>{value}</span>
                </li>
              ))}
            </Marquee>
          </div>
        </div>
      </div>

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
            Point Claude Code, Codex, or any AI agent at
            neuramance.com/llms.txt. It reads the guide, then drafts an access
            request describing the parts your project needs.
          </p>
          <Link
            href="/llms.txt"
            prefetch={false}
            {...stylex.props(styles.more)}
          >
            Read llms.txt
            <ArrowRight aria-hidden {...stylex.props(button.icon)} />
          </Link>
        </div>
        <div {...stylex.props(styles.prompt)}>
          <div {...stylex.props(styles.promptHead)}>
            <span {...stylex.props(styles.cardLabel)}>Agent prompt</span>
            <CopyButton
              text={AGENT_PROMPT}
              {...stylex.props(button.base, button.light, button.small)}
            >
              <Copy aria-hidden {...stylex.props(button.icon)} />
              Copy agent prompt
            </CopyButton>
          </div>
          <p {...stylex.props(styles.promptText)}>{AGENT_PROMPT}</p>
        </div>
      </section>

      <section
        aria-labelledby="closing-title"
        {...stylex.props(frame.base, styles.closingFrame)}
      >
        <div {...stylex.props(styles.closing)}>
          <h2 id="closing-title" {...stylex.props(styles.closingTitle)}>
            Give your agent hands.
          </h2>
          <p {...stylex.props(styles.lead)}>
            Neuramance is in private beta. Tell us what you&apos;re building.
          </p>
          <div {...stylex.props(styles.actions)}>
            <CopyButton
              text={AGENT_PROMPT}
              {...stylex.props(button.base, button.lime, button.large)}
            >
              Copy agent prompt
            </CopyButton>
            <a
              href={ACCESS_HREF}
              {...stylex.props(button.base, button.light, button.large)}
            >
              Request access
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}

const DOT_GRID =
  'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.16) 1px, transparent 0)';
const HANDLE = `linear-gradient(${colors.foreground}, ${colors.foreground})`;

const styles = stylex.create({
  hero: {
    position: 'relative',
    isolation: 'isolate',
  },
  dots: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1,
    width: '100%',
    height: '100%',
    backgroundImage: DOT_GRID,
    backgroundSize: '18px 18px',
    maskImage: 'linear-gradient(to bottom, black, black 35%, transparent 75%)',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: { default: '3.5rem', [SECTION]: '4.5rem' },
    paddingBottom: { default: '3rem', [SECTION]: '3.5rem' },
  },
  title: {
    marginTop: '1.5rem',
    fontSize: 'clamp(2.5rem, 6vw, 4.75rem)',
    fontWeight: 500,
    lineHeight: 1.02,
    letterSpacing: '-0.032em',
    textWrap: 'balance',
    color: colors.foreground,
  },
  line: {
    display: { default: 'inline', [SECTION]: 'block' },
  },
  lead: {
    marginTop: '1.25rem',
    maxWidth: '62rem',
    fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
    lineHeight: 1.4,
    letterSpacing: '-0.01em',
    color: colors.muted,
  },
  form: {
    display: 'flex',
    flexDirection: { default: 'row', [STACK]: 'column' },
    gap: '0.375rem',
    width: '100%',
    maxWidth: '44rem',
    marginTop: '2rem',
    padding: '0.375rem',
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.14)',
    backgroundColor: 'rgb(255 255 255 / 0.05)',
  },
  field: {
    display: 'flex',
    flexGrow: 1,
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
    minHeight: 56,
    paddingInline: '1.125rem',
    fontFamily: fonts.mono,
    fontSize: 15,
    color: colors.muted,
  },
  fieldIcon: {
    flexShrink: 0,
    width: 18,
    height: 18,
    color: colors.faint,
  },
  fieldText: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    maskImage: 'linear-gradient(to right, black 70%, transparent)',
  },
  submit: {
    borderRadius: 10,
  },
  note: {
    marginTop: '1rem',
    fontSize: 15,
    lineHeight: '1.375rem',
    color: colors.muted,
  },
  showcase: {
    display: 'flex',
    justifyContent: 'center',
    overflow: 'hidden',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.12)',
    backgroundColor: 'rgb(14 14 16 / 0.8)',
    backdropFilter: 'blur(12px)',
    userSelect: 'none',
  },
  stage: {
    position: 'relative',
    flexShrink: 0,
    width: 1000,
    height: 560,
    zoom: {
      default: 0.9,
      '@media (min-width: 48rem)': 0.7,
      [SECTION]: 0.9,
      '@media (min-width: 80rem)': 1.15,
    },
    fontSize: 12,
    lineHeight: '1rem',
    color: colors.foreground,
  },
  document: {
    position: 'absolute',
    top: 44,
    left: 345,
    display: 'flex',
    flexDirection: 'column',
    gap: 22,
    width: 340,
    height: 600,
    padding: 24,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.line,
  },
  documentHead: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  documentTitle: {
    paddingBottom: 16,
    fontSize: 20,
    lineHeight: '1.5rem',
    letterSpacing: '-0.02em',
    borderBottomWidth: 1,
    borderBottomStyle: 'solid',
    borderBottomColor: colors.line,
  },
  parties: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 16,
  },
  details: {
    display: 'grid',
    gridTemplateColumns: 'auto auto',
    columnGap: 16,
    color: colors.faint,
  },
  small: {
    marginBottom: 4,
    fontSize: 11,
    color: colors.muted,
  },
  faint: {
    color: colors.faint,
  },
  table: {
    display: 'grid',
    gridTemplateColumns: '1fr auto 72px',
    columnGap: 16,
  },
  columnHead: {
    paddingBottom: 10,
    fontSize: 11,
    color: colors.faint,
  },
  row: {
    display: 'grid',
    gridColumnStart: 1,
    gridColumnEnd: -1,
    gridTemplateColumns: 'subgrid',
    paddingBlock: 10,
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  end: {
    textAlign: 'end',
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 11,
  },
  totals: {
    display: 'grid',
    gridTemplateColumns: 'auto 88px',
    justifyContent: 'end',
    columnGap: 16,
    rowGap: 6,
    color: colors.muted,
    textAlign: 'end',
  },
  total: {
    fontSize: 13,
    color: colors.foreground,
  },
  card: {
    position: 'absolute',
    display: { default: 'none', '@media (min-width: 48rem)': 'flex' },
    flexDirection: 'column',
    gap: 16,
    padding: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'rgb(255 255 255 / 0.18)',
    '::after': {
      content: '""',
      position: 'absolute',
      top: -3,
      right: -3,
      bottom: -3,
      left: -3,
      pointerEvents: 'none',
      backgroundImage: `${HANDLE}, ${HANDLE}, ${HANDLE}, ${HANDLE}`,
      backgroundPosition: 'top left, top right, bottom left, bottom right',
      backgroundSize: '5px 5px',
      backgroundRepeat: 'no-repeat',
    },
  },
  cardLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    backgroundColor: colors.lime,
  },
  files: {
    top: 68,
    left: 48,
    width: 306,
  },
  tiles: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  tile: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    width: 116,
    padding: 10,
    color: colors.muted,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.line,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingInline: 5,
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.foreground,
    backgroundColor: 'rgb(255 255 255 / 0.08)',
  },
  drawing: {
    width: '100%',
    height: 'auto',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.25,
  },
  hidden: {
    strokeDasharray: '3 3',
    opacity: 0.6,
  },
  ellipsis: {
    color: colors.faint,
  },
  quote: {
    top: 112,
    left: 726,
    width: 226,
  },
  pairs: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  pair: {
    display: 'flex',
    justifyContent: 'space-between',
    color: colors.muted,
  },
  flagged: {
    color: colors.lime,
  },
  status: {
    top: 340,
    left: 612,
    width: 330,
  },
  fields: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    paddingBlock: 9,
    paddingInline: 12,
    color: colors.muted,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: colors.line,
  },
  ticker: {
    position: 'sticky',
    bottom: 0,
    zIndex: 5,
    backgroundColor: 'rgb(5 5 6 / 0.82)',
    backdropFilter: 'blur(16px)',
    borderTopWidth: 1,
    borderTopStyle: 'solid',
    borderTopColor: colors.line,
  },
  tickerRow: {
    display: 'flex',
    alignItems: 'center',
    height: 56,
  },
  fact: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    gap: '0.625rem',
    paddingInline: '1.25rem',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    color: colors.muted,
    borderRightWidth: 1,
    borderRightStyle: 'solid',
    borderRightColor: colors.line,
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3rem',
    paddingBlock: { default: '4rem', [SECTION]: '6rem' },
    scrollMarginTop: 64,
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
