/**
 * Samyak Tutor LMS — Normalized Core Type System
 * Covers all 36 canonical entities across Public, Student, Teacher, and Admin layers.
 */

// --- 1. Identity, Roles & Permissions ---
export type UserRoleType =
  | 'visitor'
  | 'student_free'
  | 'student_paid_see'
  | 'student_paid_cee'
  | 'student_all_access'
  | 'support_staff'
  | 'payment_staff'
  | 'content_manager'
  | 'teacher'
  | 'admin'
  | 'super_admin';

export type PermissionCode =
  | 'content:read'
  | 'content:preview'
  | 'content:create'
  | 'content:edit'
  | 'content:delete'
  | 'content:publish'
  | 'content:archive'
  | 'live:attend'
  | 'live:host'
  | 'live:record'
  | 'tests:attempt'
  | 'tests:create'
  | 'tests:grade'
  | 'tests:publish'
  | 'doubts:ask'
  | 'doubts:answer'
  | 'ai:tutor_unlimited'
  | 'ai:vision_marker'
  | 'orders:view'
  | 'orders:create'
  | 'orders:refund'
  | 'orders:verify'
  | 'enrollments:manage'
  | 'coupons:manage'
  | 'users:view'
  | 'users:edit'
  | 'users:assign_role'
  | 'settings:manage'
  | 'announcements:manage'
  | 'admin:access'
  | 'audit:view';

export interface User {
  id: string;
  email: string;
  phone?: string;
  created_at: string;
  last_sign_in_at?: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  role: UserRoleType;
  primary_program?: CanonicalCourseSlug;
  school_or_college?: string;
  district?: string;
  target_exam_year?: number;
  phone_verified: boolean;
  is_banned: boolean;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: UserRoleType;
  display_name: string;
  description: string;
  created_at: string;
}

export interface Permission {
  id: string;
  code: PermissionCode;
  display_name: string;
  category: 'content' | 'live' | 'assessment' | 'doubts' | 'ai' | 'commerce' | 'administration';
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  assigned_by?: string;
  assigned_at: string;
}

// --- 2. Courses, Batches & Curriculum ---
export type CanonicalCourseSlug =
  | 'see_class_10'
  | 'cee_medical'
  | 'neb_class_11'
  | 'neb_class_12'
  | 'ioe_engineering'
  | 'lok_sewa'
  | 'ielts'
  | 'digital_marketing'
  | 'artificial_intelligence';

export interface Course {
  id: string;
  slug: CanonicalCourseSlug;
  title: string;
  short_name: string;
  headline: string;
  description: string;
  category: 'academic_board' | 'medical_entrance' | 'language_exam' | 'career_skills';
  is_flagship: boolean;
  is_published: boolean;
  is_archived?: boolean;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  course_id: string;
  slug: string;
  title: string;
  academic_year: string;
  start_date: string;
  end_date: string;
  capacity?: number;
  is_enrollment_open: boolean;
  price_npr: number;
  discounted_price_npr?: number;
  lead_teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  batch_id: string;
  course_id: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  access_level: 'free_starter' | 'course_pass' | 'pro_pass' | 'all_access';
  starts_at: string;
  expires_at: string;
  order_id?: string;
  created_at: string;
}

export interface Subject {
  id: string;
  course_id: string;
  code: string;
  name: string;
  icon?: string;
  color_code?: string;
  display_order: number;
  total_chapters: number;
  created_at: string;
}

export interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  chapter_number: number;
  weightage_marks?: number;
  description?: string;
  is_free_preview: boolean;
  total_lessons: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  chapter_id: string;
  title: string;
  lesson_order: number;
  duration_minutes?: number;
  summary?: string;
  is_free_preview: boolean;
  is_published?: boolean;
  is_archived?: boolean;
  created_at: string;
}

export interface Video {
  id: string;
  lesson_id: string;
  bunny_video_id: string;
  bunny_library_id: string;
  title: string;
  duration_seconds: number;
  thumbnail_url?: string;
  hls_playlist_url?: string;
  created_at: string;
}

export interface Resource {
  id: string;
  lesson_id?: string;
  chapter_id?: string;
  title: string;
  file_type: 'pdf_notes' | 'model_question' | 'formula_sheet' | 'syllabus' | 'other';
  storage_path: string;
  file_size_bytes?: number;
  is_downloadable: boolean;
  is_premium_only: boolean;
  is_archived?: boolean;
  created_at: string;
}

// --- 3. Live Virtual Classroom & Attendance ---
export interface LiveClass {
  id: string;
  batch_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description?: string;
  hms_room_id: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  recording_video_id?: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  live_class_id: string;
  user_id: string;
  joined_at: string;
  left_at?: string;
  duration_seconds: number;
}

// --- 4. Assessment, Questions & Tests ---
export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'assertion_reason'
  | 'subjective_1_mark'
  | 'subjective_4_mark'
  | 'numerical';

export interface Question {
  id: string;
  subject_id: string;
  chapter_id?: string;
  question_type: QuestionType;
  content: string;
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  marks: number;
  negative_marks: number;
  source_exam?: 'NEB_BOARD_SEE' | 'MEC_CEE' | 'SAMYAK_ORIGINAL';
  source_year?: number;
  is_archived?: boolean;
  created_at: string;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_key: 'a' | 'b' | 'c' | 'd' | 'e';
  content: string;
  is_correct: boolean;
  option_explanation?: string;
}

export interface PracticeAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id?: string;
  is_correct: boolean;
  time_spent_seconds: number;
  created_at: string;
}

export interface Test {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  test_type: 'mock_exam' | 'chapter_quiz' | 'diagnostic_test' | 'grand_test';
  duration_minutes: number;
  total_questions: number;
  total_marks: number;
  negative_marking_ratio: number; // e.g. 0.25
  is_published: boolean;
  is_archived?: boolean;
  scheduled_at?: string;
  created_at: string;
}

export interface TestSection {
  id: string;
  test_id: string;
  subject_id: string;
  title: string;
  display_order: number;
  question_count: number;
  marks_per_question: number;
  negative_marks_per_question: number;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  user_id: string;
  status: 'in_progress' | 'submitted' | 'auto_submitted' | 'abandoned';
  started_at: string;
  submitted_at?: string;
  tab_switch_count: number;
}

export interface Answer {
  id: string;
  test_attempt_id: string;
  question_id: string;
  selected_option_id?: string;
  subjective_answer_text?: string;
  subjective_image_url?: string;
  is_correct?: boolean;
  marks_awarded: number;
  negative_marks_deducted: number;
  time_spent_seconds: number;
}

export interface TestResult {
  id: string;
  test_attempt_id: string;
  user_id: string;
  test_id: string;
  total_score: number;
  correct_count: number;
  incorrect_count: number;
  unattempted_count: number;
  accuracy_percentage: number;
  percentile_rank?: number;
  national_rank?: number;
  evaluated_at: string;
}

export interface Mistake {
  id: string;
  user_id: string;
  question_id: string;
  test_attempt_id?: string;
  error_category: 'conceptual' | 'calculation' | 'misread' | 'time_pressure' | 'unspecified';
  user_notes?: string;
  is_resolved: boolean;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  entity_type: 'question' | 'lesson' | 'resource';
  entity_id: string;
  folder_name?: string;
  created_at: string;
}

export interface Progress {
  id: string;
  user_id: string;
  chapter_id: string;
  lessons_completed: number;
  total_lessons: number;
  mcqs_practiced: number;
  accuracy_percentage: number;
  last_activity_at: string;
}

export interface StudyPlan {
  id: string;
  user_id: string;
  target_exam: CanonicalCourseSlug;
  target_score: string;
  daily_study_hours: number;
  plan_json: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

// --- 5. Doubts & Communication ---
export interface Doubt {
  id: string;
  user_id: string;
  subject_id: string;
  chapter_id?: string;
  title: string;
  content: string;
  image_url?: string;
  status: 'open' | 'answered' | 'closed';
  upvotes_count: number;
  created_at: string;
}

export interface DoubtReply {
  id: string;
  doubt_id: string;
  author_id: string;
  author_role: 'teacher' | 'ai_tutor' | 'student';
  content: string;
  is_accepted_solution: boolean;
  created_at: string;
}

export interface Announcement {
  id: string;
  batch_id?: string;
  course_id?: string;
  author_id: string;
  title: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  link_url?: string;
  type: 'live_class' | 'exam_result' | 'doubt_reply' | 'announcement' | 'billing';
  is_read: boolean;
  created_at: string;
}

// --- 6. Commerce, Orders & Subscriptions ---
export interface Order {
  id: string;
  user_id: string;
  batch_id: string;
  plan_sku: string;
  gross_amount_npr: number;
  discount_amount_npr: number;
  net_amount_npr: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  coupon_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  user_id: string;
  gateway: 'fonepay' | 'esewa' | 'manual_bank';
  gateway_ref: string;
  amount_npr: number;
  status: 'initiated' | 'verified' | 'rejected';
  raw_response?: Record<string, any>;
  verified_at?: string;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'flat_npr' | 'percentage';
  discount_value: number;
  min_order_amount_npr: number;
  max_discount_npr?: number;
  applicable_course_id?: string;
  usage_limit: number;
  times_used: number;
  expires_at: string;
  is_active: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan_sku: string;
  status: 'active' | 'grace_period' | 'cancelled' | 'expired';
  current_period_start: string;
  current_period_end: string;
  created_at: string;
}

// --- 7. Gamification & Governance ---
export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  badge_icon: string;
  xp_points: number;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes_diff?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
