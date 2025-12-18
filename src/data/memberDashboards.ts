/**
 * Per-Member Dashboard Mock Data
 * 
 * Contains individual member metrics and charts data.
 * Replace with API calls later: fetch('/api/dashboard/member/:id')
 */

import type { FatigueTimelinePoint, BlinkAnalyticsPoint, PupilTrackingPoint } from './dashboard'

export interface MemberSummary {
  latestFatigueScore: number
  averageScore: number
  standardDeviation: number
  variabilityTrend: number  // percentage showing trend direction
  totalSessions: number
}

export interface MemberSession {
  sessionId: string
  date: string
  duration: number  // in seconds
  fatigueScore: number
  blinkCount: number
  status: 'completed' | 'interrupted' | 'pending'
}

export interface MemberDashboard {
  memberId: string
  summary: MemberSummary
  fatigueTimeline: FatigueTimelinePoint[]
  blinkAnalytics: BlinkAnalyticsPoint[]
  pupilTracking: PupilTrackingPoint[]
  recentSessions: MemberSession[]
}

/**
 * Mock data for each member's dashboard
 * Keyed by member ID for quick lookup
 */
export const memberDashboards: Record<string, MemberDashboard> = {
  USR001: {
    memberId: 'USR001',
    summary: {
      latestFatigueScore: 68,
      averageScore: 51.67,
      standardDeviation: 22.23,
      variabilityTrend: 72,
      totalSessions: 48
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 43 },
      { date: 'Nov 05', score: 47 },
      { date: 'Nov 09', score: 52 },
      { date: 'Nov 13', score: 56 },
      { date: 'Nov 17', score: 49 },
      { date: 'Nov 21', score: 58 },
      { date: 'Nov 25', score: 62 },
      { date: 'Nov 29', score: 55 },
      { date: 'Dec 01', score: 68 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 58, rightBlinks: 69, avgFrequency: 14.1 },
      { session: 'Session 2', leftBlinks: 65, rightBlinks: 77, avgFrequency: 15.8 },
      { session: 'Session 3', leftBlinks: 42, rightBlinks: 56, avgFrequency: 16.3 },
      { session: 'Session 4', leftBlinks: 75, rightBlinks: 90, avgFrequency: 16.5 },
      { session: 'Session 5', leftBlinks: 62, rightBlinks: 76, avgFrequency: 15.3 },
      { session: 'Session 6', leftBlinks: 72, rightBlinks: 84, avgFrequency: 17.3 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.67, rightPupil: 4.24 },
      { time: '5s', leftPupil: 3.76, rightPupil: 4.10 },
      { time: '10s', leftPupil: 3.80, rightPupil: 4.29 },
      { time: '15s', leftPupil: 3.67, rightPupil: 4.10 },
      { time: '20s', leftPupil: 3.84, rightPupil: 3.88 },
      { time: '25s', leftPupil: 3.91, rightPupil: 4.01 },
      { time: '30s', leftPupil: 3.82, rightPupil: 3.73 }
    ],
    recentSessions: [
      { sessionId: 'SES001', date: '2025-12-03T10:30:00Z', duration: 2700, fatigueScore: 68, blinkCount: 156, status: 'completed' },
      { sessionId: 'SES002', date: '2025-12-01T14:00:00Z', duration: 2100, fatigueScore: 62, blinkCount: 138, status: 'completed' },
      { sessionId: 'SES003', date: '2025-11-29T09:15:00Z', duration: 1800, fatigueScore: 55, blinkCount: 127, status: 'completed' },
      { sessionId: 'SES004', date: '2025-11-27T11:45:00Z', duration: 3000, fatigueScore: 58, blinkCount: 165, status: 'completed' },
      { sessionId: 'SES005', date: '2025-11-25T16:00:00Z', duration: 1500, fatigueScore: 62, blinkCount: 98, status: 'interrupted' }
    ]
  },
  USR002: {
    memberId: 'USR002',
    summary: {
      latestFatigueScore: 52,
      averageScore: 48.5,
      standardDeviation: 15.8,
      variabilityTrend: 65,
      totalSessions: 38
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 38 },
      { date: 'Nov 05', score: 42 },
      { date: 'Nov 09', score: 45 },
      { date: 'Nov 13', score: 50 },
      { date: 'Nov 17', score: 48 },
      { date: 'Nov 21', score: 55 },
      { date: 'Nov 25', score: 50 },
      { date: 'Nov 29', score: 48 },
      { date: 'Dec 01', score: 52 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 52, rightBlinks: 58, avgFrequency: 13.5 },
      { session: 'Session 2', leftBlinks: 60, rightBlinks: 65, avgFrequency: 14.2 },
      { session: 'Session 3', leftBlinks: 48, rightBlinks: 52, avgFrequency: 14.8 },
      { session: 'Session 4', leftBlinks: 55, rightBlinks: 62, avgFrequency: 15.0 },
      { session: 'Session 5', leftBlinks: 58, rightBlinks: 64, avgFrequency: 14.5 },
      { session: 'Session 6', leftBlinks: 50, rightBlinks: 56, avgFrequency: 14.0 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.85, rightPupil: 4.10 },
      { time: '5s', leftPupil: 3.90, rightPupil: 4.05 },
      { time: '10s', leftPupil: 3.88, rightPupil: 4.12 },
      { time: '15s', leftPupil: 3.82, rightPupil: 4.00 },
      { time: '20s', leftPupil: 3.92, rightPupil: 4.08 },
      { time: '25s', leftPupil: 3.86, rightPupil: 4.02 },
      { time: '30s', leftPupil: 3.90, rightPupil: 4.06 }
    ],
    recentSessions: [
      { sessionId: 'SES101', date: '2025-12-02T11:00:00Z', duration: 2400, fatigueScore: 52, blinkCount: 140, status: 'completed' },
      { sessionId: 'SES102', date: '2025-11-30T15:30:00Z', duration: 2100, fatigueScore: 48, blinkCount: 125, status: 'completed' },
      { sessionId: 'SES103', date: '2025-11-28T10:00:00Z', duration: 1800, fatigueScore: 50, blinkCount: 118, status: 'completed' }
    ]
  },
  USR003: {
    memberId: 'USR003',
    summary: {
      latestFatigueScore: 45,
      averageScore: 42.3,
      standardDeviation: 12.5,
      variabilityTrend: 58,
      totalSessions: 52
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 35 },
      { date: 'Nov 05', score: 38 },
      { date: 'Nov 09', score: 42 },
      { date: 'Nov 13', score: 40 },
      { date: 'Nov 17', score: 45 },
      { date: 'Nov 21', score: 48 },
      { date: 'Nov 25', score: 44 },
      { date: 'Nov 29', score: 42 },
      { date: 'Dec 01', score: 45 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 45, rightBlinks: 50, avgFrequency: 12.8 },
      { session: 'Session 2', leftBlinks: 48, rightBlinks: 52, avgFrequency: 13.2 },
      { session: 'Session 3', leftBlinks: 42, rightBlinks: 46, avgFrequency: 12.5 },
      { session: 'Session 4', leftBlinks: 50, rightBlinks: 55, avgFrequency: 13.8 },
      { session: 'Session 5', leftBlinks: 46, rightBlinks: 51, avgFrequency: 13.0 },
      { session: 'Session 6', leftBlinks: 44, rightBlinks: 48, avgFrequency: 12.6 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.70, rightPupil: 3.95 },
      { time: '5s', leftPupil: 3.72, rightPupil: 3.98 },
      { time: '10s', leftPupil: 3.68, rightPupil: 3.92 },
      { time: '15s', leftPupil: 3.75, rightPupil: 4.00 },
      { time: '20s', leftPupil: 3.70, rightPupil: 3.95 },
      { time: '25s', leftPupil: 3.73, rightPupil: 3.97 },
      { time: '30s', leftPupil: 3.71, rightPupil: 3.94 }
    ],
    recentSessions: [
      { sessionId: 'SES201', date: '2025-11-28T09:30:00Z', duration: 2700, fatigueScore: 45, blinkCount: 132, status: 'completed' },
      { sessionId: 'SES202', date: '2025-11-26T14:00:00Z', duration: 2400, fatigueScore: 42, blinkCount: 120, status: 'completed' }
    ]
  },
  USR004: {
    memberId: 'USR004',
    summary: {
      latestFatigueScore: 78,
      averageScore: 72.5,
      standardDeviation: 18.2,
      variabilityTrend: 85,
      totalSessions: 29
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 65 },
      { date: 'Nov 05', score: 70 },
      { date: 'Nov 09', score: 72 },
      { date: 'Nov 13', score: 68 },
      { date: 'Nov 17', score: 75 },
      { date: 'Nov 21', score: 80 },
      { date: 'Nov 25', score: 74 },
      { date: 'Nov 29', score: 76 },
      { date: 'Dec 01', score: 78 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 85, rightBlinks: 92, avgFrequency: 18.5 },
      { session: 'Session 2', leftBlinks: 90, rightBlinks: 98, avgFrequency: 19.2 },
      { session: 'Session 3', leftBlinks: 82, rightBlinks: 88, avgFrequency: 17.8 },
      { session: 'Session 4', leftBlinks: 95, rightBlinks: 102, avgFrequency: 20.0 },
      { session: 'Session 5', leftBlinks: 88, rightBlinks: 94, avgFrequency: 18.8 },
      { session: 'Session 6', leftBlinks: 92, rightBlinks: 100, avgFrequency: 19.5 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 4.20, rightPupil: 4.55 },
      { time: '5s', leftPupil: 4.28, rightPupil: 4.62 },
      { time: '10s', leftPupil: 4.15, rightPupil: 4.48 },
      { time: '15s', leftPupil: 4.32, rightPupil: 4.68 },
      { time: '20s', leftPupil: 4.22, rightPupil: 4.58 },
      { time: '25s', leftPupil: 4.35, rightPupil: 4.72 },
      { time: '30s', leftPupil: 4.18, rightPupil: 4.52 }
    ],
    recentSessions: [
      { sessionId: 'SES301', date: '2025-12-01T16:00:00Z', duration: 2100, fatigueScore: 78, blinkCount: 185, status: 'completed' },
      { sessionId: 'SES302', date: '2025-11-29T10:30:00Z', duration: 1800, fatigueScore: 76, blinkCount: 172, status: 'completed' }
    ]
  },
  USR005: {
    memberId: 'USR005',
    summary: {
      latestFatigueScore: 35,
      averageScore: 38.2,
      standardDeviation: 10.5,
      variabilityTrend: 45,
      totalSessions: 61
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 32 },
      { date: 'Nov 05', score: 35 },
      { date: 'Nov 09', score: 38 },
      { date: 'Nov 13', score: 40 },
      { date: 'Nov 17', score: 36 },
      { date: 'Nov 21', score: 42 },
      { date: 'Nov 25', score: 38 },
      { date: 'Nov 29', score: 35 },
      { date: 'Dec 01', score: 35 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 40, rightBlinks: 44, avgFrequency: 11.5 },
      { session: 'Session 2', leftBlinks: 42, rightBlinks: 46, avgFrequency: 12.0 },
      { session: 'Session 3', leftBlinks: 38, rightBlinks: 42, avgFrequency: 11.2 },
      { session: 'Session 4', leftBlinks: 45, rightBlinks: 48, avgFrequency: 12.5 },
      { session: 'Session 5', leftBlinks: 41, rightBlinks: 45, avgFrequency: 11.8 },
      { session: 'Session 6', leftBlinks: 39, rightBlinks: 43, avgFrequency: 11.4 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.55, rightPupil: 3.80 },
      { time: '5s', leftPupil: 3.58, rightPupil: 3.82 },
      { time: '10s', leftPupil: 3.52, rightPupil: 3.78 },
      { time: '15s', leftPupil: 3.60, rightPupil: 3.85 },
      { time: '20s', leftPupil: 3.55, rightPupil: 3.80 },
      { time: '25s', leftPupil: 3.57, rightPupil: 3.82 },
      { time: '30s', leftPupil: 3.54, rightPupil: 3.79 }
    ],
    recentSessions: [
      { sessionId: 'SES401', date: '2025-12-03T08:00:00Z', duration: 3000, fatigueScore: 35, blinkCount: 110, status: 'completed' },
      { sessionId: 'SES402', date: '2025-12-01T13:30:00Z', duration: 2700, fatigueScore: 38, blinkCount: 115, status: 'completed' }
    ]
  },
  USR006: {
    memberId: 'USR006',
    summary: {
      latestFatigueScore: 55,
      averageScore: 52.8,
      standardDeviation: 14.2,
      variabilityTrend: 62,
      totalSessions: 33
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 48 },
      { date: 'Nov 05', score: 50 },
      { date: 'Nov 09', score: 52 },
      { date: 'Nov 13', score: 55 },
      { date: 'Nov 17', score: 52 },
      { date: 'Nov 21', score: 58 },
      { date: 'Nov 25', score: 54 },
      { date: 'Nov 29', score: 52 },
      { date: 'Dec 01', score: 55 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 55, rightBlinks: 60, avgFrequency: 14.0 },
      { session: 'Session 2', leftBlinks: 58, rightBlinks: 64, avgFrequency: 14.5 },
      { session: 'Session 3', leftBlinks: 52, rightBlinks: 56, avgFrequency: 13.5 },
      { session: 'Session 4', leftBlinks: 62, rightBlinks: 68, avgFrequency: 15.2 },
      { session: 'Session 5', leftBlinks: 56, rightBlinks: 62, avgFrequency: 14.2 },
      { session: 'Session 6', leftBlinks: 54, rightBlinks: 58, avgFrequency: 13.8 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.82, rightPupil: 4.05 },
      { time: '5s', leftPupil: 3.85, rightPupil: 4.08 },
      { time: '10s', leftPupil: 3.80, rightPupil: 4.02 },
      { time: '15s', leftPupil: 3.88, rightPupil: 4.12 },
      { time: '20s', leftPupil: 3.83, rightPupil: 4.06 },
      { time: '25s', leftPupil: 3.86, rightPupil: 4.10 },
      { time: '30s', leftPupil: 3.81, rightPupil: 4.04 }
    ],
    recentSessions: [
      { sessionId: 'SES501', date: '2025-12-02T15:00:00Z', duration: 2400, fatigueScore: 55, blinkCount: 145, status: 'completed' },
      { sessionId: 'SES502', date: '2025-11-30T09:00:00Z', duration: 2100, fatigueScore: 52, blinkCount: 135, status: 'completed' }
    ]
  },
  USR007: {
    memberId: 'USR007',
    summary: {
      latestFatigueScore: 62,
      averageScore: 58.5,
      standardDeviation: 16.8,
      variabilityTrend: 70,
      totalSessions: 41
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 52 },
      { date: 'Nov 05', score: 55 },
      { date: 'Nov 09', score: 58 },
      { date: 'Nov 13', score: 60 },
      { date: 'Nov 17', score: 56 },
      { date: 'Nov 21', score: 65 },
      { date: 'Nov 25', score: 60 },
      { date: 'Nov 29', score: 58 },
      { date: 'Dec 01', score: 62 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 62, rightBlinks: 68, avgFrequency: 15.2 },
      { session: 'Session 2', leftBlinks: 65, rightBlinks: 72, avgFrequency: 15.8 },
      { session: 'Session 3', leftBlinks: 58, rightBlinks: 64, avgFrequency: 14.5 },
      { session: 'Session 4', leftBlinks: 70, rightBlinks: 78, avgFrequency: 16.5 },
      { session: 'Session 5', leftBlinks: 64, rightBlinks: 70, avgFrequency: 15.5 },
      { session: 'Session 6', leftBlinks: 60, rightBlinks: 66, avgFrequency: 15.0 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.92, rightPupil: 4.18 },
      { time: '5s', leftPupil: 3.95, rightPupil: 4.22 },
      { time: '10s', leftPupil: 3.88, rightPupil: 4.15 },
      { time: '15s', leftPupil: 4.00, rightPupil: 4.28 },
      { time: '20s', leftPupil: 3.93, rightPupil: 4.20 },
      { time: '25s', leftPupil: 3.98, rightPupil: 4.25 },
      { time: '30s', leftPupil: 3.90, rightPupil: 4.16 }
    ],
    recentSessions: [
      { sessionId: 'SES601', date: '2025-11-30T12:00:00Z', duration: 2700, fatigueScore: 62, blinkCount: 158, status: 'completed' }
    ]
  },
  USR008: {
    memberId: 'USR008',
    summary: {
      latestFatigueScore: 42,
      averageScore: 40.2,
      standardDeviation: 11.5,
      variabilityTrend: 52,
      totalSessions: 47
    },
    fatigueTimeline: [
      { date: 'Nov 01', score: 35 },
      { date: 'Nov 05', score: 38 },
      { date: 'Nov 09', score: 40 },
      { date: 'Nov 13', score: 42 },
      { date: 'Nov 17', score: 38 },
      { date: 'Nov 21', score: 45 },
      { date: 'Nov 25', score: 42 },
      { date: 'Nov 29', score: 40 },
      { date: 'Dec 01', score: 42 }
    ],
    blinkAnalytics: [
      { session: 'Session 1', leftBlinks: 42, rightBlinks: 46, avgFrequency: 12.0 },
      { session: 'Session 2', leftBlinks: 45, rightBlinks: 48, avgFrequency: 12.5 },
      { session: 'Session 3', leftBlinks: 40, rightBlinks: 44, avgFrequency: 11.5 },
      { session: 'Session 4', leftBlinks: 48, rightBlinks: 52, avgFrequency: 13.0 },
      { session: 'Session 5', leftBlinks: 44, rightBlinks: 48, avgFrequency: 12.2 },
      { session: 'Session 6', leftBlinks: 41, rightBlinks: 45, avgFrequency: 11.8 }
    ],
    pupilTracking: [
      { time: '0s', leftPupil: 3.62, rightPupil: 3.88 },
      { time: '5s', leftPupil: 3.65, rightPupil: 3.90 },
      { time: '10s', leftPupil: 3.60, rightPupil: 3.85 },
      { time: '15s', leftPupil: 3.68, rightPupil: 3.95 },
      { time: '20s', leftPupil: 3.63, rightPupil: 3.88 },
      { time: '25s', leftPupil: 3.66, rightPupil: 3.92 },
      { time: '30s', leftPupil: 3.61, rightPupil: 3.86 }
    ],
    recentSessions: [
      { sessionId: 'SES701', date: '2025-12-03T11:00:00Z', duration: 2400, fatigueScore: 42, blinkCount: 122, status: 'completed' },
      { sessionId: 'SES702', date: '2025-12-01T09:30:00Z', duration: 2100, fatigueScore: 40, blinkCount: 115, status: 'completed' }
    ]
  }
}

/**
 * Get member dashboard by ID
 * Returns undefined if member not found
 */
export function getMemberDashboard(memberId: string): MemberDashboard | undefined {
  return memberDashboards[memberId]
}

/**
 * TODO: Replace with real API call
 * Example:
 * export async function fetchMemberDashboard(memberId: string): Promise<MemberDashboard> {
 *   const response = await fetch(`/api/dashboard/member/${memberId}`)
 *   return response.json()
 * }
 */
