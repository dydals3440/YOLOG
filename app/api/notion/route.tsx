import { Client } from '@notionhq/client';
import { NextRequest, NextResponse } from 'next/server';

const notionSecret = process.env.NEXT_PUBLIC_NOTION_SECRET;
const notionDatabaseId = process.env.NEXT_PUBLIC_NOTION_DATABASE_ID;

const notion = new Client({ auth: notionSecret });

type Row = {
  id: string;
  properties: {
    author: {
      id: string;
      type: string;
      people: {
        object: string;
        id: string;
      }[];
    };
    slug: {
      id: string;
      type: string;
      rich_text: {
        text: { content: string };
      }[];
    };
    Date: {
      id: string;
      type: string;
      date: {
        start: string;
        end: string | null;
        time_zone: string | null;
      };
    };
    category: {
      id: string;
      type: string;
      select: {
        id: string;
        name: string;
        color: string;
      };
    };
    updatedAt: {
      id: string;
      type: string;
      last_edited_time: string;
    };
    summary: {
      id: string;
      type: string;
      rich_text: {
        text: { content: string };
      }[];
    };
    title: {
      id: string;
      type: string;
      title: {
        text: { content: string };
      }[];
    };
  };
};

export async function GET(req: NextRequest, res: NextResponse) {
  if (!notionSecret || !notionDatabaseId)
    throw new Error('Missing notion secret or DB-ID.');

  const query = await notion.databases.query({
    database_id: notionDatabaseId,
  });

  // @ts-ignore
  const rows = query.results.map((res) => res) as Row[];

  const rowsStructured = rows.map((row) => ({
    id: row.id,
    title: row.properties.title.title[0].text.content,
    slug: row.properties.slug.rich_text[0].text.content,
    category: row.properties.category.select.name,
    summary: row.properties.summary.rich_text[0].text.content,
    author: row.properties.author.people[0].id,
    updatedAt: row.properties.updatedAt.last_edited_time,
    date: row.properties.Date.date.start,
  }));

  return new Response(JSON.stringify(rowsStructured), { status: 200 });
}
