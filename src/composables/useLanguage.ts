/**
 * useLanguage Composable
 * 
 * Provides shared language state across all components in the application.
 * Language preference is persisted to localStorage.
 */
import { ref, readonly } from 'vue'

// Language type
export type Language = 'en' | 'ja'

// Singleton language state - shared across all components
const currentLanguage = ref<Language>('en')
const isInitialized = ref(false)

// Translation dictionary
export const translations = {
  en: {
    // Auth
    'auth.title': 'VR Access',
    'auth.subtitle': 'Authenticate with Device ID and PIN',
    'auth.adminSetupSubtitle': 'Set Admin Password',
    'auth.deviceId': 'Device ID',
    'auth.pin': 'PIN',
    'auth.adminPassword': 'Admin Password',
    'auth.signIn': 'Sign In',
    'auth.sessionExpired': 'Your session has expired. Please login again.',
    'auth.firstUserSetAdmin': 'First user must set an admin password',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.adminTitle': 'Admin Dashboard',
    'dashboard.welcome': 'Welcome',
    'dashboard.admin': 'Admin',
    'dashboard.userManagement': 'User Management',
    'dashboard.training': 'Training',
    'dashboard.analytics': 'Analytics',
    'dashboard.settings': 'Settings',
    'dashboard.logout': 'Logout',
    'dashboard.users': 'Users',
    'dashboard.devices': 'Devices',
    'dashboard.sessions': 'Sessions',
    'dashboard.loading': 'Loading dashboard data...',
    'dashboard.totalUsers': 'Total Users',
    'dashboard.totalSessions': 'Total Sessions',
    'dashboard.avgFatigueScore': 'Avg Fatigue Score',
    'dashboard.standardDeviation': 'Standard Deviation',
    'dashboard.overviewAdmin': 'Overview of all users and performance metrics',
    'dashboard.overviewUser': 'Your performance metrics and statistics',
    'dashboard.members': 'Members',
    'dashboard.addUser': 'Add User',
    'dashboard.latest': 'Latest',
    'dashboard.average': 'Average',
    'dashboard.standardDeviation': 'Standard Deviation',
    'dashboard.statistics': 'Statistics',
    'dashboard.brainFatigue': 'BRAIN FATIGUE',
    'dashboard.allVRData': 'All VR Data',
    'dashboard.day': 'Day',
    'dashboard.week': 'Week',
    'dashboard.month': 'Month',
    
    // User Details
    'user.details': 'User Details',
    'user.id': 'User ID',
    'user.pin': 'PIN',
    'user.deviceId': 'Device ID',
    'user.vrName': 'VR Name',
    'user.tenantId': 'Tenant ID',
    'user.role': 'Role',
    'user.admin': 'Admin',
    'user.member': 'Member',
    'user.status': 'Status',
    'user.active': 'Active',
    'user.createNew': 'Create New User',
    'user.profileImage': 'Profile Image (Optional)',
    'user.uploadImage': 'Upload Image',
    'user.uploading': 'Uploading...',
    'user.enterImageUrl': 'Enter image URL directly (optional)',
    'user.fourDigitPin': '4-Digit PIN',
    'user.enterPin': 'Enter 4-digit PIN',
    'user.username': 'Username',
    'user.enterUsername': 'Enter username',
    'user.creating': 'Creating...',
    'user.createUser': 'Create User',
    
    // Actions
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.add': 'Add',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.back': 'Back',
    'action.next': 'Next',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
  },
  ja: {
    // Auth
    'auth.title': 'VRアクセス',
    'auth.subtitle': 'デバイスIDとPINで認証',
    'auth.adminSetupSubtitle': '管理者パスワードの設定',
    'auth.deviceId': 'デバイスID',
    'auth.pin': 'PIN',
    'auth.adminPassword': '管理者パスワード',
    'auth.signIn': 'サインイン',
    'auth.sessionExpired': 'セッションの有効期限が切れました。再度ログインしてください。',
    'auth.firstUserSetAdmin': '最初のユーザーは管理者パスワードを設定する必要があります',
    
    // Dashboard
    'dashboard.title': 'ダッシュボード',
    'dashboard.adminTitle': '管理者ダッシュボード',
    'dashboard.welcome': 'ようこそ',
    'dashboard.admin': '管理者',
    'dashboard.userManagement': 'ユーザー管理',
    'dashboard.training': 'トレーニング',
    'dashboard.analytics': '分析',
    'dashboard.settings': '設定',
    'dashboard.logout': 'ログアウト',
    'dashboard.users': 'ユーザー',
    'dashboard.devices': 'デバイス',
    'dashboard.sessions': 'セッション',
    'dashboard.loading': 'ダッシュボードデータを読み込み中...',
    'dashboard.totalUsers': '総ユーザー数',
    'dashboard.totalSessions': '総セッション数',
    'dashboard.avgFatigueScore': '平均疲労スコア',
    'dashboard.standardDeviation': '標準偏差',
    'dashboard.overviewAdmin': 'すべてのユーザーとパフォーマンス指標の概要',
    'dashboard.overviewUser': 'あなたのパフォーマンス指標と統計',
    'dashboard.members': 'メンバー',
    'dashboard.addUser': 'ユーザーを追加',
    'dashboard.latest': '最新',
    'dashboard.average': '平均',
    'dashboard.standardDeviation': '標準偏差',
    'dashboard.statistics': '統計',
    'dashboard.brainFatigue': '脳疲労',
    'dashboard.allVRData': '全てのVRデータ',
    'dashboard.day': '日',
    'dashboard.week': '週',
    'dashboard.month': '月',
    
    // User Details
    'user.details': 'ユーザー詳細',
    'user.id': 'ユーザーID',
    'user.pin': 'PIN',
    'user.deviceId': 'デバイスID',
    'user.vrName': 'VR名',
    'user.tenantId': 'テナントID',
    'user.role': '役割',
    'user.admin': '管理者',
    'user.member': 'メンバー',
    'user.status': 'ステータス',
    'user.active': 'アクティブ',
    'user.createNew': '新しいユーザーを作成',
    'user.profileImage': 'プロフィール画像（任意）',
    'user.uploadImage': '画像をアップロード',
    'user.uploading': 'アップロード中...',
    'user.enterImageUrl': '画像URLを直接入力（任意）',
    'user.fourDigitPin': '4桁のPIN',
    'user.enterPin': '4桁のPINを入力',
    'user.username': 'ユーザー名',
    'user.enterUsername': 'ユーザー名を入力',
    'user.creating': '作成中...',
    'user.createUser': 'ユーザーを作成',
    
    // Actions
    'action.edit': '編集',
    'action.delete': '削除',
    'action.add': '追加',
    'action.save': '保存',
    'action.cancel': 'キャンセル',
    'action.confirm': '確認',
    'action.back': '戻る',
    'action.next': '次へ',
    
    // Common
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.warning': '警告',
    'common.info': '情報',
  }
}

/**
 * Initialize language from localStorage
 * Only runs once on first use
 */
function initializeLanguage() {
  if (isInitialized.value) return
  
  const savedLanguage = localStorage.getItem('zen-language')
  if (savedLanguage === 'ja' || savedLanguage === 'en') {
    currentLanguage.value = savedLanguage
  } else {
    currentLanguage.value = 'en'
  }
  
  isInitialized.value = true
}

/**
 * Toggle between English and Japanese
 */
function toggleLanguage() {
  currentLanguage.value = currentLanguage.value === 'en' ? 'ja' : 'en'
  localStorage.setItem('zen-language', currentLanguage.value)
}

/**
 * Set language explicitly
 */
function setLanguage(lang: Language) {
  currentLanguage.value = lang
  localStorage.setItem('zen-language', lang)
}

/**
 * Get translated text
 */
function t(key: string): string {
  const dict = translations[currentLanguage.value]
  return dict[key as keyof typeof dict] || key
}

/**
 * Language composable
 * 
 * Usage:
 * ```ts
 * import { useLanguage } from '@/composables/useLanguage'
 * 
 * const { currentLanguage, toggleLanguage, t } = useLanguage()
 * ```
 */
export function useLanguage() {
  // Initialize on first use
  initializeLanguage()
  
  return {
    currentLanguage: readonly(currentLanguage),
    toggleLanguage,
    setLanguage,
    t
  }
}

export default useLanguage
