/**
 * Dashboard Type Definitions
 * 
 * Shared types used across dashboard components
 */

export interface FatigueTimelinePoint {
  date: string
  score: number
}

export interface BlinkAnalyticsPoint {
  session: string
  leftBlinks: number
  rightBlinks: number
  avgFrequency: number
}

export interface PupilTrackingPoint {
  time: string
  leftPupil: number
  rightPupil: number
}
