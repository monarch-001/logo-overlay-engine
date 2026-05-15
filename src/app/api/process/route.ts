import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const imageFile = formData.get('image') as File;
    const logoFile = formData.get('logo') as File;
    const settingsStr = formData.get('settings') as string;

    if (!imageFile || !logoFile || !settingsStr) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const settings = JSON.parse(settingsStr);
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    const logoBuffer = Buffer.from(await logoFile.arrayBuffer());

    // 1. Get metadata of both images
    const imageMetadata = await sharp(imageBuffer).metadata();
    const logoMetadata = await sharp(logoBuffer).metadata();

    if (!imageMetadata.width || !imageMetadata.height || !logoMetadata.width || !logoMetadata.height) {
      throw new Error('Could not read image metadata');
    }

    // 2. Calculate target logo dimensions based on scale setting
    // scale is percentage of background image width
    const targetWidth = Math.round(imageMetadata.width * settings.scale);
    const targetHeight = Math.round(targetWidth * (logoMetadata.height / logoMetadata.width));

    // 3. Process the logo: Resize, Rotate, and Opacity
    let logoSharp = sharp(logoBuffer)
      .resize(targetWidth, targetHeight);

    if (settings.rotation !== 0) {
      logoSharp = logoSharp.rotate(settings.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
    }

    // To handle opacity, we need to manipulate the alpha channel
    // Sharp's composite doesn't have a direct "opacity" for the whole layer easily without extracting alpha
    // We can use linear to multiply the alpha channel
    if (settings.opacity < 1) {
      logoSharp = logoSharp.ensureAlpha(settings.opacity);
    }

    const processedLogoBuffer = await logoSharp.toBuffer();
    
    // We need processed logo metadata for offset calculations (rotation changes dimensions)
    const processedLogoMetadata = await sharp(processedLogoBuffer).metadata();

    // 4. Calculate coordinates
    // settings.x and settings.y are percentage centers
    const centerX = (settings.x / 100) * imageMetadata.width;
    const centerY = (settings.y / 100) * imageMetadata.height;

    const left = Math.round(centerX - (processedLogoMetadata.width! / 2));
    const top = Math.round(centerY - (processedLogoMetadata.height! / 2));

    // 5. Composite
    const finalImageBuffer = await sharp(imageBuffer)
      .composite([
        {
          input: processedLogoBuffer,
          top: top,
          left: left,
          blend: 'over'
        }
      ])
      .toBuffer();

    return new NextResponse(new Uint8Array(finalImageBuffer), {
      headers: {
        'Content-Type': 'image/png', // Or detect from original
      },
    });

  } catch (error: any) {
    console.error('Processing error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
