import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSessionUser } from '@/lib/supabase/route-auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to view purchases' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Fetch course orders
    const { data: orders } = await admin
      .from('course_orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 2. Fetch active enrollments
    const { data: enrollments } = await admin
      .from('enrollments')
      .select('*')
      .eq('user_id', user.id);

    // 3. Fetch payment_transactions
    const { data: transactions } = await admin
      .from('payment_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const courseNames: Record<string, string> = {
      see_class_10: 'SEE Class 10 Board Exam Master Batch',
      cee_medical: 'CEE Medical Entrance Super Target Batch',
      ielts: 'IELTS Academic & General Target Band 8.0+',
      digital_marketing: 'Digital Marketing & Meta Ads Blueprint',
      artificial_intelligence: 'AI Academy: Prompt Studio & Python',
    };

    const purchases = (orders || []).map((o) => {
      const isEnrolled = (enrollments || []).some(
        (e) => e.program_id === o.course_id && e.status === 'active'
      );
      return {
        id: o.id,
        orderNumber: o.order_number,
        courseId: o.course_id,
        courseName: courseNames[o.course_id] || o.course_id,
        amount: o.final_amount_npr,
        currency: o.currency || 'NPR',
        gateway: o.gateway,
        status: o.status,
        createdAt: o.created_at,
        paidAt: o.paid_at,
        isEnrolled,
      };
    });

    return NextResponse.json({
      purchases,
      activeEnrollments: enrollments || [],
      transactions: transactions || [],
    });
  } catch (err: any) {
    console.error('API /api/my-purchases error:', err);
    return NextResponse.json({ error: 'Failed to fetch purchase history' }, { status: 500 });
  }
}
