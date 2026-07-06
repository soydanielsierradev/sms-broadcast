import * as React from 'react'
import { Pressable, type PressableProps, View } from 'react-native'
import { Text } from './text'
import { cn } from '~/utils/cn'

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost'
type ButtonSize = 'default' | 'sm' | 'lg'

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
  textClassName?: string
  children?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-primary',
  destructive: 'bg-destructive',
  outline: 'border border-input bg-background',
  secondary: 'bg-secondary',
  ghost: 'bg-transparent',
}

const sizeClasses: Record<ButtonSize, string> = {
  default: 'h-10 px-4 py-2',
  sm: 'h-9 px-3',
  lg: 'h-11 px-8',
}

const textVariantClasses: Record<ButtonVariant, string> = {
  default: 'text-primary-foreground',
  destructive: 'text-destructive-foreground',
  outline: 'text-foreground',
  secondary: 'text-secondary-foreground',
  ghost: 'text-foreground',
}

const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      className,
      textClassName,
      variant = 'default',
      size = 'default',
      disabled,
      children,
      ...props
    },
    ref,
  ) => (
    <Pressable
      ref={ref as React.Ref<View>}
      disabled={disabled}
      className={cn(
        'flex-row items-center justify-center rounded-md',
        variantClasses[variant],
        sizeClasses[size],
        disabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text
          className={cn(
            'text-sm font-medium',
            textVariantClasses[variant],
            textClassName,
          )}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  ),
)
Button.displayName = 'Button'

export { Button, type ButtonProps, type ButtonVariant, type ButtonSize }
