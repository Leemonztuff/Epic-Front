import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ error: 'Storage not configured (missing SUPABASE_SERVICE_ROLE_KEY)' }, { status: 500 });
    }

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

    const bytes = await typedFile.arrayBuffer();
    const { data, error } = await supabase.storage
      .from('sprites')
      .upload(sanitized, Buffer.from(bytes), {
        contentType: typedFile.type,
        upsert: true,
      });

    if (error) {
      return NextResponse.json({ error: `Storage error: ${error.message}` }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage.from('sprites').getPublicUrl(sanitized);

    return NextResponse.json({
      success: true,
      filename: sanitized,
      path: publicUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    console.error('Upload error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
