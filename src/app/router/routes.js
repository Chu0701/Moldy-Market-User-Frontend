import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { RouteErrorPage } from '@/features/system/pages/RouteErrorPage'
import { RouteLoading } from '@/components/feedback/RouteLoading'
import { GuestOnly } from '@/app/router/GuestOnly'

/** @type {import('react-router').RouteObject[]} */
export const routes = [
  {
    // An error here replaces the failed branch with a translated recovery screen.
    ErrorBoundary: RouteErrorPage,
    HydrateFallback: RouteLoading,
    children: [
      {
        Component: MainLayout,
        // A child renders inside MainLayout's Outlet; the header and footer stay mounted.
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import('@/features/marketplace/pages/HomePage')).HomePage,
            }),
          },
          {
            path: 'products',
            lazy: async () => ({
              Component: (await import('@/features/products/pages/ProductListPage'))
                .ProductListPage,
            }),
          },
          {
            path: 'products/:productId',
            lazy: async () => ({
              Component: (await import('@/features/products/pages/ProductDetailPage'))
                .ProductDetailPage,
            }),
          },
          {
            path: 'categories/:categoryId',
            lazy: async () => ({
              Component: (await import('@/features/marketplace/pages/CategoryPage')).CategoryPage,
            }),
          },
        ],
      },
      {
        Component: AuthLayout,
        children: [
          {
            path: 'login',
            Component: GuestOnly,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/auth/pages/LoginPage')).LoginPage,
                }),
              },
            ],
          },
          {
            path: 'register',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/RegisterPage')).RegisterPage,
            }),
          },
          {
            // The wildcard is a real 404 page, rather than a silent redirect home.
            path: '*',
            lazy: async () => ({
              Component: (await import('@/features/system/pages/NotFoundPage')).NotFoundPage,
            }),
          },
        ],
      },
    ],
  },
]
