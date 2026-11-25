import { redirect } from 'react-router'

import { AuthLayout } from '@/app/layouts/AuthLayout'
import { MainLayout } from '@/app/layouts/MainLayout'
import { AppraiserLayout } from '@/app/layouts/AppraiserLayout'
import { StoreDashboardLayout } from '@/app/layouts/StoreDashboardLayout'
import { RouteErrorPage } from '@/features/system/pages/RouteErrorPage'
import { RouteLoading } from '@/components/feedback/RouteLoading'
import { GuestOnly } from '@/app/router/GuestOnly'
import { RequireAuth } from '@/app/router/RequireAuth'
import { RequireRole } from '@/app/router/RequireRole'

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
          ...(import.meta.env.DEV
            ? [
                {
                  path: '__preview/appraiser',
                  children: [
                    { index: true, loader: () => redirect('/__preview/appraiser/queue') },
                    {
                      path: 'requests/:requestId',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserRequestDetailPage')
                        ).AppraiserRequestDetailPage,
                      }),
                    },
                    {
                      path: 'profile',
                      lazy: async () => ({
                        Component: (await import('@/features/appraiser/pages/AppraiserProfilePage'))
                          .AppraiserProfilePage,
                      }),
                    },
                    {
                      path: 'queue',
                      lazy: async () => ({
                        Component: (await import('@/features/appraiser/pages/AppraiserQueuePage'))
                          .AppraiserQueuePage,
                      }),
                    },
                    {
                      path: 'applications',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserApplicationsPage')
                        ).AppraiserApplicationsPage,
                      }),
                    },
                    {
                      path: 'invitations',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserInvitationsPage')
                        ).AppraiserInvitationsPage,
                      }),
                    },
                    {
                      path: 'assignments',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserAssignmentsPage')
                        ).AppraiserAssignmentsPage,
                      }),
                    },
                    {
                      path: 'assignments/:assignmentId',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserAssignmentDetailPage')
                        ).AppraiserAssignmentDetailPage,
                      }),
                    },
                    {
                      path: 'commissions',
                      lazy: async () => ({
                        Component: (
                          await import('@/features/appraiser/pages/AppraiserCommissionsPage')
                        ).AppraiserCommissionsPage,
                      }),
                    },
                  ],
                },
              ]
            : []),
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
                path: 'appraisers',
                lazy: async () => ({
                  Component: (await import('@/features/appraiser/pages/AppraiserDirectoryPage'))
                    .AppraiserDirectoryPage,
                }),
              },
              {
                path: 'appraisers/:appraiserId',
                lazy: async () => ({
                  Component: (await import('@/features/appraiser/pages/PublicAppraiserPage'))
                    .PublicAppraiserPage,
                }),
              },
              {
                path: 'appraisals',
                lazy: async () => ({
                  Component: (await import('@/features/appraiser/pages/SellerAppraisalsPage'))
                    .SellerAppraisalsPage,
                }),
              },
              {
                path: 'appraisals/requests/:requestId',
                lazy: async () => ({
                  Component: (await import('@/features/appraiser/pages/SellerAppraisalRequestPage'))
                    .SellerAppraisalRequestPage,
                }),
              },
              {
                path: 'appraisals/assignments/:assignmentId',
                lazy: async () => ({
                  Component: (
                    await import('@/features/appraiser/pages/SellerAppraisalAssignmentPage')
                  ).SellerAppraisalAssignmentPage,
                }),
              },
              {
                path: 'admin/appraisers',
                lazy: async () => ({
                  Component: (await import('@/app/router/RequireAdminRole')).RequireAdminRole,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('@/features/appraiser/pages/AdminAppraisersPage'))
                        .AdminAppraisersPage,
                    }),
                  },
                ],
              },
              {
                path: 'admin/commissions',
                lazy: async () => ({
                  Component: (await import('@/app/router/RequireAdminRole')).RequireAdminRole,
                }),
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (
                        await import('@/features/appraiser/pages/AdminCommissionUnavailablePage')
                      ).AdminCommissionUnavailablePage,
                    }),
                  },
                ],
              },
              {
                path: 'appraiser',
                Component: AppraiserLayout,
                children: [
                  {
                    path: 'profile',
                    lazy: async () => ({
                      Component: (await import('@/features/appraiser/pages/AppraiserProfilePage'))
                        .AppraiserProfilePage,
                    }),
                  },
                  {
                    Component: RequireRole,
                    children: [
                      {
                        children: [
                          {
                            index: true,
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserOverviewPage')
                              ).AppraiserOverviewPage,
                            }),
                          },
                          {
                            path: 'requests',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserQueuePage')
                              ).AppraiserQueuePage,
                            }),
                          },
                          {
                            path: 'requests/:requestId',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserRequestDetailPage')
                              ).AppraiserRequestDetailPage,
                            }),
                          },
                          {
                            path: 'opportunities',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserOpportunitiesPage')
                              ).AppraiserOpportunitiesPage,
                            }),
                          },
                          {
                            path: 'assignments',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserAssignmentsPage')
                              ).AppraiserAssignmentsPage,
                            }),
                          },
                          {
                            path: 'assignments/:assignmentId',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserAssignmentDetailPage')
                              ).AppraiserAssignmentDetailPage,
                            }),
                          },
                          {
                            path: 'commissions',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserCommissionsPage')
                              ).AppraiserCommissionsPage,
                            }),
                          },
                          {
                            path: 'commissions/:commissionId',
                            lazy: async () => ({
                              Component: (
                                await import('@/features/appraiser/pages/AppraiserCommissionsPage')
                              ).AppraiserCommissionsPage,
                            }),
                          },
                          {
                            path: 'performance',
                            loader: () => redirect('/appraiser/commissions'),
                          },
                          { path: 'queue', loader: () => redirect('/appraiser/requests') },
                          {
                            path: 'applications',
                            loader: () => redirect('/appraiser/opportunities?tab=applications'),
                          },
                          {
                            path: 'invitations',
                            loader: () => redirect('/appraiser/opportunities?tab=invitations'),
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
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
                path: 'wishlist',
                lazy: async () => ({
                  Component: (await import('@/features/wishlist/pages/WishlistPage')).WishlistPage,
                }),
              },
              {
                path: 'disputes',
                lazy: async () => ({
                  Component: (await import('@/features/disputes/pages/DisputeListPage'))
                    .DisputeListPage,
                }),
              },
              {
                path: 'transactions',
                lazy: async () => ({
                  Component: (await import('@/features/payments/pages/TransactionsPage'))
                    .TransactionsPage,
                }),
              },
              {
                path: 'wallet',
                lazy: async () => ({
                  Component: (await import('@/features/wallet/pages/WalletPage')).WalletPage,
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
                path: 'my-products/new',
                loader: () => redirect('/store/products/new'),
              },
              {
                path: 'my-products/:productId/edit',
                lazy: async () => ({
                  Component: (await import('@/features/products/pages/ProductEditPage'))
                    .ProductEditPage,
                }),
              },
              {
                path: 'store',
                Component: StoreDashboardLayout,
                children: [
                  {
                    index: true,
                    lazy: async () => ({
                      Component: (await import('@/features/stores/pages/StoreOverviewPage'))
                        .StoreOverviewPage,
                    }),
                  },
                  {
                    path: 'profile',
                    lazy: async () => ({
                      Component: (await import('@/features/stores/pages/StoreProfilePage'))
                        .StoreProfilePage,
                    }),
                  },
                  {
                    path: 'staff',
                    lazy: async () => ({
                      Component: (await import('@/features/stores/pages/StoreStaffPage'))
                        .StoreStaffPage,
                    }),
                  },
                  {
                    path: 'orders',
                    lazy: async () => ({
                      Component: (await import('@/features/orders/pages/StoreOrdersPage'))
                        .StoreOrdersPage,
                    }),
                  },
                  {
                    path: 'vouchers',
                    lazy: async () => ({
                      Component: (await import('@/features/vouchers/pages/StoreVouchersPage'))
                        .StoreVouchersPage,
                    }),
                  },
                  {
                    path: 'revenue',
                    lazy: async () => ({
                      Component: (await import('@/features/analytics/pages/StoreRevenuePage'))
                        .StoreRevenuePage,
                    }),
                  },
                  {
                    path: 'reviews',
                    lazy: async () => ({
                      Component: (await import('@/features/reviews/pages/StoreReviewsPage'))
                        .StoreReviewsPage,
                    }),
                  },
                  {
                    path: 'products',
                    lazy: async () => ({
                      Component: (await import('@/features/stores/pages/StoreProductsPage'))
                        .StoreProductsPage,
                    }),
                  },
                  {
                    path: 'products/new',
                    lazy: async () => ({
                      Component: (await import('@/features/products/pages/ProductCreatePage'))
                        .ProductCreatePage,
                    }),
                  },
                  {
                    path: 'products/:productId/edit',
                    lazy: async () => ({
                      Component: (await import('@/features/products/pages/ProductEditPage'))
                        .ProductEditPage,
                    }),
                  },
                ],
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
            path: 'forgot-password',
            lazy: async () => ({
              Component: (await import('@/features/auth/pages/ForgotPasswordPage'))
                .ForgotPasswordPage,
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
