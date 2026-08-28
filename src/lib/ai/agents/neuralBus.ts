import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { AgentId } from './agentRegistry';

export interface AgentMessage {
  id: string;
  fromAgent: AgentId;
  toAgent: AgentId;
  type: 'request' | 'response' | 'context_share' | 'memory_update';
  payload: any;
  priority: number;
  timestamp: string;
}

export async function sendAgentMessage(message: Omit<AgentMessage, 'id' | 'timestamp'>) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('agent_tasks')
    .insert({
      from_agent: message.fromAgent,
      to_agent: message.toAgent,
      task_type: message.type,
      payload: message.payload,
      priority: message.priority,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending agent message:', error);
    throw error;
  }
  return data;
}

export async function getAgentTasks(agentId: AgentId) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('agent_tasks')
    .select('*')
    .eq('to_agent', agentId)
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error getting agent tasks:', error);
    throw error;
  }
  return data;
}

export async function completeTask(taskId: string, output: any) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('agent_tasks')
    .update({
      status: 'completed',
      output: output,
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('Error completing task:', error);
    throw error;
  }
  return data;
}
