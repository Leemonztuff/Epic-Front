import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const SPRITES_DIR = path.join(process.cwd(), 'public', 'assets', 'sprites');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const typedFile = file as File;

    if (!ALLOWED_TYPES.includes(typedFile.type)) {
      return NextResponse.json({ error: `Invalid type: ${typedFile.type}. Allowed: PNG, JPEG, GIF, WebP` }, { status: 400 });
    }

    if (typedFile.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (${(typedFile.size / 1024 / 1024).toFixed(1)}MB). Max 5MB` }, { status: 400 });
    }

    const filenameEntry = formData.get('filename');
    const rawName = typeof filenameEntry === 'string' ? filenameEntry : typedFile.name;
    const sanitized = rawName.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    const filepath = path.join(SPRITES_DIR, sanitized);

    await mkdir(SPRITES_DIR, { recursive: true });

    const bytes = await typedFile.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      filename: sanitized,
      path: `/assets/sprites/${sanitized}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
