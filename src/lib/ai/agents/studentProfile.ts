import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export interface StudentLearningProfile {
  student_id: string;
  weak_topics: string[];
  strong_topics: string[];
  misconceptions: string[];
  learning_preferences: Record<string, any>;
  last_updated: string;
}

export async function getStudentProfile(userId: string): Promise<StudentLearningProfile | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('get_student_learning_context', {
    p_user_id: userId
  });

  if (error) {
    console.error('Error getting student profile:', error);
    return null;
  }
  
  return (Array.isArray(data) ? data[0] : data) as StudentLearningProfile | null;
}

export async function updateStudentMemory(userId: string, updates: Partial<StudentLearningProfile>) {
  const admin = createAdminClient();
  const { error } = await admin
    .from('agent_memory')
    .upsert({
      user_id: userId,
      ...updates,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error updating student memory:', error);
    throw error;
  }
}

export async function addWeakTopic(userId: string, topic: string) {
  const profile = await getStudentProfile(userId);
  const weakTopics = Array.from(new Set([...(profile?.weak_topics || []), topic]));
  await updateStudentMemory(userId, { weak_topics: weakTopics });
}

export async function addStrongTopic(userId: string, topic: string) {
  const profile = await getStudentProfile(userId);
  const strongTopics = Array.from(new Set([...(profile?.strong_topics || []), topic]));
  await updateStudentMemory(userId, { strong_topics: strongTopics });
}

export async function addMisconception(userId: string, misconception: string) {
  const profile = await getStudentProfile(userId);
  const misconceptions = Array.from(new Set([...(profile?.misconceptions || []), misconception]));
  await updateStudentMemory(userId, { misconceptions });
}

export async function updatePreference(userId: string, key: string, value: any) {
  const profile = await getStudentProfile(userId);
  const preferences = { ...(profile?.learning_preferences || {}), [key]: value };
  await updateStudentMemory(userId, { learning_preferences: preferences });
}
