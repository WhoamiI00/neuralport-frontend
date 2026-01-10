/**
 * Members Mock Data
 * 
 * Contains member/user data for the dashboard.
 * Replace with API calls later: fetch('/api/members')
 */

import type { Tag, PerformanceType } from '@/lib/api'

export interface Member {
  id: string
  name: string
  pin?: string  // 4-digit PIN for user authentication
  avatarUrl?: string
  sessionCount: number  // Renamed from totalSessions for consistency
  fatigueScore: number
  email?: string
  role?: string
  joinDate?: string
  lastActiveDate?: string
  tags?: Tag[]  // User tags for categorization
  performance_type?: PerformanceType | null  // Performance type from assessment
}

export const members: Member[] = [
  {
    id: 'USR001',
    name: 'Ankit',
    pin: '1001',
    avatarUrl: '',
    sessionCount: 48,
    fatigueScore: 68,
    email: 'ankit@neuralport.jp',
    role: 'Player',
    joinDate: '2024-06-15',
    lastActiveDate: '2025-12-03'
  },
  {
    id: 'USR002',
    name: 'Kenji Oishi',
    pin: '1002',
    avatarUrl: '/src/assets/images/avatar-2.jpg',
    sessionCount: 38,
    fatigueScore: 52,
    email: 'kenji.oishi@neuralport.jp',
    role: 'Player',
    joinDate: '2024-07-01',
    lastActiveDate: '2025-12-02'
  },
  {
    id: 'USR003',
    name: 'Yuki Yamada',
    pin: '1003',
    avatarUrl: '/src/assets/images/avatar-3.jpg',
    sessionCount: 52,
    fatigueScore: 45,
    email: 'yuki.yamada@neuralport.jp',
    role: 'Player',
    joinDate: '2024-05-20',
    lastActiveDate: '2025-11-28'
  },
  {
    id: 'USR004',
    name: 'Takeshi Desmato',
    pin: '1004',
    avatarUrl: '/src/assets/images/avatar.jpg',
    sessionCount: 29,
    fatigueScore: 78,
    email: 'takeshi.desmato@neuralport.jp',
    role: 'Player',
    joinDate: '2024-08-10',
    lastActiveDate: '2025-12-01'
  },
  {
    id: 'USR005',
    name: 'Sakura Alion',
    pin: '1005',
    avatarUrl: '/src/assets/images/avatar-2.jpg',
    sessionCount: 61,
    fatigueScore: 35,
    email: 'sakura.alion@neuralport.jp',
    role: 'Player',
    joinDate: '2024-04-05',
    lastActiveDate: '2025-12-03'
  },
  {
    id: 'USR006',
    name: 'Ryu Nakamura',
    pin: '1006',
    avatarUrl: '/src/assets/images/avatar-3.jpg',
    sessionCount: 33,
    fatigueScore: 55,
    email: 'ryu.nakamura@neuralport.jp',
    role: 'Player',
    joinDate: '2024-09-01',
    lastActiveDate: '2025-12-02'
  },
  {
    id: 'USR007',
    name: 'Haruto Tanaka',
    pin: '1007',
    avatarUrl: '/src/assets/images/avatar.jpg',
    sessionCount: 41,
    fatigueScore: 62,
    email: 'haruto.tanaka@neuralport.jp',
    role: 'Player',
    joinDate: '2024-06-25',
    lastActiveDate: '2025-11-30'
  },
  {
    id: 'USR008',
    name: 'Aiko Suzuki',
    pin: '1008',
    avatarUrl: '/src/assets/images/avatar-2.jpg',
    sessionCount: 47,
    fatigueScore: 42,
    email: 'aiko.suzuki@neuralport.jp',
    role: 'Player',
    joinDate: '2024-05-10',
    lastActiveDate: '2025-12-03'
  }
]

/**
 * Get member by ID
 * Returns undefined if member not found
 */
export function getMemberById(memberId: string): Member | undefined {
  return members.find(m => m.id === memberId)
}

/**
 * Helper to get fatigue level from score
 */
export function getFatigueLevel(score: number): 'low' | 'medium' | 'high' {
  if (score < 40) return 'low'
  if (score < 65) return 'medium'
  return 'high'
}

/**
 * Helper to get fatigue color class
 */
export function getFatigueColorClass(score: number): string {
  const level = getFatigueLevel(score)
  return {
    low: 'fatigue-low',
    medium: 'fatigue-medium',
    high: 'fatigue-high'
  }[level]
}

/**
 * TODO: Replace with real API call
 * Example: 
 * export async function fetchMembers(): Promise<Member[]> {
 *   const response = await fetch('/api/members')
 *   return response.json()
 * }
 * 
 * export async function fetchMemberById(id: string): Promise<Member> {
 *   const response = await fetch(`/api/members/${id}`)
 *   return response.json()
 * }
 */
