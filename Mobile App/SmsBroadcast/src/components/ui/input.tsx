import * as React from 'react'
import { TextInput, type TextInputProps, View } from 'react-native'
import { cn } from '~/utils/cn'

interface InputProps extends TextInputProps {
  className?: string
}

const Input = React.forwardRef<TextInput, InputProps>(
  ({ className, placeholderTextColor, ...props }, ref) => (
    <TextInput
      ref={ref}
      placeholderTextColor={placeholderTextColor ?? '#9ca3af'}
      className={cn(
        'h-10 rounded-md border border-input bg-background px-3 py-2 text-base text-foreground',
        'web:ring-offset-background placeholder:text-muted-foreground',
        'focus:border-ring',
        props.editable === false && 'opacity-50',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input, type InputProps }
