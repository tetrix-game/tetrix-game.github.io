import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SOURCE_ICON = path.join(__dirname, 'public/favicon.svg');
const SOCIAL_PREVIEW_SOURCE = path.join(__dirname, 'public/social-preview.svg');
const OUTPUT_DIR = path.join(__dirname, 'public/icons');
const SOCIAL_PREVIEW_OUTPUT = path.join(__dirname, 'public/social-preview.png');

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log(`Generating icons from ${SOURCE_ICON}...`);

  // Generate icons
  for (const size of SIZES) {
    try {
      await sharp(SOURCE_ICON)
        .resize(size, size)
        .png()
        .toFile(path.join(OUTPUT_DIR, `icon-${size}x${size}.png`));
      console.log(`✅ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Error generating ${size}x${size} icon:`, error);
    }
  }

  // Generate social preview
  console.log(`Generating social preview from ${SOCIAL_PREVIEW_SOURCE}...`);
  try {
    await sharp(SOCIAL_PREVIEW_SOURCE)
      .png()
      .toFile(SOCIAL_PREVIEW_OUTPUT);
    console.log(`✅ Generated social preview image`);
  } catch (error) {
    console.error(`❌ Error generating social preview:`, error);
  }
  
  console.log('Icon generation complete!');
}

generateIcons().catch(console.error);
