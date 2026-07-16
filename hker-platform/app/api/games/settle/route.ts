import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// 每人每天透過遊戲能增減的積分上限（正負都算），防止刷分或惡意扣分攻擊
const DAILY_GAME_POINTS_CAP = 100

// 允許的遊戲代號，避免 reason 欄位被任意字串灌入
const ALLOWED_GAMES = ['slot-machine', 'xiao-mali', 'roulette', 'fish-prawn-crab']

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 用伺服器端 session 驗證身分，不相信前端傳來的任何使用者 ID
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ success: false, message: '請先登入才能記錄遊戲積分' }, { status: 401 })
    }

    const body = await req.json()
    const game: string = body?.game
    let delta: number = Number(body?.delta)

    if (!ALLOWED_GAMES.includes(game)) {
      return Response.json({ success: false, message: '未知的遊戲代號' }, { status: 400 })
    }
    if (!Number.isFinite(delta)) {
      return Response.json({ success: false, message: '無效的分數' }, { status: 400 })
    }

    // 單次結算也做上限保護，避免異常大量分數一次灌入
    delta = Math.max(-DAILY_GAME_POINTS_CAP, Math.min(DAILY_GAME_POINTS_CAP, Math.round(delta)))

    // 檢查今天累積透過遊戲拿到的分數，超過上限就按比例縮減
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const { data: todayEntries } = await supabase
      .from('points_ledger')
      .select('delta')
      .eq('user_id', user.id)
      .like('reason', 'game:%')
      .gte('created_at', todayStart.toISOString())

    const todayTotal = (todayEntries ?? []).reduce((sum, e) => sum + e.delta, 0)
    const remainingAllowance = DAILY_GAME_POINTS_CAP - todayTotal

    if (delta > 0 && remainingAllowance <= 0) {
      return Response.json({ success: true, applied: 0, message: '今日遊戲積分已達上限' })
    }
    if (delta > 0) {
      delta = Math.min(delta, remainingAllowance)
    }

    // 寫入異動紀錄
    const { error: ledgerError } = await supabase.from('points_ledger').insert({
      user_id: user.id,
      delta,
      reason: `game:${game}`,
    })
    if (ledgerError) {
      console.error('[games/settle] ledger insert failed:', ledgerError.message)
      return Response.json({ success: false, message: '寫入積分紀錄失敗' }, { status: 500 })
    }

    // 更新使用者總積分（用資料庫層級的原子加法，避免併發時互相覆蓋）
    const { error: rpcError } = await supabase.rpc('increment_user_points', {
      user_id_input: user.id,
      delta_input: delta,
    })
    if (rpcError) {
      console.error('[games/settle] increment_user_points failed:', rpcError.message)
      return Response.json({ success: false, message: '更新積分失敗' }, { status: 500 })
    }

    return Response.json({ success: true, applied: delta })
  } catch (e) {
    console.error('[games/settle] error:', (e as Error).message)
    return Response.json({ success: false, message: '伺服器錯誤' }, { status: 500 })
  }
}
