// API Route：每日健康調理記錄
// GET  /api/daily-record?date=YYYY-MM-DD — 取得指定日期的完整記錄
// POST /api/daily-record                 — 建立或更新當日完整記錄
import { createClient } from '@/lib/supabase/server'
import { NextResponse, type NextRequest } from 'next/server'
import type { DailyRecordPayload } from '@/types'

/**
 * GET /api/daily-record?date=YYYY-MM-DD
 * 取得使用者指定日期的記錄，包含所有子表與標籤關聯
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const date = request.nextUrl.searchParams.get('date')
  if (!date) return NextResponse.json({ error: 'Missing date parameter' }, { status: 400 })

  const { data, error } = await supabase
    .from('daily_records')
    .select(`
      id,
      chief_complaint,
      sleep_logs(*),
      diet_logs(*),
      body_sensation_logs(
        *,
        body_sensation_area_tags(tag_id),
        body_sensation_type_tags(tag_id)
      ),
      wellness_logs(
        *,
        wellness_log_tags(tag_id)
      )
    `)
    .eq('user_id', user.id)
    .eq('record_date', date)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

/**
 * POST /api/daily-record
 * 建立或更新使用者當日完整記錄
 * 採用「刪除後重新插入」策略，確保資料一致性
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payload: DailyRecordPayload = await request.json()
  const { record_date, chief_complaint, sleep, diet, body_sensation, wellness } = payload

  // 1. Upsert daily_records，取得 record_id（同時寫入主訴欄位）
  const { data: record, error: recordError } = await supabase
    .from('daily_records')
    .upsert(
      {
        user_id: user.id,
        record_date,
        chief_complaint: chief_complaint.trim() || null,
      },
      { onConflict: 'user_id,record_date' }
    )
    .select('id')
    .single()

  if (recordError) return NextResponse.json({ error: recordError.message }, { status: 500 })
  const recordId = record.id

  // 2. 睡眠記錄：刪除後重新插入（每日最多一筆）
  await supabase.from('sleep_logs').delete().eq('record_id', recordId)
  const hasSleepData = sleep.sleep_time || sleep.wake_time || sleep.quality_score
  if (hasSleepData) {
    const duration = calcSleepDuration(sleep.sleep_time, sleep.wake_time)
    const { error } = await supabase.from('sleep_logs').insert({
      record_id: recordId,
      sleep_time: sleep.sleep_time || null,
      wake_time: sleep.wake_time || null,
      duration_hours: duration,
      quality_score: sleep.quality_score,
      notes: sleep.notes || null,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 3. 飲食記錄：刪除後重新插入（每日可多筆）
  await supabase.from('diet_logs').delete().eq('record_id', recordId)
  const validDiet = diet.filter(d => d.description.trim() || d.water_intake_ml)
  if (validDiet.length > 0) {
    const { error } = await supabase.from('diet_logs').insert(
      validDiet.map(d => ({
        record_id: recordId,
        meal_type: d.meal_type || null,
        description: d.description.trim() || null,
        water_intake_ml: d.water_intake_ml ? parseInt(d.water_intake_ml) : null,
        notes: d.notes.trim() || null,
      }))
    )
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 4. 身體感受記錄：刪除後重新插入（cascade 自動清除 junction 表）
  await supabase.from('body_sensation_logs').delete().eq('record_id', recordId)
  const hasBodyData =
    body_sensation.energy_level ||
    body_sensation.stress_level ||
    body_sensation.mood_score ||
    body_sensation.custom_note.trim() ||
    body_sensation.area_tag_ids.length > 0 ||
    body_sensation.sensation_type_tag_ids.length > 0

  if (hasBodyData) {
    const { data: sensLog, error: sensError } = await supabase
      .from('body_sensation_logs')
      .insert({
        record_id: recordId,
        energy_level: body_sensation.energy_level,
        stress_level: body_sensation.stress_level,
        mood_score: body_sensation.mood_score,
        custom_note: body_sensation.custom_note.trim() || null,
      })
      .select('id')
      .single()

    if (sensError) return NextResponse.json({ error: sensError.message }, { status: 500 })

    // 插入身體部位標籤關聯
    if (body_sensation.area_tag_ids.length > 0) {
      await supabase.from('body_sensation_area_tags').insert(
        body_sensation.area_tag_ids.map(tag_id => ({
          sensation_log_id: sensLog.id,
          tag_id,
        }))
      )
    }

    // 插入感受類型標籤關聯
    if (body_sensation.sensation_type_tag_ids.length > 0) {
      await supabase.from('body_sensation_type_tags').insert(
        body_sensation.sensation_type_tag_ids.map(tag_id => ({
          sensation_log_id: sensLog.id,
          tag_id,
        }))
      )
    }
  }

  // 5. 調理項目記錄：刪除後逐筆插入（cascade 自動清除 junction 表）
  await supabase.from('wellness_logs').delete().eq('record_id', recordId)
  const validWellness = wellness.filter(
    w => w.tag_ids.length > 0 || w.duration_minutes || w.custom_note.trim()
  )
  for (const w of validWellness) {
    const { data: wLog, error: wError } = await supabase
      .from('wellness_logs')
      .insert({
        record_id: recordId,
        duration_minutes: w.duration_minutes ? parseInt(w.duration_minutes) : null,
        custom_note: w.custom_note.trim() || null,
      })
      .select('id')
      .single()

    if (wError) return NextResponse.json({ error: wError.message }, { status: 500 })

    // 插入調理活動標籤關聯
    if (wLog && w.tag_ids.length > 0) {
      await supabase.from('wellness_log_tags').insert(
        w.tag_ids.map(tag_id => ({
          wellness_log_id: wLog.id,
          tag_id,
        }))
      )
    }
  }

  return NextResponse.json({ success: true, record_id: recordId })
}

/**
 * 計算睡眠時數，支援跨日（例如 23:00 入睡、07:00 起床）
 */
function calcSleepDuration(sleepTime: string, wakeTime: string): number | null {
  if (!sleepTime || !wakeTime) return null
  const [sh, sm] = sleepTime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let minutes = (wh * 60 + wm) - (sh * 60 + sm)
  if (minutes < 0) minutes += 24 * 60  // 跨日補正
  return Math.round((minutes / 60) * 100) / 100
}
