/** @param {{ children: import('react').ReactNode }} props */
export function ProductGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 lg:gap-6">
      {children}
    </div>
  )
}
