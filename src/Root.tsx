import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import App from './App'

/** The staff area is a separate, lazily loaded bundle with its own layout. */
const StaffApp = lazy(() => import('./staff/StaffApp'))

export const STAFF_PATH = '/staff'

export default function Root() {
  return (
    <Routes>
      <Route
        path={`${STAFF_PATH}/*`}
        element={
          <Suspense fallback={null}>
            <StaffApp />
          </Suspense>
        }
      />
      <Route path="*" element={<App />} />
    </Routes>
  )
}
