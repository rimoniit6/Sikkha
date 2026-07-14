'use client'

import ScrollProgress from './ScrollProgress'
import HeroSection from './HeroSection'
import QuickSearchSection from './QuickSearchSection'
import AchievementBadgesSection from './AchievementBadgesSection'
import ClassCategories from './ClassCategories'
import SubjectExplorerSection from './SubjectExplorerSection'
import RecentContentSection from './RecentContentSection'
import NoticeBoardSection from './NoticeBoardSection'
import WhyChooseUsSection from './WhyChooseUsSection'
import FeaturedCourses from './FeaturedCourses'
import EnhancedStatsSection from './EnhancedStatsSection'
import ExamCountdownSection from './ExamCountdownSection'
import BoardQuestionSection from './BoardQuestionSection'
import PremiumBanner from './PremiumBanner'
import TeacherModeratorsSection from './TeacherModeratorsSection'
import StudentShowcaseSection from './StudentShowcaseSection'
import FAQSection from './FAQSection'
import NewsletterSection from './NewsletterSection'
import CTASection from './CTASection'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <ScrollProgress />
      <HeroSection />
      <AchievementBadgesSection />
      <QuickSearchSection />
      <ClassCategories />
      <SubjectExplorerSection />
      <RecentContentSection />
      <NoticeBoardSection />
      <WhyChooseUsSection />
      <FeaturedCourses />
      <EnhancedStatsSection />
      <ExamCountdownSection />
      <BoardQuestionSection />
      <PremiumBanner />
      <TeacherModeratorsSection />
      <StudentShowcaseSection />
      <FAQSection />
      <NewsletterSection />
      <CTASection />
    </main>
  )
}