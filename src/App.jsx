import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { routes } from '@/app/router/routes'
import { queryClient } from '@/app/providers/queryClient'
import { subscribeToCrossTabTokenChange } from '@/lib/tokenStorage'
import { installAuthRefreshInterceptor } from '@/services/api/authRefreshInterceptor'

const router = createBrowserRouter(routes)

const removeAuthRefreshInterceptor = installAuthRefreshInterceptor(() => {
  queryClient.clear()

  const { pathname, search, hash } = router.state.location
  if (pathname === '/login') return

  void router.navigate('/login', {
    replace: true,
    state: { from: `${pathname}${search}${hash}` },
  })
})

const removeCrossTabSync = subscribeToCrossTabTokenChange(() => {
  queryClient.clear()
})

import.meta.hot?.dispose(() => {
  removeAuthRefreshInterceptor()
  removeCrossTabSync()
})

function App() {
  return <RouterProvider router={router} />
}

export default App
