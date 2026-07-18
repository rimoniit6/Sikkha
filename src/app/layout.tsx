import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";

export const dynamic = 'force-dynamic'
import { QueryClient, dehydrate } from '@tanstack/react-query'
import { ThemeProvider } from "next-themes";
import QueryProvider from "@/providers/QueryProvider";
import AuthProvider from "@/providers/AuthProvider";
import { LearningPreferenceProvider } from "@/providers/LearningPreferenceProvider";
import LoadingProvider from "@/providers/LoadingProvider";
import { RouteLoader } from "@/components/loading/RouteLoader";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import DynamicFavicon from "@/components/shared/DynamicFavicon";
import ApiErrorHandler from "@/components/shared/ApiErrorHandler";
import GlobalStructuredData from "@/components/shared/JsonLd";
import RouteSync from "@/components/shared/RouteSync";
import AppNavigationBridge from "@/components/shared/AppNavigationBridge";
import { RouteLoadingBar } from "@/components/loading/RouteLoadingBar";
import { fetchSiteConfig } from '@/lib/fetch-site-config'
import { queryKeys } from '@/lib/query-keys'
import { getSeoSettings, buildMetadata } from '@/lib/seo-settings'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    return buildMetadata(await getSeoSettings())
  } catch {
    return buildMetadata(await getSeoSettings())
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: queryKeys.config,
    queryFn: fetchSiteConfig,
    staleTime: 300_000,
  })
  const dehydratedState = dehydrate(queryClient)
  return (
    <html lang="bn" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#059669" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#059669" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="শিক্ষা বাংলা" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-icon.png" />
        <link rel="preconnect" href="https://utfs.io" />
        <link rel="dns-prefetch" href="https://utfs.io" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <Script
          id="service-worker-reg"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker'in navigator){window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
        <Script
          id="mathjax-config"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `window.MathJax={tex:{inlineMath:[['$','$'],['\\\\(','\\\\)']]},mml:{displayAlign:'center',displayIndent:'0em'},options:{skipHtmlTags:['script','noscript','style','textarea','pre']},startup:{pageReady:()=>MathJax.startup.defaultPageReady()}}`,
          }}
        />
        <Script
          id="mathjax-loader"
          strategy="lazyOnload"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <RouteLoadingBar />
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider dehydratedState={dehydratedState}>
            <AuthProvider>
              <LearningPreferenceProvider>
              <LoadingProvider>
                <RouteLoader />
                <RouteSync />
                <AppNavigationBridge />
                <DynamicFavicon />
                <ApiErrorHandler />
                <GlobalStructuredData />
                {children}
              </LoadingProvider>
              </LearningPreferenceProvider>
            </AuthProvider>
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
