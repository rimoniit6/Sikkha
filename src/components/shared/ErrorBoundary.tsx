'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  isOffline: boolean
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: undefined, isOffline: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const isOffline = !navigator.onLine
    return { hasError: true, error, isOffline }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, isOffline: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          {this.state.isOffline ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                <WifiOff className="h-8 w-8 text-amber-500" />
              </div>
              <h2 className="text-lg font-semibold mb-2">ইন্টারনেট সংযোগ নেই</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                আপনি অফলাইনে আছেন। ইন্টারনেট সংযোগ পুনরুদ্ধার করে আবার চেষ্টা করুন।
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={this.handleReload}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  রিলোড করুন
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-lg font-semibold mb-2">কিছু সমস্যা হয়েছে</h2>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                এই অংশটি লোড করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <pre className="text-xs text-left bg-muted p-3 rounded-lg mb-4 max-w-md overflow-auto">
                  {this.state.error.message}
                </pre>
              )}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={this.handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  আবার চেষ্টা করুন
                </Button>
                <Button variant="ghost" size="sm" onClick={this.handleReload}>
                  রিলোড করুন
                </Button>
              </div>
            </>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
