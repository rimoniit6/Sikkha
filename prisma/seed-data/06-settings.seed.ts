import type { PrismaClient } from '@prisma/client'
import { deterministicId, resetCounter } from './00-helpers'

const SETTINGS: Array<{ key: string; value: string; group: string; label: string }> = [
  // SEO
  { key: 'site_name', value: 'শিক্ষা বাংলা', group: 'seo', label: 'সাইটের নাম' },
  { key: 'site_title', value: 'শিক্ষা বাংলা - অনলাইন লার্নিং প্ল্যাটফর্ম', group: 'seo', label: 'সাইট টাইটেল' },
  { key: 'site_description', value: '৬ষ্ঠ থেকে এইচএসসি পর্যন্ত অনলাইনে পড়াশোনা। লেকচার, এমসিকিউ, সৃজনশীল প্রশ্ন, সাজেশন ও পরীক্ষা।', group: 'seo', label: 'সাইট বিবরণ' },
  { key: 'site_keywords', value: 'শিক্ষা, অনলাইন শিক্ষা, এসএসসি, এইচএসসি, লেকচার, এমসিকিউ, সৃজনশীল প্রশ্ন', group: 'seo', label: 'কীওয়ার্ড' },

  // Homepage
  { key: 'hero_title', value: 'তোমার সাফল্যের যাত্রা শুরু হোক', group: 'homepage', label: 'হিরো টাইটেল' },
  { key: 'hero_subtitle', value: '৬ষ্ঠ থেকে এইচএসসি পর্যন্ত সকল বিষয়ে লেকচার, এমসিকিউ, সৃজনশীল প্রশ্ন, সাজেশন ও মডেল টেস্ট', group: 'homepage', label: 'হিরো সাবটাইটেল' },
  { key: 'hero_cta_text', value: 'বিনামূল্যে শুরু করুন', group: 'homepage', label: 'হিরো CTA টেক্সট' },
  { key: 'feature_1_title', value: 'ভিডিও লেকচার', group: 'homepage', label: 'ফিচার ১' },
  { key: 'feature_1_desc', value: 'প্রতিটি অধ্যায়ের জন্য উচ্চমানের ভিডিও লেকচার', group: 'homepage', label: 'ফিচার ১ বিবরণ' },
  { key: 'feature_2_title', value: 'এমসিকিউ অনুশীলন', group: 'homepage', label: 'ফিচার ২' },
  { key: 'feature_2_desc', value: 'হাজার হাজার এমসিকিউ প্রশ্ন সহ উত্তর ও ব্যাখ্যা', group: 'homepage', label: 'ফিচার ২ বিবরণ' },
  { key: 'feature_3_title', value: 'সৃজনশীল প্রশ্ন', group: 'homepage', label: 'ফিচার ৩' },
  { key: 'feature_3_desc', value: 'বোর্ড পরীক্ষার প্যাটার্নে সৃজনশীল প্রশ্ন ও উত্তর', group: 'homepage', label: 'ফিচার ৩ বিবরণ' },

  // Contact
  { key: 'contact_email', value: 'hello@sikkha.com', group: 'contact', label: 'ইমেইল' },
  { key: 'contact_phone', value: '+8801700000000', group: 'contact', label: 'ফোন' },
  { key: 'contact_address', value: 'ঢাকা, বাংলাদেশ', group: 'contact', label: 'ঠিকানা' },

  // Social
  { key: 'social_facebook', value: 'https://facebook.com/sikkha', group: 'social', label: 'ফেসবুক' },
  { key: 'social_youtube', value: 'https://youtube.com/@sikkha', group: 'social', label: 'ইউটিউব' },
  { key: 'social_whatsapp', value: '+8801700000000', group: 'social', label: 'হোয়াটসঅ্যাপ' },

  // Messages
  { key: 'welcome_message', value: 'শিক্ষা বাংলায় স্বাগতম! তোমার শিক্ষার যাত্রা শুরু হোক।', group: 'messages', label: 'স্বাগতম বার্তা' },
  { key: 'registration_success', value: 'রেজিস্ট্রেশন সফল হয়েছে! এখনই লগইন করে পড়া শুরু কর।', group: 'messages', label: 'রেজিস্ট্রেশন বার্তা' },
  { key: 'payment_pending', value: 'তোমার পেমেন্ট রিভিউ চলছে। অনুমোদিত হলে জানিয়ে দেওয়া হবে।', group: 'messages', label: 'পেমেন্ট বার্তা' },

  // Rate Limit
  { key: 'rate_limit_exam', value: '60', group: 'rate-limit', label: 'পরীক্ষা রেট লিমিট' },

  // Appearance
  { key: 'primary_color', value: '#10b981', group: 'appearance', label: 'প্রাথমিক রঙ' },
  { key: 'logo_url', value: '/logo.png', group: 'appearance', label: 'লোগো' },
  { key: 'favicon_url', value: '/favicon.ico', group: 'appearance', label: 'ফেভিকন' },

  // Features
  { key: 'enable_blog', value: 'true', group: 'features', label: 'ব্লগ সক্রিয়' },
  { key: 'enable_contact', value: 'true', group: 'features', label: 'যোগাযোগ সক্রিয়' },
  { key: 'enable_premium', value: 'true', group: 'features', label: 'প্রিমিয়াম সক্রিয়' },

  // Maintenance
  { key: 'maintenance_mode', value: 'false', group: 'maintenance', label: 'মেইনটেন্যান্স মোড' },
  { key: 'maintenance_message', value: 'আমরা কিছুক্ষণের জন্য আপডেটের কাজ করছি। খুব শীঘ্রই ফিরে আসছি।', group: 'maintenance', label: 'মেইনটেন্যান্স বার্তা' },

  // Analytics
  { key: 'ga_id', value: '', group: 'analytics', label: 'গুগল অ্যানালিটিক্স আইডি' },

  // Exam config
  { key: 'default_exam_duration', value: '30', group: 'exam', label: 'পরীক্ষার সময় (মিনিট)' },
  { key: 'default_pass_percentage', value: '40', group: 'exam', label: 'পাস মার্ক (%)' },

  // CDN
  { key: 'cdn_base_url', value: '', group: 'cdn', label: 'CDN URL' },

  // Footer
  { key: 'footer_copyright', value: '© ২০২৬ শিক্ষা বাংলা। সর্বস্বত্ব সংরক্ষিত।', group: 'homepage', label: 'ফুটার কপিরাইট' },
]

export async function seedSettings(db: PrismaClient) {
  resetCounter()

  for (const s of SETTINGS) {
    await db.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group, label: s.label },
      create: { id: deterministicId('stg'), key: s.key, value: s.value, group: s.group, label: s.label },
    })
  }
}
