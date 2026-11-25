import {
  Armchair,
  ArrowUpRight,
  Baby,
  Bike,
  BookOpen,
  Dumbbell,
  Gamepad2,
  Laptop,
  Music,
  PawPrint,
  Shirt,
  Sparkles,
  Tag,
  Utensils,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { cn } from '@/lib/utils'

const CATEGORY_STYLE_RULES = [
  [
    /điện tử|electronic|công nghệ|tech|phone|laptop/i,
    Laptop,
    'bg-sky-50 text-sky-700 border-sky-200/70',
  ],
  [
    /thời trang|fashion|quần|áo|giày|clothing/i,
    Shirt,
    'bg-rose-50 text-rose-700 border-rose-200/70',
  ],
  [/nội thất|furniture|nhà cửa|home/i, Armchair, 'bg-amber-50 text-amber-700 border-amber-200/70'],
  [/sách|book|truyện|văn học/i, BookOpen, 'bg-emerald-50 text-emerald-700 border-emerald-200/70'],
  [
    /gia dụng|nhà bếp|kitchen|appliance/i,
    Utensils,
    'bg-orange-50 text-orange-700 border-orange-200/70',
  ],
  [
    /xe cộ|xe đạp|xe máy|vehicle|bike|motor/i,
    Bike,
    'bg-indigo-50 text-indigo-700 border-indigo-200/70',
  ],
  [/thể thao|dã ngoại|sport|outdoor|gym/i, Dumbbell, 'bg-teal-50 text-teal-700 border-teal-200/70'],
  [
    /nhạc cụ|âm thanh|music|audio|guitar/i,
    Music,
    'bg-violet-50 text-violet-700 border-violet-200/70',
  ],
  [
    /đồ chơi|sưu tầm|toy|collectible|game|lego/i,
    Gamepad2,
    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200/70',
  ],
  [/mẹ|bé|baby|kid|trẻ em/i, Baby, 'bg-pink-50 text-pink-700 border-pink-200/70'],
  [
    /làm đẹp|chăm sóc|beauty|cosmetic|nước hoa/i,
    Sparkles,
    'bg-purple-50 text-purple-700 border-purple-200/70',
  ],
  [/thú cưng|pet|chó|mèo/i, PawPrint, 'bg-lime-50 text-lime-700 border-lime-200/70'],
]

function getCategoryTint(name) {
  const normalized = String(name ?? '')
  for (const [pattern, , tint] of CATEGORY_STYLE_RULES) {
    if (pattern.test(normalized)) return tint
  }
  return 'bg-surface-subtle text-foreground border-border/80'
}

function CategoryIcon({ name, className }) {
  const normalized = String(name ?? '')
  for (const [pattern, Icon] of CATEGORY_STYLE_RULES) {
    if (pattern.test(normalized)) {
      return <Icon className={className} />
    }
  }
  return <Tag className={className} />
}

/** @param {{ name: string, to: string, subCount?: number, productCount?: number }} props */
export function CategoryCard({ name, to, subCount = 0, productCount }) {
  const { t } = useTranslation()
  const iconTint = getCategoryTint(name)
  const hasProductCount = typeof productCount === 'number' && productCount > 0

  return (
    <Link
      to={to}
      aria-label={name}
      className="group flex min-h-16 min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground transition-[transform,border-color,background-color,box-shadow] duration-150 outline-none hover:-translate-y-0.5 hover:border-foreground/45 hover:bg-surface-subtle/70 hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transform-none"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className={cn(
            'inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-transform duration-150 group-hover:scale-105 motion-reduce:transform-none',
            iconTint,
          )}
        >
          <CategoryIcon name={name} className="size-4" />
        </span>
        <div className="min-w-0">
          <span className="line-clamp-2 block text-sm leading-5 font-medium break-words">
            {name}
          </span>
          {hasProductCount ? (
            <span
              aria-hidden="true"
              className="mt-0.5 block text-[11px] leading-4 text-muted-foreground tabular-nums"
            >
              {t('categories.productCount', { count: productCount })}
            </span>
          ) : subCount > 0 ? (
            <span
              aria-hidden="true"
              className="mt-0.5 block text-[11px] leading-4 text-muted-foreground"
            >
              {t('categories.subCategoryCount', { count: subCount })}
            </span>
          ) : null}
        </div>
      </div>

      <ArrowUpRight
        aria-hidden="true"
        className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground motion-reduce:transform-none"
      />
    </Link>
  )
}
