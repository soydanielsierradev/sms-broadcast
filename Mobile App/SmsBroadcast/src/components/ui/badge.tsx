import * as React from 'react'
import { View, type ViewProps } from 'react-native'
import { Text } from './text'
import { cn } from '~/utils/cn'

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success'

interface BadgeProps extends ViewProps {
  variant?: BadgeVariant
  label: string
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-primary',
  secondary: 'bg-secondary',
  destructive: 'bg-destructive',
  outline: 'border border-border bg-transparent',
  success: 'bg-green-500',
}

const textVariantClasses: Record<BadgeVariant, string> = {
  default: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  destructive: 'text-destructive-foreground',
  outline: 'text-foreground',
  success: 'text-white',
}

const Badge = React.forwardRef<View, BadgeProps>(
  ({ className, variant = 'default', label, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5',
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      <Text
        className={cn('text-xs font-semibold', textVariantClasses[variant])}
      >
        {label}
      </Text>
    </View>
  ),
)
Badge.displayName = 'Badge'

export { Badge, type BadgeProps, type BadgeVariant }
