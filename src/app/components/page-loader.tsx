import { Skeleton } from '@/components/ui/skeleton'

export function PageLoader() {
  return (
    <motion className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-4 w-56" />
    </motion>
  )
}
