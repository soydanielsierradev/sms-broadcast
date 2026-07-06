import * as React from 'react'
import { type TextProps } from 'react-native'
import { Text } from './text'
import { cn } from '~/utils/cn'

interface LabelProps extends TextProps {
  className?: string
}

const Label = React.forwardRef<React.ElementRef<typeof Text>, LabelProps>(
  ({ className, ...props }, ref) => (
    <Text
      ref={ref}
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    />
  ),
)
Label.displayName = 'Label'

export { Label, type LabelProps }
