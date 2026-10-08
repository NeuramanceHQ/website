import * as stylex from '@stylexjs/stylex';
import { tag } from '@/components/styles';
import { colors, fonts } from '@/lib/tokens.stylex';

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

export function Showcase() {
  return (
    <div aria-hidden {...stylex.props(styles.showcase)}>
      <div {...stylex.props(styles.stage)}>
        <QuoteDocument />
        <div {...stylex.props(styles.card, styles.files)}>
          <p {...stylex.props(tag.label)}>File received</p>
          <div {...stylex.props(styles.tiles)}>
            <div {...stylex.props(styles.tile)}>
              <span {...stylex.props(styles.badge)}>STEP</span>
              <svg viewBox="0 0 120 72" {...stylex.props(styles.drawing)}>
                <path d="M16 8h12v44h76v12H16z" />
                <path d="M8 24h28M72 44v28" {...stylex.props(styles.hidden)} />
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
          <p {...stylex.props(tag.label)}>
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
          <p {...stylex.props(tag.label)}>Order status</p>
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
  );
}

function QuoteDocument() {
  return (
    <div {...stylex.props(styles.document)}>
      <div {...stylex.props(styles.documentHead)}>
        <span {...stylex.props(tag.label)}>Quote</span>
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
        <span {...stylex.props(styles.columnHead, styles.end)}>Qty</span>
        <span {...stylex.props(styles.columnHead, styles.end)}>Amount</span>
        {LINE_ITEMS.map(([description, quantity, amount]) => (
          <div key={description} {...stylex.props(styles.row)}>
            <span>{description}</span>
            <span {...stylex.props(styles.end, styles.mono)}>{quantity}</span>
            <span {...stylex.props(styles.end, styles.mono)}>{amount}</span>
          </div>
        ))}
      </div>
      <dl {...stylex.props(styles.totals)}>
        <dt>Subtotal</dt>
        <dd {...stylex.props(styles.mono)}>$1,183.00</dd>
        <dt>Total due</dt>
        <dd {...stylex.props(styles.mono, styles.total)}>$1,183.00</dd>
      </dl>
    </div>
  );
}

const HANDLE = `linear-gradient(${colors.foreground}, ${colors.foreground})`;

const styles = stylex.create({
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
});
