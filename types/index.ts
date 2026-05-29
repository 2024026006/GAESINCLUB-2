export type EnrollmentStatus = 'enrolled' | 'leave' | 'graduated'
export type ClubCategory = '교양' | '학술' | '문화' | '봉사' | '체육' | '종교'
export type ClubStatus = 'active' | 'inactive' | 'deleted'
export type RecruitStatus = 'open' | 'closed'
export type MemberRole = 'president' | 'staff' | 'treasurer' | 'member'
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'on_hold'
export type VoteType = 'attend' | 'absent' | 'undecided'
export type GalleryItemType = 'image' | 'video' | 'document'
export type ActivityType = 'attendance' | 'post' | 'comment' | 'event' | 'vote'
export type NotificationType =
  | 'join_request'
  | 'join_approved'
  | 'join_rejected'
  | 'new_post'
  | 'new_message'
  | 'event_reminder'
  | 'dues_request'

export interface Profile {
  id: string
  name: string | null
  student_id: string | null
  department: string | null
  college: string | null
  enrollment_status: EnrollmentStatus | null
  phone: string | null
  point: number
  created_at: string
}

export interface Club {
  id: string
  name: string
  category: ClubCategory
  short_desc: string | null
  description: string | null
  recruit_status: RecruitStatus
  status: ClubStatus
  founded_year: number | null
  created_at: string
  updated_at: string
  member_count?: number
}

export interface ClubMember {
  id: string
  club_id: string
  user_id: string
  role: MemberRole
  joined_at: string
  profile?: Profile
  club?: Club
}

export interface JoinRequest {
  id: string
  club_id: string
  user_id: string
  message: string | null
  status: JoinRequestStatus
  requested_at: string
  profile?: Profile
  club?: Club
}

export interface Post {
  id: string
  club_id: string
  author_id: string
  title: string
  content: string
  is_pinned: boolean
  like_count: number
  created_at: string
  updated_at: string
  author?: Profile
  is_read?: boolean
  is_liked?: boolean
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  parent_id: string | null
  content: string
  created_at: string
  author?: Profile
  replies?: Comment[]
}

export interface Event {
  id: string
  club_id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  location: string | null
  is_recurring: boolean
  created_at: string
  votes?: EventVote[]
}

export interface EventVote {
  event_id: string
  user_id: string
  vote: VoteType
}

export interface Message {
  id: string
  channel: string
  sender_id: string
  content: string | null
  image_url: string | null
  created_at: string
  sender?: Profile
}

export interface Album {
  id: string
  club_id: string
  title: string
  created_at: string
  cover_url?: string
  item_count?: number
}

export interface GalleryItem {
  id: string
  club_id: string
  album_id: string | null
  uploader_id: string
  storage_path: string
  caption: string | null
  type: GalleryItemType
  created_at: string
  uploader?: Profile
}

export interface DuesIncome {
  id: string
  club_id: string
  payer_id: string
  amount: number
  paid_at: string
  note: string | null
  created_at: string
  payer?: Profile
}

export interface DuesExpense {
  id: string
  club_id: string
  item: string
  amount: number
  spent_at: string
  receipt_url: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface ActivityLog {
  id: string
  user_id: string
  club_id: string
  type: ActivityType
  point: number
  created_at: string
}
