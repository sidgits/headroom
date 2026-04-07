

# Headroom Logo Creation

Generate a professional logo PNG for "Headroom" with tagline "Make room for your best work!" using the brand colors (#2D6A4F, #E8F5F0, #1B4332).

## Approach

- Use Python (Pillow) to create a clean, modern logo on transparent background
- **Font**: Outfit Bold for "HEADROOM" wordmark (clean, geometric sans-serif that fits the premium minimal aesthetic), Outfit Regular for the tagline
- **Design**: Wordmark style with a subtle visual element — the "O" in HEADROOM replaced or accented with a circular "headroom" gauge/arc motif in the brand green, suggesting mental capacity
- **Colors**: #2D6A4F primary text, tagline in lighter #1B4332
- **Output**: PNG at multiple sizes (logo.png for web use at 800px wide, favicon-size at 192px)
- Place final files in `public/` directory for use in the app

## Steps

1. Copy Outfit-Bold.ttf and Outfit-Regular.ttf from skill fonts
2. Write Python script to render the logo with Pillow:
   - "HEADROOM" in Outfit Bold, tracked out slightly
   - Tagline "Make room for your best work!" below in lighter weight
   - Subtle arc/semicircle above or integrated into the wordmark as a "headroom" visual metaphor
3. Generate PNG at 800px wide (transparent bg) → `public/headroom-logo.png`
4. Generate a compact icon version (just the arc + H mark) at 192x192 → `public/favicon.png`
5. Update `index.html` to use the new favicon
6. QA: inspect the output images for quality

