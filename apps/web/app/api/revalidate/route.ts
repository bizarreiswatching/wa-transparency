import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (!expectedSecret) {
    return NextResponse.json(
      { error: 'Revalidation not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json(
      { error: 'Invalid authorization' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { path, tag, type } = body;

    if (type === 'path' && path) {
      revalidatePath(path);
      return NextResponse.json({ revalidated: true, path });
    }

    if (type === 'tag' && tag) {
      revalidateTag(tag);
      return NextResponse.json({ revalidated: true, tag });
    }

    // Default: revalidate all main pages
    revalidatePath('/');
    revalidatePath('/search');
    revalidatePath('/activity');
    revalidatePath('/lists/top-donors');
    revalidatePath('/lists/top-recipients');
    revalidatePath('/lists/top-contractors');
    revalidatePath('/lists/top-lobbyists');

    return NextResponse.json({ revalidated: true, all: true });
  } catch (error) {
    console.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
