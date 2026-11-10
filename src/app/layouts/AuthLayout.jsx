import { Outlet } from 'react-router'

import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Logo } from '@/components/common/Logo'

export function AuthLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-8">
        <Logo />
        <LanguageSwitcher />
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-8">
        <Outlet />
      </main>
    </div>
  )
}
