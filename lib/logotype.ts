type Polygon = readonly (readonly [number, number])[];

const WIDTH = 100;
const HEIGHT = 250;
const BAR = 58;
const STEM = 13;
const GAP = 22;

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const LEFT = rect(0, 0, STEM, HEIGHT);
const RIGHT = rect(WIDTH - STEM, 0, STEM, HEIGHT);

const GLYPHS = {
  N: [
    LEFT,
    RIGHT,
    [
      [0, 0],
      [44, 0],
      [WIDTH, HEIGHT],
      [56, HEIGHT],
    ],
  ],
  E: [
    LEFT,
    rect(0, 0, WIDTH, BAR),
    rect(0, 96, 92, BAR),
    rect(0, 192, WIDTH, BAR),
  ],
  U: [
    rect(0, 0, STEM, 236),
    rect(WIDTH - STEM, 0, STEM, 236),
    [
      [0, 192],
      [WIDTH, 192],
      [WIDTH, 236],
      [86, HEIGHT],
      [14, HEIGHT],
      [0, 236],
    ],
  ],
  R: [
    LEFT,
    [
      [0, 0],
      [78, 0],
      [WIDTH, 22],
      [WIDTH, BAR],
      [0, BAR],
    ],
    rect(WIDTH - STEM, BAR, STEM, 40),
    [
      [0, 96],
      [WIDTH, 96],
      [WIDTH, 132],
      [78, 154],
      [0, 154],
    ],
    [
      [60, 154],
      [80, 154],
      [WIDTH, 186],
      [WIDTH, HEIGHT],
      [WIDTH - STEM, HEIGHT],
      [WIDTH - STEM, 192],
    ],
  ],
  A: [
    [
      [0, 30],
      [30, 0],
      [70, 0],
      [WIDTH, 30],
      [WIDTH, BAR],
      [0, BAR],
    ],
    rect(0, 30, STEM, HEIGHT - 30),
    rect(WIDTH - STEM, 30, STEM, HEIGHT - 30),
    rect(0, 118, WIDTH, BAR),
  ],
  M: [
    LEFT,
    RIGHT,
    [
      [0, 0],
      [34, 0],
      [50, 58],
      [66, 0],
      [WIDTH, 0],
      [50, 170],
    ],
  ],
  C: [
    [
      [22, 0],
      [WIDTH, 0],
      [WIDTH, BAR],
      [0, BAR],
      [0, 22],
    ],
    rect(0, BAR, STEM, 134),
    [
      [0, 192],
      [WIDTH, 192],
      [WIDTH, HEIGHT],
      [22, HEIGHT],
      [0, 228],
    ],
  ],
  T: [
    rect(0, 0, WIDTH, BAR),
    rect((WIDTH - STEM) / 2, BAR, STEM, HEIGHT - BAR),
  ],
  L: [LEFT, rect(0, 192, WIDTH, BAR)],
  H: [LEFT, RIGHT, rect(0, 96, WIDTH, BAR)],
} satisfies Record<string, readonly Polygon[]>;

type Letter = keyof typeof GLYPHS;

const NAME: readonly Letter[] = [
  'N',
  'E',
  'U',
  'R',
  'A',
  'M',
  'A',
  'N',
  'C',
  'E',
];
const DIVISION: readonly Letter[] = [
  'M',
  'E',
  'T',
  'A',
  'L',
  'T',
  'E',
  'C',
  'H',
];
const WORD_GAP = 70;

const span = (word: readonly Letter[]) => word.length * (WIDTH + GAP) - GAP;

const typeset = (word: readonly Letter[], x = 0) =>
  word.map((letter, index) =>
    GLYPHS[letter]
      .map(
        (polygon) =>
          `M${polygon.map(([px, py]) => `${x + index * (WIDTH + GAP) + px} ${py}`).join('L')}Z`,
      )
      .join(''),
  );

export const WORDMARK = {
  width: span(NAME) + WORD_GAP + span(DIVISION),
  height: HEIGHT,
  name: typeset(NAME),
  division: typeset(DIVISION, span(NAME) + WORD_GAP),
};
