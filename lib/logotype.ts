type Polygon = readonly (readonly [number, number])[];

const HEIGHT = 596;
const GAP = 56;

const rect = (x: number, y: number, w: number, h: number): Polygon => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];

const GLYPHS = {
  N: {
    width: 296,
    shapes: [
      rect(0, 0, 46, 596),
      rect(250, 0, 46, 596),
      [
        [46, 0],
        [250, 447],
        [250, 596],
        [46, 149],
      ],
    ],
  },
  E: {
    width: 296,
    shapes: [
      rect(0, 0, 46, 596),
      rect(0, 0, 288, 132),
      rect(0, 225, 234, 131),
      rect(0, 464, 296, 132),
    ],
  },
  U: {
    width: 296,
    shapes: [
      rect(0, 0, 46, 402),
      rect(250, 0, 46, 402),
      [
        [0, 402],
        [46, 402],
        [80, 464],
        [216, 464],
        [250, 402],
        [296, 402],
        [296, 510],
        [232, 596],
        [64, 596],
        [0, 510],
      ],
    ],
  },
  R: {
    width: 288,
    shapes: [
      rect(0, 0, 46, 596),
      [
        [0, 0],
        [224, 0],
        [288, 86],
        [288, 202],
        [242, 202],
        [242, 196],
        [208, 134],
        [0, 134],
      ],
      [
        [0, 270],
        [208, 270],
        [242, 208],
        [242, 202],
        [288, 202],
        [288, 306],
        [254, 352],
        [288, 414],
        [288, 596],
        [242, 596],
        [242, 452],
        [207, 402],
        [0, 402],
      ],
    ],
  },
  A: {
    width: 296,
    shapes: [
      [
        [128, 0],
        [168, 0],
        [241, 119],
        [55, 119],
      ],
      [
        [55, 119],
        [128, 119],
        [46, 254],
        [46, 596],
        [0, 596],
        [0, 210],
      ],
      [
        [168, 119],
        [241, 119],
        [296, 210],
        [296, 596],
        [250, 596],
        [250, 254],
      ],
      rect(0, 339, 296, 133),
    ],
  },
  M: {
    width: 348,
    shapes: [
      rect(0, 0, 46, 596),
      rect(302, 0, 46, 596),
      [
        [46, 80],
        [154, 300],
        [194, 300],
        [302, 80],
        [302, 221],
        [194, 441],
        [154, 441],
        [46, 221],
      ],
    ],
  },
  C: {
    width: 296,
    shapes: [
      rect(0, 86, 46, 424),
      [
        [64, 0],
        [296, 0],
        [296, 132],
        [80, 132],
        [46, 194],
        [0, 194],
        [0, 86],
      ],
      [
        [0, 402],
        [46, 402],
        [80, 464],
        [296, 464],
        [296, 596],
        [64, 596],
        [0, 510],
      ],
    ],
  },
} satisfies Record<string, { width: number; shapes: readonly Polygon[] }>;

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

const typeset = NAME.reduce(
  ({ x, path }, letter) => ({
    x: x + GLYPHS[letter].width + GAP,
    path:
      path +
      GLYPHS[letter].shapes
        .map(
          (polygon) =>
            `M${polygon.map(([px, py]) => `${x + px} ${py}`).join('L')}Z`,
        )
        .join(''),
  }),
  { x: 0, path: '' },
);

export const WORDMARK = {
  width: typeset.x - GAP,
  height: HEIGHT,
  path: typeset.path,
};
