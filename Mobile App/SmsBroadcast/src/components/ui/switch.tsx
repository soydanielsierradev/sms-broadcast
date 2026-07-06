import * as React from 'react'
import {
  Switch as RNSwitch,
  type SwitchProps as RNSwitchProps,
} from 'react-native'

interface SwitchProps extends Omit<RNSwitchProps, 'value' | 'onValueChange'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<RNSwitch, SwitchProps>(
  ({ checked = false, onCheckedChange, ...props }, ref) => (
    <RNSwitch
      ref={ref}
      value={checked}
      onValueChange={onCheckedChange}
      trackColor={{ false: '#e2e8f0', true: '#0f172a' }}
      thumbColor="#ffffff"
      {...props}
    />
  ),
)
Switch.displayName = 'Switch'

export { Switch, type SwitchProps }
