'use client'

import ScrollProgress from './ScrollProgress'
import HeroSection from './HeroSection'
import ClassCategories from './ClassCategories'
import RecentContentSection from './RecentContentSection'
import WhyChooseUsSection from './WhyChooseUsSection'
import FeaturedCourses from './FeaturedCourses'
import StatsSection from './StatsSection'
import BoardQuestionSection from './BoardQuestionSection'
import PremiumBanner from './PremiumBanner'
import TeacherModeratorsSection from './TeacherModeratorsSection'
import TestimonialsSection from './TestimonialsSection'
import FAQSection from './FAQSection'
import CTASection from './CTASection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <ScrollProgress />
      <HeroSection />
      <ClassCategories />
      <RecentContentSection />
      <WhyChooseUsSection />
      <FeaturedCourses />
      <StatsSection />
      <BoardQuestionSection />
      <PremiumBanner />
      <TeacherModeratorsSection />
      <TestimonialsSection />
      <FAQSection />
      <CTASection />
    </main>
  )
}