# Kyntra Life — brand assets

Concept: a high-contrast serif **K** whose hairline arm grows into a terracotta **leaf**.
Palette is taken from the build spec: forest `#30382F`, ivory `#F4F1EA`, terracotta `#C98468`,
sage `#A7AC91`, ink `#292D2A`. All text is outlined to paths, so the SVGs need no fonts.

## Where things go in the Next.js project

| File                          | Destination                                                       |
| ----------------------------- | ----------------------------------------------------------------- |
| `pwa/*.png`                   | `public/icons/`                                                   |
| `manifest.webmanifest`        | `public/manifest.webmanifest`                                     |
| `favicon/favicon.ico`         | `src/app/favicon.ico`                                             |
| `favicon/favicon.svg`         | `src/app/icon.svg` (Next.js picks it up automatically)            |
| `pwa/apple-touch-icon.png`    | `src/app/apple-icon.png`                                          |
| `brand/og-image-1200x630.png` | `src/app/opengraph-image.png`                                     |
| `svg/logo-horizontal*.svg`    | `public/brand/` (site header; use the `-dark` file in dark theme) |
| `svg/logo-primary*.svg`       | `public/brand/` (sign-in screen, README banner)                   |

## Metadata snippet (`src/app/layout.tsx`)

```ts
export const metadata: Metadata = {
  title: "Kyntra Life",
  description: "Your life, collected.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Kyntra Life", statusBarStyle: "default" },
};
export const viewport: Viewport = { themeColor: "#30382F" };
```

## Notes

- `maskable-*.png` keep the mark inside the central safe zone; use them only with `purpose: "maskable"`.
- `apple-touch-icon.png` is full-bleed and opaque, because iOS applies its own rounded mask.
- Favicon uses a bolder, simplified crop so it stays legible at 16px.
- Never reuse the 180px apple icon as an "any" icon; its corners are square.
