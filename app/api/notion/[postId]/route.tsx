import { NextRequest } from 'next/server';

const { Client } = require('@notionhq/client');
const { NotionToMarkdown } = require('notion-to-md');
const notionSecret = process.env.NEXT_PUBLIC_NOTION_SECRET;

const notion = new Client({ auth: notionSecret });

const n2m = new NotionToMarkdown({
  notionClient: notion,
  config: {
    separateChildPage: true,
  },
});

interface IParams {
  postId?: string;
}

export async function GET(req: NextRequest, { params }: { params: IParams }) {
  if (!notionSecret) throw new Error('Missing Notion Secret');

  const { postId } = params;
  const mdblocks = await n2m.pageToMarkdown(postId);
  const mdString = n2m.toMarkdownString(mdblocks);

  return new Response(JSON.stringify(mdString), { status: 200 });
}
