import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter, BN } from './00-helpers'

const BLOG_POSTS = [
  {
    title: 'এসএসসি পরীক্ষার প্রস্তুতি: সম্পূর্ণ গাইড',
    slug: 'ssc-exam-preparation-guide',
    excerpt: 'এসএসসি পরীক্ষার প্রস্তুতির জন্য সম্পূর্ণ গাইড। কীভাবে পড়বে, কী কী বিষয়ে ফোকাস করবে এবং টাইম ম্যানেজমেন্ট টিপস।',
    content: '<h2>এসএসসি পরীক্ষার প্রস্তুতি</h2><p>এসএসসি পরীক্ষা প্রতিটি শিক্ষার্থীর জীবনে একটি গুরুত্বপূর্ণ মাইলফলক। সঠিক প্রস্তুতি ও পরিকল্পনার মাধ্যমে এই পরীক্ষায় ভালো ফল করা সম্ভব।</p><h3>পড়াশোনার পরিকল্পনা</h3><p>প্রথমে একটি রুটিন তৈরি করো। প্রতিদিন অন্তত ৬-৮ ঘণ্টা পড়ার সময় রাখো। কঠিন বিষয়গুলো সকালে পড়ার চেষ্টা করো যখন মস্তিষ্ক সবচেয়ে সক্রিয় থাকে।</p><h3>বিষয়ভিত্তিক প্রস্তুতি</h3><p>প্রত্যেক বিষয়ের জন্য আলাদা কৌশল নিতে হবে। গণিতের জন্য বেশি অনুশীলন, বাংলার জন্য বেশি পড়া, এবং বিজ্ঞানের জন্য বুঝে পড়া জরুরি।</p><h3>টাইম ম্যানেজমেন্ট</h3><p>পরীক্ষার হলে সময় ব্যবস্থাপনা খুবই গুরুত্বপূর্ণ। প্রথমে সহজ প্রশ্নগুলোর উত্তর দাও, তারপর কঠিন প্রশ্নে যাও।</p>',
    categorySlug: 'exam-preparation',
    tags: ['ssc', 'tips', 'exam-routine'],
    status: 'PUBLISHED',
    isFeatured: true,
    seriesSlug: 'ssc-preparation-series',
  },
  {
    title: 'পদার্থবিজ্ঞানের গুরুত্বপূর্ণ সূত্র ও তাদের ব্যবহার',
    slug: 'important-physics-formulas',
    excerpt: 'পদার্থবিজ্ঞানের সকল গুরুত্বপূর্ণ সূত্র একসাথে। প্রতিটি সূত্রের ব্যাখ্যা ও ব্যবহারিক উদাহরণ।',
    content: '<h2>পদার্থবিজ্ঞানের সূত্রসমূহ</h2><p>পদার্থবিজ্ঞানের সূত্রগুলো মুখস্থ না করে বুঝতে হবে। তাহলে যেকোনো সমস্যা সমাধান করা সহজ হবে।</p><h3>গতির সূত্র</h3><p>v = u + at, s = ut + ½at², v² = u² + 2as — এই তিনটি সূত্র গতির সব সমস্যা সমাধানের জন্য যথেষ্ট।</p><h3>বলের সূত্র</h3><p>নিউটনের তিনটি সূত্র: (১) জড়তার সূত্র, (২) F = ma, (৩) ক্রিয়া-প্রতিক্রিয়া সূত্র।</p><h3>শক্তির সূত্র</h3><p>কাজ = বল × সরণ, শক্তি = কাজ করার ক্ষমতা, ক্ষমতা = কাজ/সময়।</p>',
    categorySlug: 'subject-guide',
    tags: ['physics', 'ssc', 'hsc', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'বাংলা ব্যাকরণ: সহজেই শিখুন',
    slug: 'bangla-grammar-made-easy',
    excerpt: 'বাংলা ব্যাকরণের জটিল বিষয়গুলো সহজভাবে শিখুন। ধ্বনি, শব্দ, বাক্য ও বিরাম চিহ্নের ব্যবহার।',
    content: '<h2>বাংলা ব্যাকরণ</h2><p>বাংলা ব্যাকরণ শেখা অনেকের কাছেই কঠিন মনে হয়। কিন্তু সহজভাবে বুঝলে এটি খুবই মজার একটি বিষয়।</p><h3>ধ্বনি ও বর্ণ</h3><p>বাংলা বর্ণমালায় মোট ৫০টি বর্ণ আছে। এর মধ্যে ১১টি স্বরবর্ণ ও ৩৯টি ব্যঞ্জনবর্ণ।</p><h3>শব্দের শ্রেণীবিভাগ</h3><p>শব্দ প্রধানত দুই প্রকার: মৌলিক শব্দ ও সাধিত শব্দ। অর্থ ও গঠন অনুযায়ী আরও বিভিন্ন ভাগে ভাগ করা যায়।</p><h3>বাক্য</h3><p>বাক্য তিন প্রকার: সরল বাক্য, জটিল বাক্য ও যৌগিক বাক্য।</p>',
    categorySlug: 'subject-guide',
    tags: ['bangla', 'ssc', 'hsc', 'tips', 'notes'],
    status: 'PUBLISHED',
    isFeatured: true,
  },
  {
    title: 'গণিতের সেরা টিপস ও ট্রিকস',
    slug: 'math-tips-and-tricks',
    excerpt: 'গণিতের জটিল সমস্যা সমাধানের জন্য সেরা টিপস ও ট্রিকস। শর্টকাট পদ্ধতি ও সহজ সমাধান।',
    content: '<h2>গণিত টিপস</h2><p>গণিত ভয়ের বিষয় নয়, এটি মজার একটি বিষয়। কিছু টিপস ও ট্রিকস জানলে গণিত অনেক সহজ হয়ে যায়।</p><h3>শর্টকাট পদ্ধতি</h3><p>বর্গ ও বর্গমূল, লসাগু ও গসাগু, শতকরা ও অনুপাত — এই টপিকগুলোর জন্য শর্টকাট পদ্ধতি জানা জরুরি।</p><h3>অনুশীলনের গুরুত্ব</h3><p>প্রতিদিন অন্তত ২০টি গণিতের সমস্যা সমাধানের চেষ্টা করো। ধীরে ধীরে কঠিন সমস্যায় যাও।</p>',
    categorySlug: 'subject-guide',
    tags: ['math', 'ssc', 'hsc', 'tips', 'notes'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'বিজ্ঞান বিভাগ: কোন সাবজেক্টগুলো আছে ও ক্যারিয়ার অপশন',
    slug: 'science-subjects-and-careers',
    excerpt: 'বিজ্ঞান বিভাগে কী কী সাবজেক্ট আছে, কীভাবে পড়তে হবে এবং ক্যারিয়ারের কোন পথ খোলা থাকে।',
    content: '<h2>বিজ্ঞান বিভাগ</h2><p>বিজ্ঞান বিভাগে পদার্থবিজ্ঞান, রসায়ন, জীববিজ্ঞান ও গণিত — এই চারটি মূল বিষয় থাকে। এছাড়া বাংলা, ইংরেজি ও তথ্য ও যোগাযোগ প্রযুক্তি আবশ্যিক।</p><h3>ভবিষ্যৎ ক্যারিয়ার</h3><p>বিজ্ঞান বিভাগ থেকে ইঞ্জিনিয়ারিং, মেডিকেল, গবেষণা — সব পথই খোলা। পদার্থ ও গণিতে ভালো করলে ইঞ্জিনিয়ারিং, জীববিজ্ঞানে ভালো করলে মেডিকেলের পথ সহজ।</p>',
    categorySlug: 'career-guidance',
    tags: ['science', 'career', 'ssc', 'hsc'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'এইচএসসি পরীক্ষার রুটিন ও প্রস্তুতি',
    slug: 'hsc-exam-routine-preparation',
    excerpt: 'এইচএসসি পরীক্ষার রুটিন অনুযায়ী প্রস্তুতি নেওয়ার কৌশল। প্রতিটি বিষয়ের জন্য আলাদা পরিকল্পনা।',
    content: '<h2>এইচএসসি প্রস্তুতি</h2><p>এইচএসসি পরীক্ষা জীবনের একটি গুরুত্বপূর্ণ মোড়। সঠিক পরিকল্পনা ও কঠোর পরিশ্রমের মাধ্যমে সাফল্য অর্জন করা যায়।</p><h3>বিষয়ভিত্তিক প্রস্তুতি</h3><p>প্রত্যেক বিষয়ের সিলেবাস ভালোভাবে বুঝে নাও। তারপর প্রতিটি টপিকের জন্য আলাদা নোট তৈরি করো।</p><h3>পূর্বের প্রশ্ন বিশ্লেষণ</h3><p>গত ৫ বছরের প্রশ্নপত্র সংগ্রহ করে সেগুলো সমাধান করো। এতে পরীক্ষার প্যাটার্ন সম্পর্কে ধারণা হবে।</p>',
    categorySlug: 'exam-preparation',
    tags: ['hsc', 'exam-routine', 'tips'],
    status: 'PUBLISHED',
    isFeatured: true,
    seriesSlug: 'hsc-preparation-series',
  },
  {
    title: 'ভর্তি পরীক্ষার প্রস্তুতি: মেডিকেল',
    slug: 'medical-admission-preparation',
    excerpt: 'মেডিকেল ভর্তি পরীক্ষার জন্য সম্পূর্ণ গাইড। কীভাবে পড়বে, কী কী বই পড়বে এবং টাইম ম্যানেজমেন্ট।',
    content: '<h2>মেডিকেল ভর্তি পরীক্ষা</h2><p>মেডিকেল ভর্তি পরীক্ষা বাংলাদেশের সবচেয়ে প্রতিযোগিতামূলক পরীক্ষাগুলোর একটি। সঠিক প্রস্তুতি ছাড়া সফল হওয়া কঠিন।</p><h3>গুরুত্বপূর্ণ বিষয়</h3><p>জীববিজ্ঞান, রসায়ন ও পদার্থবিজ্ঞান — এই তিনটি বিষয়ের উপর সবচেয়ে বেশি জোর দিতে হবে। প্রতিটি টপিক ভালোভাবে বুঝতে হবে।</p>',
    categorySlug: 'admission-test',
    tags: ['medical', 'admission', 'hsc', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'ভর্তি পরীক্ষার প্রস্তুতি: ইঞ্জিনিয়ারিং',
    slug: 'engineering-admission-preparation',
    excerpt: 'ইঞ্জিনিয়ারিং ভর্তি পরীক্ষার জন্য সম্পূর্ণ গাইড। গণিত, পদার্থ ও রসায়নের প্রস্তুতি।',
    content: '<h2>ইঞ্জিনিয়ারিং ভর্তি পরীক্ষা</h2><p>ইঞ্জিনিয়ারিং ভর্তি পরীক্ষায় গণিত, পদার্থবিজ্ঞান ও রসায়ন — এই তিন বিষয়ের উপর প্রশ্ন হয়। প্রতিটি বিষয়ের জন্য আলাদা কৌশল নিতে হবে।</p><h3>গণিত</h3><p>ক্যালকুলাস, বীজগণিত, জ্যামিতি ও ত্রিকোণমিতি — এই টপিকগুলোর উপর বেশি জোর দাও। শর্টকাট ফর্মুলা মনে রাখো।</p>',
    categorySlug: 'admission-test',
    tags: ['engineering', 'admission', 'hsc', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'ডিজিটাল বাংলাদেশ ও শিক্ষার আধুনিকায়ন',
    slug: 'digital-bangladesh-modern-education',
    excerpt: 'ডিজিটাল বাংলাদেশের লক্ষ্য অর্জনে শিক্ষার আধুনিকায়নের ভূমিকা ও গুরুত্ব।',
    content: '<h2>ডিজিটাল বাংলাদেশ</h2><p>ডিজিটাল বাংলাদেশ গড়ার লক্ষ্যে শিক্ষাখাতে ব্যাপক পরিবর্তন আনা হচ্ছে। অনলাইন শিক্ষা, ডিজিটাল কন্টেন্ট ও ই-লার্নিং প্ল্যাটফর্ম এর মাধ্যমে শিক্ষা এখন সবার জন্য সহজলভ্য।</p><h3>অনলাইন শিক্ষার সুবিধা</h3><p>শিক্ষার্থীরা এখন ঘরে বসেই বিশ্বমানের শিক্ষা গ্রহণ করতে পারছে। ভিডিও লেকচার, অনলাইন টেস্ট ও ডিজিটাল বই এর মাধ্যমে শিক্ষা আরও কার্যকর হচ্ছে।</p>',
    categorySlug: 'general',
    tags: ['digital-bangladesh', 'education', 'edtech', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'পরীক্ষার আগের রাতে করণীয়',
    slug: 'night-before-exam-tips',
    excerpt: 'পরীক্ষার আগের রাতে কী করবে, কী করবে না — সেই বিষয়ে গুরুত্বপূর্ণ টিপস।',
    content: '<h2>পরীক্ষার আগের রাত</h2><p>পরীক্ষার আগের রাতটা খুবই গুরুত্বপূর্ণ। এই রাতে সঠিক কাজগুলো করলে পরীক্ষায় ভালো করা সম্ভব।</p><h3>কী করবে</h3><p>হালকা রিভিশন নাও, পর্যাপ্ত ঘুমাও, আগের দিনের সব প্রস্তুতি আগেই শেষ করো। নতুন কিছু পড়তে যেও না।</p><h3>কী করবে না</h3><p>রাত জেগে পড়ো না, টেনশন করো না, অস্বাস্থ্যকর খাবার খেও না। আত্মবিশ্বাস রাখো।</p>',
    categorySlug: 'exam-preparation',
    tags: ['tips', 'exam-routine', 'ssc', 'hsc'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'নোট তৈরি করার সঠিক পদ্ধতি',
    slug: 'effective-note-making',
    excerpt: 'কার্যকর নোট তৈরি করার পদ্ধতি ও কৌশল। কীভাবে সহজে মনে রাখার মতো নোট তৈরি করবে।',
    content: '<h2>নোট তৈরি</h2><p>ভালো নোট তৈরি করা শিক্ষার একটি গুরুত্বপূর্ণ অংশ। সঠিক পদ্ধতিতে নোট তৈরি করলে পড়া মনে রাখা সহজ হয়।</p><h3>পদ্ধতি</h3><p>প্রথমে টপিকটি ভালোভাবে বুঝে নাও। তারপর গুরুত্বপূর্ণ পয়েন্টগুলো নিজের ভাষায় লেখো। ডায়াগ্রাম ও ফ্লোচার্ট ব্যবহার করো। মাইন্ড ম্যাপ তৈরি করো।</p>',
    categorySlug: 'study-tips',
    tags: ['notes', 'tips', 'study-method', 'ssc', 'hsc'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'বাংলাদেশের শিক্ষাব্যবস্থার ইতিহাস ও বিবর্তন',
    slug: 'bangladesh-education-system-history',
    excerpt: 'বাংলাদেশের শিক্ষাব্যবস্থার ইতিহাস, বিভিন্ন শিক্ষা কমিশনের সুপারিশ ও বর্তমান কাঠামো।',
    content: '<h2>শিক্ষাব্যবস্থার ইতিহাস</h2><p>বাংলাদেশের শিক্ষাব্যবস্থা দীর্ঘ ইতিহাসের মধ্য দিয়ে বিবর্তিত হয়েছে। ১৯৭২ সালের কুদরত-এ-খুদা শিক্ষা কমিশন থেকে শুরু করে বর্তমান জাতীয় শিক্ষাক্রম ২০২৩ পর্যন্ত বহু পরিবর্তন এসেছে।</p><h3>বর্তমান কাঠামো</h3><p>প্রাথমিক (১ম-৫ম), নিম্ন-মাধ্যমিক (৬ষ্ঠ-৮ম), মাধ্যমিক (৯ম-১০ম), উচ্চ মাধ্যমিক (১১শ-১২শ) ও উচ্চশিক্ষা — এই স্তরগুলো নিয়ে বর্তমান শিক্ষাব্যবস্থা গঠিত।</p>',
    categorySlug: 'general',
    tags: ['education', 'history', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'শিক্ষাক্রম ২০২৩: নতুন কী হচ্ছে?',
    slug: 'curriculum-2023-changes',
    excerpt: 'জাতীয় শিক্ষাক্রম ২০২৩-এ কী কী পরিবর্তন আসছে, নতুন মূল্যায়ন পদ্ধতি ও শিক্ষার্থীদের জন্য করণীয়।',
    content: '<h2>শিক্ষাক্রম ২০২৩</h2><p>জাতীয় শিক্ষাক্রম ২০২৩-এ শিক্ষার্থীদের মূল্যায়নের পদ্ধতি সম্পূর্ণ বদলে যাচ্ছে। শিখনফলের উপর বেশি জোর দেওয়া হচ্ছে।</p><h3>মূল্যায়ন পদ্ধতি</h3><p>শুধু পরীক্ষার মাধ্যমে নয়, সারাবছর ধরে বিভিন্ন কার্যক্রমের মাধ্যমে শিক্ষার্থীদের মূল্যায়ন করা হবে। যোগ্যতাভিত্তিক শিক্ষার উপর জোর দেওয়া হচ্ছে।</p>',
    categorySlug: 'general',
    tags: ['curriculum-2023', 'education', 'tips', 'notes'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
  {
    title: 'অনার্স ও মাস্টার্স: সঠিক বিষয় নির্বাচন',
    slug: 'honors-masters-subject-selection',
    excerpt: 'অনার্স ও মাস্টার্সে কোন বিষয় নেবে? সঠিক সিদ্ধান্ত নেওয়ার জন্য গাইডলাইন।',
    content: '<h2>বিষয় নির্বাচন</h2><p>অনার্স ও মাস্টার্সে সঠিক বিষয় নির্বাচন করা ক্যারিয়ারের জন্য খুবই গুরুত্বপূর্ণ। নিজের আগ্রহ, দক্ষতা ও চাকরির বাজার — এই তিনটি বিষয় মাথায় রেখে সিদ্ধান্ত নিতে হবে।</p><h3>ক্যারিয়ার সম্ভাবনা</h3><p>বিজ্ঞান, মানবিক ও বাণিজ্য — প্রতিটি বিভাগের জন্যই চাকরির বাজারে ভালো সুযোগ আছে। সঠিক পরিকল্পনা ও প্রস্তুতি থাকলেই সাফল্য সম্ভব।</p>',
    categorySlug: 'career-guidance',
    tags: ['admission', 'career', 'university', 'tips'],
    status: 'PUBLISHED',
    isFeatured: false,
  },
]

export async function seedBlogPosts(db: PrismaClient) {
  let count = 0

  const author = await db.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] }, isVerified: true },
    orderBy: { createdAt: 'asc' },
  })
  const authorId = author?.id ?? 'unknown'

  for (const post of BLOG_POSTS) {
    const existing = await db.blogPost.findUnique({ where: { slug: post.slug } })
    if (existing) continue

    const category = post.categorySlug
      ? await db.blogCategory.findUnique({ where: { slug: post.categorySlug } })
      : null

    let series = null
    if (post.seriesSlug) {
      series = await db.blogSeries.findUnique({ where: { slug: post.seriesSlug } })
    }

    const tagRecords: { id: string }[] = []
    for (const tagSlug of post.tags) {
      let tag = await db.blogTag.findUnique({ where: { slug: tagSlug } })
      if (!tag) {
        const name = tagSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
        tag = await db.blogTag.upsert({
          where: { slug: tagSlug },
          update: {},
          create: { name, slug: tagSlug },
        })
      }
      tagRecords.push(tag)
    }

    await db.blogPost.create({
      data: {
        id: `bp_${post.slug}`,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        isFeatured: post.isFeatured,
        isActive: true,
        publishedAt: new Date(),
        readingTime: Math.max(1, Math.round(post.content.split(/\s+/).length / 200)),
        authorId,
        categoryId: category?.id ?? null,
        seriesId: series?.id ?? null,
        tags: {
          create: tagRecords.map(t => ({ tagId: t.id })),
        },
      },
    })
    count++
  }
  console.log(`  ✅ ${count} blog posts seeded`)

  // BlogRelatedPost — link related posts together
  const publishedPosts = await db.blogPost.findMany({
    where: { status: 'PUBLISHED', isActive: true, deletedAt: null },
    orderBy: { publishedAt: 'asc' },
    take: 10,
  })
  let relatedCount = 0
  for (let i = 0; i < publishedPosts.length; i++) {
    for (let j = i + 1; j < Math.min(i + 4, publishedPosts.length); j++) {
      const existing = await db.blogRelatedPost.findUnique({
        where: { postId_relatedPostId: { postId: publishedPosts[i].id, relatedPostId: publishedPosts[j].id } },
      })
      if (!existing) {
        await db.blogRelatedPost.create({
          data: { postId: publishedPosts[i].id, relatedPostId: publishedPosts[j].id },
        })
        relatedCount++
      }
    }
  }
  if (relatedCount > 0) console.log(`  ✅ ${relatedCount} related post links seeded`)
}
