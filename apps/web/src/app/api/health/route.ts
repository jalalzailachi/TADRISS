import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Verify database connectivity
    const { error } = await supabase.from("institutions").select('id').limit(1);
    
    if (error) throw error;
    
    return NextResponse.json({ 
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({
      status: 'error',
      message: getErrorMessage(err, 'Health check failed'),
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}