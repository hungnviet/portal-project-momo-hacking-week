import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Starting database debug...');
    
    // Test 1: Check Supabase connection
    console.log('Environment check:');
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('SUPABASE_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    // Test 2: Try to get table schema/info
    console.log('📋 Checking available tables...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_info')
      .single();
    
    if (tablesError) {
      console.log('Schema check failed (this is normal):', tablesError.message);
    }

    // Test 3: Try different table names
    const tableTests = ['Project', 'project', 'projects', 'Projects'];
    const results: Record<string, any> = {};

    for (const tableName of tableTests) {
      console.log(`🔍 Testing table name: ${tableName}`);
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .limit(5);
      
      results[tableName] = {
        error: error?.message || null,
        count: count,
        hasData: data && data.length > 0,
        firstRecord: data?.[0] || null
      };
      
      console.log(`Result for ${tableName}:`, results[tableName]);
    }

    // Test 4: Try raw SQL query (if available)
    console.log('🔍 Trying raw SQL query...');
    const { data: sqlData, error: sqlError } = await supabase
      .rpc('exec_sql', { 
        sql: 'SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';' 
      });
    
    if (sqlError) {
      console.log('SQL query failed (this is normal):', sqlError.message);
    } else {
      console.log('Available tables:', sqlData);
    }

    // Test 5: Check RLS policies
    console.log('🔒 Checking if RLS might be blocking...');
    const { data: rlsTest, error: rlsError } = await supabase
      .from('Project')
      .select('count')
      .limit(1);

    return NextResponse.json({
      status: 'debug',
      message: 'Database debug complete',
      data: {
        environment: {
          hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          url: process.env.NEXT_PUBLIC_SUPABASE_URL
        },
        tableTests: results,
        rlsTest: {
          error: rlsError?.message || null,
          data: rlsTest
        },
        sqlTest: {
          error: sqlError?.message || null,
          data: sqlData
        }
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({
      status: 'error',
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      data: null
    }, { status: 500 });
  }
}
