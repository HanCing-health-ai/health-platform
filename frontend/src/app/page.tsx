import { redirect } from 'next/navigation'

// 根路由：導向 Dashboard（未登入者由 middleware 自動重導至 /login）
export default function RootPage() {
  redirect('/dashboard')
}
