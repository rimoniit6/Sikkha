import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const DEFAULT_SEO = {
  title: 'শিক্ষা বাংলা - বাংলাদেশের সেরা শিক্ষা প্ল্যাটফর্ম',
  description:
    'Class 6 থেকে HSC পর্যন্ত সকল বিষয়ের লেকচার, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্ন। বাংলাদেশের সেরা অনলাইন শিক্ষা প্ল্যাটফর্ম।',
  keywords: 'শিক্ষা বাংলা,অনলাইন শিক্ষা,MCQ,বোর্ড প্রশ্ন,HSC,SSC,বাংলাদেশ',
  author: 'শিক্ষা বাংলা',
}

type SeoSettings = typeof DEFAULT_SEO

// Reads SEO settings directly from the database (by key) on every request.
// No caching layer — changes applied via the admin Settings UI are reflected
// immediately, and survive refresh / restart / deployment.
export async function getSeoSettings(): Promise<SeoSettings> {
  try {
    const keys = ['seo_title', 'seo_description', 'seo_keywords', 'seo_author']
    const settings = await db.siteSetting.findMany({
      where: { key: { in: keys } },
      select: { key: true, value: true },
    })
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]))
    return {
      title: map['seo_title'] || DEFAULT_SEO.title,
      description: map['seo_description'] || DEFAULT_SEO.description,
      keywords: map['seo_keywords'] || DEFAULT_SEO.keywords,
      author: map['seo_author'] || DEFAULT_SEO.author,
    }
  } catch {
    return DEFAULT_SEO
  }
}

export function buildMetadata(seo: SeoSettings): Metadata {
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://sikkhabangla.com'),
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords.split(','),
    authors: [{ name: seo.author }],
    icons: { icon: '/api/favicon', apple: '/apple-icon.png' },
    manifest: '/manifest.json',
    appleWebApp: { capable: true, title: 'শিক্ষা বাংলা', statusBarStyle: 'default' },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: '/',
      siteName: 'শিক্ষা বাংলা',
      locale: 'bn_BD',
      type: 'website',
      images: [{ url: '/icon-512.png', width: 512, height: 512 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: seo.title,
      description: seo.description,
      images: ['/icon-512.png'],
    },
    robots: { index: true, follow: true },
    other: {
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  }
}
