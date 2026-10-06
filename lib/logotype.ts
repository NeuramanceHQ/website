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

const CAP_HEIGHT = 700;
const REGISTERED_HEIGHT = 0.4 * CAP_HEIGHT;
const REGISTERED_GAP = 0.12 * CAP_HEIGHT;

const LETTERS = {
  width: 6629,
  path: 'M0 0H122L434 475H436V0H567V700H445L133 226H131V700H0ZM697 0H1203V115H833V292H1174V405H833V585H1203V700H697ZM1303 580V0H1439V533L1490 584H1686L1737 533V0H1873V580L1753 700H1423ZM2553 468V700H2417V499L2357 432H2139V700H2003V0H2442L2549 108V320L2481 389ZM2139 320H2380L2415 285V149L2380 114H2139ZM2874 0H2998L3254 700H3116L3059 545H2813L2756 700H2618ZM3029 433 2936 167H2934L2844 433ZM3324 0H3450L3658 452H3660L3869 0H3995V700H3864V274H3862L3701 602H3617L3457 274H3455V700H3324ZM4321 0H4445L4701 700H4563L4506 545H4260L4203 700H4065ZM4476 433 4383 167H4381L4291 433ZM4771 0H4893L5205 475H5207V0H5338V700H5216L4904 226H4902V700H4771ZM5458 585V115L5573 0H5915L6028 113V220H5892V163L5845 116H5645L5594 167V533L5645 584H5845L5892 537V480H6028V587L5915 700H5573ZM6123 0H6629V115H6259V292H6600V405H6259V585H6629V700H6123Z',
};

const REGISTERED = {
  width: 477,
  height: 467,
  path: 'M0 345V122L122 0H355L477 122V345L355 467H122ZM323 390 393 320V147L323 77H154L84 147V320L154 390ZM145 116H298L340 158V231L315 254L341 282V339H273V297L254 277H213V339H145ZM262 221 274 209V182L262 170H211V221Z',
};

const registeredScale = REGISTERED_HEIGHT / REGISTERED.height;
const registeredX = LETTERS.width + REGISTERED_GAP;

export const REGISTERED_WORDMARK = {
  width: registeredX + REGISTERED.width * registeredScale,
  height: CAP_HEIGHT,
  letters: LETTERS.path,
  registered: REGISTERED.path,
  registeredTransform: `translate(${registeredX} 0) scale(${registeredScale})`,
};
