import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';
const notionSecret = process.env.NEXT_PUBLIC_NOTION_SECRET;
const notionDatabaseId = process.env.NEXT_PUBLIC_NOTION_DATABASE_ID;

const notion = new Client({ auth: notionSecret });

interface IParams {
  postId?: string;
}

export async function GET(req: NextRequest, { params }: { params: IParams }) {
  if (!notionSecret || !notionDatabaseId)
    throw new Error('Missing notion secret or DB-ID.');

  const { postId } = params;

  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid ID');
  }

  const blockId = postId;
  //'ec001289-dfde-4730-8a02-a7c840afa15c'
  try {
    const { results: blocks } = await notion.blocks.children.list({
      block_id: blockId!,
    });

    return new Response(JSON.stringify(blocks), { status: 200 });
  } catch (error) {
    return NextResponse.error();
  }
}
