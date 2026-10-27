export const pageRoutes = [
  { key: 'menus', path: '/menus' },
  { key: 'about', path: '/about' },
  { key: 'visits', path: '/visits' },
  { key: 'products', path: '/products' },
  { key: 'concerts', path: '/concerts' },
  { key: 'location', path: '/location' },
] as const

export type PageKey = (typeof pageRoutes)[number]['key']

export const pathFor = (key: PageKey) => pageRoutes.find((route) => route.key === key)!.path

/** Every booking call to action leads to the dedicated reservations page. */
export const RESERVATION_HREF = '/reservations'

/** Guest booking tracker: look up a request by reference and phone. */
export const TRACKER_HREF = '/reservations/status'

/** Staff area (separate bundle and layout). The dashboard redirects here when signed out. */
export const STAFF_HREF = '/staff'
export const STAFF_LOGIN_HREF = '/staff/login'
