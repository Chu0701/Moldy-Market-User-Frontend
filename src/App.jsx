import { createBrowserRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'

import { routes } from '@/app/router/routes'

// Create the router once so React renders do not reset navigation state.
const router = createBrowserRouter(routes)

function App() {
  return <RouterProvider router={router} />
}

export default App
