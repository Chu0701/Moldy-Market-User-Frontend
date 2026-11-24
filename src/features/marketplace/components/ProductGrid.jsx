/** @param {{ children: import('react').ReactNode }} props */
export function ProductGrid({ children }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  )
}
