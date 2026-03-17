// API Route：AI 行為分析結果
// GET  /api/ai-analysis?date=YYYY-MM-DD — 取得指定日期的 AI 分析結果
// POST /api/ai-analysis                 — 儲存 AI 分析結果（每日限一筆）
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * GET /api/ai-analysis?date=YYYY-MM-DD
 * 取得使用者指定日期的 AI 分析結果
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date' }, { status: 400 })

  const { data, error } = await supabase
    .from('ai_analysis_results')
    .select('*')
    .eq('user_id', user.id)
    .eq('record_date', date)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

/**
 * POST /api/ai-analysis
 * 儲存 AI 分析結果，同一用戶同一天只保留一筆（upsert）
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { record_date, analysis, triage_class } = body

  const { error } = await supabase
    .from('ai_analysis_results')
    .upsert(
      {
        user_id: user.id,
        record_date,
        analysis_date: record_date,
        practitioner_output: analysis.practitioner_output,
        client_output: analysis.client_output,
        behavior_tags: analysis.behavior_tags,
        triage_class,
        confidence_score: analysis.practitioner_output?.confidence_score ?? null,
        summary: analysis.client_output?.pattern_type ?? '',
      },
      { onConflict: 'user_id,record_date' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}