import { redirect } from 'react-router'

import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { RouteErrorPage } from '@/features/system/pages/RouteErrorPage'
import { RouteLoading } from '@/components/feedback/RouteLoading'
import { GuestOnly } from '@/app/router/GuestOnly'
import { RequireAuth } from '@/app/router/RequireAuth'

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
          {
            path: 'stores/:storeId',
            lazy: async () => ({
              Component: (await import('@/features/stores/pages/StorePublicPage')).StorePublicPage,
            }),
          },

          {
            path: 'profile',
            Component: RequireAuth,
            children: [
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('@/features/profile/pages/ProfilePage')).ProfilePage,
                }),
              },
              {
                path: 'edit',
                lazy: async () => ({
                  Component: (await import('@/features/profile/pages/ProfileEditPage'))
                    .ProfileEditPage,
                }),
              },
            ],
          },
          {
            Component: RequireAuth,
            children: [
              {
                path: 'cart',
                lazy: async () => ({
                  Component: (await import('@/features/cart/pages/CartPage')).CartPage,
                }),
              },
              {
                path: 'notifications',
                lazy: async () => ({
                  Component: (await import('@/features/notifications/pages/NotificationsPage'))
                    .NotificationsPage,
                }),
              },
              {
                path: 'checkout',
                lazy: async () => ({
                  Component: (await import('@/features/checkout/pages/CheckoutPage')).CheckoutPage,
                }),
              },
              {
                path: 'checkout/:checkoutGroupId',
                lazy: async () => ({
                  Component: (await import('@/features/checkout/pages/CheckoutPaymentPage'))
                    .CheckoutPaymentPage,
                }),
              },
              {
                path: 'orders',
                lazy: async () => ({
                  Component: (await import('@/features/orders/pages/OrderListPage')).OrderListPage,
                }),
              },
              {
                path: 'orders/:orderId',
                lazy: async () => ({
                  Component: (await import('@/features/orders/pages/OrderDetailPage'))
                    .OrderDetailPage,
                }),
              },
              {
                path: 'chat',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
                }),
              },
              {
                path: 'chat/:conversationId',
                lazy: async () => ({
                  Component: (await import('@/features/chat/pages/ChatPage')).ChatPage,
                }),
              },
              {
                path: 'my-products',
                lazy: async () => ({
                  Component: (await import('@/features/products/pages/MyProductsPage'))
                    .MyProductsPage,
                }),
              },
              {
                path: 'store/profile',
                lazy: async () => ({
                  Component: (await import('@/features/stores/pages/StoreProfilePage'))
                    .StoreProfilePage,
                }),
              },
              {
                path: 'store/staff',
                lazy: async () => ({
                  Component: (await import('@/features/stores/pages/StoreStaffPage'))
                    .StoreStaffPage,
                }),
              },
              {
                path: 'store/orders',
                lazy: async () => ({
                  Component: (await import('@/features/orders/pages/StoreOrdersPage'))
                    .StoreOrdersPage,
                }),
              },
              {
                path: 'store/products',
                lazy: async () => ({
                  Component: (await import('@/features/stores/pages/StoreProductsPage'))
                    .StoreProductsPage,
                }),
              },
              {
                path: 'my-products/new',
                loader: () => redirect('/store/products/new'),
              },
              {
                path: 'store/products/new',
                lazy: async () => ({
                  Component: (await import('@/features/products/pages/ProductCreatePage'))
                    .ProductCreatePage,
                }),
              },
              {
                path: 'store/products/:productId/edit',
                lazy: async () => ({
                  Component: (await import('@/features/products/pages/ProductEditPage'))
                    .ProductEditPage,
                }),
              },
              {
                path: 'my-products/:productId/edit',
                lazy: async () => ({
                  Component: (await import('@/features/products/pages/ProductEditPage'))
                    .ProductEditPage,
                }),
              },
              {
                path: 'account/settings',
                lazy: async () => ({
                  Component: (await import('@/features/profile/pages/AccountSettingsPage'))
                    .AccountSettingsPage,
                }),
              },
              {
                path: 'open-store',
                lazy: async () => ({
                  Component: (await import('@/features/stores/pages/OpenStorePage')).OpenStorePage,
                }),
              },
              {
                path: 'store',
                lazy: async () => ({
                  Component: (await import('@/features/stores/pages/StoreOverviewPage'))
                    .StoreOverviewPage,
                }),
              },
            ],
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
            path: 'verify-email',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/VerifyEmailPage')).VerifyEmailPage,
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
