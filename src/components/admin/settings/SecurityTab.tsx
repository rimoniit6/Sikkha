import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Shield } from 'lucide-react'
import React from 'react'

export function SecurityTab({
  enableCsrfProtection,
  setEnableCsrfProtection,
  isProduction,
}: {
  enableCsrfProtection: boolean
  setEnableCsrfProtection: (v: boolean) => void
  isProduction: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-5 w-5 text-emerald-600" />
          নিরাপত্তা সেটিংস
        </CardTitle>
        <CardDescription>
          CSRF সুরক্ষা এবং অন্যান্য নিরাপত্তা কনফিগারেশন
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* CSRF Protection Toggle */}
        <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
          <div className="space-y-1">
            <Label htmlFor="csrf-toggle" className="text-sm font-medium">
              CSRF সুরক্ষা সক্রিয় করুন
            </Label>
            <p className="text-xs text-muted-foreground">
              {isProduction
                ? 'Production এ CSRF সুরক্ষা সর্বদা সক্রিয় থাকবে।'
                : 'Cross-Site Request Forgery সুরক্ষা। বন্ধ করলে CSRF টোকেন যাচাই বাদ দেওয়া হবে।'}
            </p>
          </div>
          <Switch
            id="csrf-toggle"
            checked={enableCsrfProtection}
            onCheckedChange={setEnableCsrfProtection}
            disabled={isProduction}
            aria-label="CSRF সুরক্ষা টগল"
          />
        </div>

        {isProduction && (
          <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 p-3">
            <p className="text-xs text-amber-700 dark:text-amber-300">
              CSRF সুরক্ষা Production এ সর্বদা সক্রিয় থাকে। এটি নিষ্ক্রিয় করা যাবে না।
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
