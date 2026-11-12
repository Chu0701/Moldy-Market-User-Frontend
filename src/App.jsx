import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { routes } from '@/app/router/routes'
import { queryClient } from '@/app/providers/queryClient'
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

import.meta.hot?.dispose(removeAuthRefreshInterceptor)

function App() {
  return <RouterProvider router={router} />
}

export default App
