export interface Member {
  id: string
  name: string
  pin: string
  avatarUrl?: string | null
  fatigueScore?: number
  status?: 'normal' | 'warning' | 'alert'
}
