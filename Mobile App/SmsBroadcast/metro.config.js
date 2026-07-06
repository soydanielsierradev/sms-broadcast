const path = require('path')
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')
const { withNativeWind } = require('nativewind/metro')

const STUBS = {
  'react-native-reanimated': path.resolve(__dirname, 'src/stubs/react-native-reanimated.js'),
}

const config = mergeConfig(getDefaultConfig(__dirname), {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      if (STUBS[moduleName]) {
        return { filePath: STUBS[moduleName], type: 'sourceFile' }
      }
      return context.resolveRequest(context, moduleName, platform)
    },
  },
})

module.exports = withNativeWind(config, { input: './src/global.css' })
