import * as React from 'react'
import { View, type ViewProps } from 'react-native'
import { cn } from '~/utils/cn'

interface ProgressProps extends ViewProps {
  value?: number
  className?: string
  indicatorClassName?: string
}

const Progress = React.forwardRef<View, ProgressProps>(
  ({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <View
      ref={ref}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-secondary', className)}
      {...props}
    >
      <View
        className={cn('h-full rounded-full bg-primary', indicatorClassName)}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </View>
  ),
)
Progress.displayName = 'Progress'

export { Progress, type ProgressProps }
