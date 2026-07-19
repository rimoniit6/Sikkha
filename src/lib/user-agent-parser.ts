/**
 * User-Agent Parser
 *
 * Parses user agent strings to extract browser, OS, and device information.
 * Used by the audit system to enrich activity logs with client context.
 */

export interface ParsedUserAgent {
  browser: string | null
  browserVersion: string | null
  os: string | null
  osVersion: string | null
  device: string | null // desktop, mobile, tablet
  isMobile: boolean
  isTablet: boolean
}

/**
 * Parse a user agent string into structured components.
 */
export function parseUserAgent(ua: string | null | undefined): ParsedUserAgent {
  if (!ua) {
    return { browser: null, browserVersion: null, os: null, osVersion: null, device: null, isMobile: false, isTablet: false }
  }

  const browser = parseBrowser(ua)
  const os = parseOS(ua)
  const device = parseDevice(ua)

  return {
    browser: browser.name,
    browserVersion: browser.version,
    os: os.name,
    osVersion: os.version,
    device: device.type,
    isMobile: device.isMobile,
    isTablet: device.isTablet,
  }
}

function parseBrowser(ua: string): { name: string | null; version: string | null } {
  // Order matters — check more specific browsers first

  // Edge (Chromium-based)
  const edgeMatch = ua.match(/Edg(?:e|A|iOS)?\/(\d+(?:\.\d+)?)/)
  if (edgeMatch) return { name: 'Edge', version: edgeMatch[1] }

  // Opera
  const operaMatch = ua.match(/(?:OPR|Opera)\/(\d+(?:\.\d+)?)/)
  if (operaMatch) return { name: 'Opera', version: operaMatch[1] }

  // Chrome (must check after Edge/Opera since they contain Chrome in UA)
  const chromeMatch = ua.match(/Chrome\/(\d+(?:\.\d+)?)/)
  if (chromeMatch && !ua.match(/Chromium/)) return { name: 'Chrome', version: chromeMatch[1] }

  // Safari (must check after Chrome since Chrome contains Safari in UA)
  const safariMatch = ua.match(/Version\/(\d+(?:\.\d+)?) Safari/)
  if (safariMatch) return { name: 'Safari', version: safariMatch[1] }

  // Firefox
  const firefoxMatch = ua.match(/Firefox\/(\d+(?:\.\d+)?)/)
  if (firefoxMatch) return { name: 'Firefox', version: firefoxMatch[1] }

  // IE (legacy)
  const ieMatch = ua.match(/(?:MSIE |Trident.*rv:)(\d+(?:\.\d+)?)/)
  if (ieMatch) return { name: 'Internet Explorer', version: ieMatch[1] }

  // Samsung Browser
  const samsungMatch = ua.match(/SamsungBrowser\/(\d+(?:\.\d+)?)/)
  if (samsungMatch) return { name: 'Samsung Browser', version: samsungMatch[1] }

  // UC Browser
  const ucMatch = ua.match(/UCBrowser\/(\d+(?:\.\d+)?)/)
  if (ucMatch) return { name: 'UC Browser', version: ucMatch[1] }

  // WeChat Browser
  if (ua.match(/MicroMessenger/)) return { name: 'WeChat', version: null }

  return { name: null, version: null }
}

function parseOS(ua: string): { name: string | null; version: string | null } {
  // Windows
  const windowsMatch = ua.match(/Windows NT (\d+\.\d+)/)
  if (windowsMatch) {
    const versionMap: Record<string, string> = {
      '10.0': '10/11',
      '6.3': '8.1',
      '6.2': '8',
      '6.1': '7',
      '6.0': 'Vista',
      '5.1': 'XP',
    }
    return { name: 'Windows', version: versionMap[windowsMatch[1]] || windowsMatch[1] }
  }

  // macOS
  const macMatch = ua.match(/Mac OS X (\d+[._]\d+(?:[._]\d+)?)/)
  if (macMatch) return { name: 'macOS', version: macMatch[1].replace(/_/g, '.') }

  // iOS
  const iosMatch = ua.match(/OS (\d+_\d+(?:_\d+)?) like Mac OS X/)
  if (iosMatch) return { name: 'iOS', version: iosMatch[1].replace(/_/g, '.') }

  // Android
  const androidMatch = ua.match(/Android (\d+(?:\.\d+)?)/)
  if (androidMatch) return { name: 'Android', version: androidMatch[1] }

  // Linux (check after Android since Android contains Linux)
  if (ua.match(/Linux/) && !ua.match(/Android/)) return { name: 'Linux', version: null }

  // Chrome OS
  if (ua.match(/CrOS/)) return { name: 'Chrome OS', version: null }

  return { name: null, version: null }
}

function parseDevice(ua: string): { type: string; isMobile: boolean; isTablet: boolean } {
  // Tablet checks (before mobile since tablets often contain "Mobile" in UA)
  if (ua.match(/iPad/)) return { type: 'tablet', isMobile: false, isTablet: true }
  if (ua.match(/Android/) && ua.match(/Tablet/)) return { type: 'tablet', isMobile: false, isTablet: true }
  if (ua.match(/Kindle/) || ua.match(/Silk/)) return { type: 'tablet', isMobile: false, isTablet: true }

  // Mobile checks
  if (ua.match(/Mobile/)) return { type: 'mobile', isMobile: true, isTablet: false }
  if (ua.match(/Android/) && !ua.match(/Tablet/)) return { type: 'mobile', isMobile: true, isTablet: false }
  if (ua.match(/iPhone/)) return { type: 'mobile', isMobile: true, isTablet: false }

  return { type: 'desktop', isMobile: false, isTablet: false }
}

/**
 * Get a human-readable summary of the user agent.
 * Example: "Chrome 120 on Windows 10"
 */
export function summarizeUserAgent(ua: string | null | undefined): string {
  const parsed = parseUserAgent(ua)
  const parts: string[] = []

  if (parsed.browser) {
    parts.push(parsed.browser)
    if (parsed.browserVersion) parts.push(parsed.browserVersion)
  }

  if (parsed.os) {
    parts.push('on')
    parts.push(parsed.os)
    if (parsed.osVersion) parts.push(parsed.osVersion)
  }

  return parts.length > 0 ? parts.join(' ') : 'Unknown'
}
