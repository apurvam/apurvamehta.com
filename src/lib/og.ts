import satori from 'satori';
import sharp from 'sharp';
import { generateEndMark } from './endmark';

const FONT_URL = 'https://fonts.gstatic.com/s/crimsonpro/v28/q5uUsoa5M_tv7IihmnkabC5XiXCAlXGks1WZzm18OA.ttf';
const FONT_URL_ITALIC = 'https://fonts.gstatic.com/s/crimsonpro/v28/q5uSsoa5M_tv7IihmnkabAReu49Y_Bo-HVKMBi6Ue5s7.ttf';

let fontRegular: ArrayBuffer | null = null;
let fontItalic: ArrayBuffer | null = null;

async function loadFonts() {
  if (!fontRegular) {
    const [reg, ital] = await Promise.all([
      fetch(FONT_URL).then((r) => r.arrayBuffer()),
      fetch(FONT_URL_ITALIC).then((r) => r.arrayBuffer()),
    ]);
    fontRegular = reg;
    fontItalic = ital;
  }
  return { fontRegular, fontItalic: fontItalic! };
}

async function renderEndMarkPng(slug: string): Promise<Buffer> {
  const svgStr = generateEndMark(slug);
  // Scale up for OG image (2x)
  const scaled = svgStr
    .replace('width="64"', 'width="128"')
    .replace('height="80"', 'height="160"')
    .replace('stroke-width="1.3"', 'stroke-width="1.8"');
  return await sharp(Buffer.from(scaled)).png().toBuffer();
}

export async function generateOgImage(options: {
  title: string;
  subtitle?: string;
  slug?: string;
}): Promise<Buffer> {
  const { fontRegular, fontItalic } = await loadFonts();

  const svg = await satori(
    {
      type: 'div',
      props: {
        style: {
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#fffff8',
          padding: '80px',
          fontFamily: 'Crimson Pro',
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 64,
                      color: '#111',
                      lineHeight: 1.15,
                    },
                    children: options.title,
                  },
                },
                ...(options.subtitle
                  ? [
                      {
                        type: 'div',
                        props: {
                          style: {
                            fontSize: 28,
                            color: '#999',
                            marginTop: 20,
                            fontStyle: 'italic' as const,
                          },
                          children: options.subtitle,
                        },
                      },
                    ]
                  : []),
              ],
            },
          },
          {
            type: 'div',
            props: {
              style: {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
              },
              children: [
                {
                  type: 'div',
                  props: {
                    style: { fontSize: 22, color: '#999' },
                    children: 'apurvamehta.com',
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Crimson Pro', data: fontRegular, weight: 400, style: 'normal' },
        { name: 'Crimson Pro', data: fontItalic, weight: 400, style: 'italic' },
      ],
    },
  );

  const W = 1200;
  const H = 630;

  // Radial gradient vignette — darker/warmer at edges, lighter center
  const vignette = Buffer.alloc(W * H * 4);
  const cx = W / 2;
  const cy = H / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const dx = (x - cx) / cx;
      const dy = (y - cy) / cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const strength = Math.pow(dist, 1.8) * 0.12;
      const off = (y * W + x) * 4;
      vignette[off] = 180;     // warm cream tint
      vignette[off + 1] = 170;
      vignette[off + 2] = 140;
      vignette[off + 3] = Math.min(255, Math.floor(strength * 255));
    }
  }
  const vignetteLayer = await sharp(vignette, { raw: { width: W, height: H, channels: 4 } })
    .png()
    .toBuffer();

  const layers: sharp.OverlayOptions[] = [
    { input: vignetteLayer, blend: 'over' as const },
  ];

  // Composite the end mark illustration in the top-right if slug is provided
  if (options.slug) {
    const markPng = await renderEndMarkPng(options.slug);
    layers.push({ input: markPng, top: 60, left: W - 128 - 60, blend: 'over' as const });
  }

  return await sharp(Buffer.from(svg)).composite(layers).png().toBuffer();
}
