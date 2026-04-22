import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { router } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryProvider>
  )
}

export default App
