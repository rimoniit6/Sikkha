import { db } from '@/lib/db'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export async function GET() {
  try {
    const posts = await db.blogPost.findMany({
      where: { status: 'PUBLISHED', isActive: true, deletedAt: null, publishedAt: { lte: new Date() } },
      include: {
        author: { select: { id: true, name: true } },
        category: { select: { id: true, name: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    })

    const items = posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/blog/${post.slug}</guid>
      <description>${escapeXml(post.excerpt || post.title)}</description>
      <pubDate>${post.publishedAt ? new Date(post.publishedAt).toUTCString() : ''}</pubDate>
      ${post.author?.name ? `<author>${escapeXml(post.author.name)}</author>` : ''}
      ${post.category?.name ? `<category>${escapeXml(post.category.name)}</category>` : ''}
    </item>`
      )
      .join('\n')

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>শিক্ষা বাংলা ব্লগ</title>
    <link>${siteUrl}/blog</link>
    <description>শিক্ষা টিপস, গাইড ও আপডেট — শিক্ষা বাংলা ব্লগ</description>
    <language>bn</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    return new Response('<rss version="2.0"><channel><title>শিক্ষা বাংলা ব্লগ</title></channel></rss>', {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    })
  }
}
