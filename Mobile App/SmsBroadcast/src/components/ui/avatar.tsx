import * as React from 'react'
import { Image, View, type ViewProps, type ImageSourcePropType } from 'react-native'
import { Text } from './text'
import { cn } from '~/utils/cn'

interface AvatarProps extends ViewProps {
  src?: ImageSourcePropType
  alt?: string
  fallback?: string
  className?: string
}

const Avatar = React.forwardRef<View, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => (
    <View
      ref={ref}
      className={cn(
        'h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}
    >
      {src ? (
        <Image
          source={src}
          accessibilityLabel={alt}
          className="h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <Text className="text-sm font-medium uppercase text-muted-foreground">
          {fallback ?? '?'}
        </Text>
      )}
    </View>
  ),
)
Avatar.displayName = 'Avatar'

export { Avatar, type AvatarProps }
