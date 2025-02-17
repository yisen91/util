import { deepMerge, isObject } from '@minko-fe/lodash-pro'
import { type PxtoremOptions } from '@minko-fe/postcss-pxtorem'
import { type PxtoviewportOptions } from '@minko-fe/postcss-pxtoviewport'
import { createRequire } from 'node:module'
import { type AcceptedPlugin } from 'postcss'
import { type pluginOptions } from 'postcss-preset-env'
import { type Config } from 'tailwindcss'

const _require = createRequire(import.meta.url)

export type PostcssConfig =
  | {
      /**
       * @default true
       * @description set false in vite env
       * @description default built-in
       */
      'postcss-import'?: boolean
      /**
       * @default true
       * @description default built-in
       */
      'tailwindcss/nesting'?: boolean

      /**
       * @default true
       */
      'autoprefixer'?: boolean
      /**
       * @default false
       */
      'postcss-pxtorem'?: false | PxtoremOptions
      /**
       * @default false
       */
      'postcss-pxtoviewport'?: false | PxtoviewportOptions
      /**
       * @default true
       * @description default built-in
       */
      'tailwindcss'?: Config | boolean
      /**
       * @default true
       * @description default built-in
       */
      'postcss-preset-env'?: pluginOptions | boolean
    }
  | undefined

const defaultOptions: Required<PostcssConfig> = {
  'postcss-import': true,
  'tailwindcss/nesting': true,
  'tailwindcss': true,
  'postcss-pxtorem': false,
  'postcss-pxtoviewport': false,
  'autoprefixer': true,
  'postcss-preset-env': true,
}

const plugins: AcceptedPlugin[] = []

const pluginsForNextjs: (string | any[])[] = []

function unPlugins(pluginName: string, options?: any) {
  plugins.push(options ? _require(pluginName)(options) : _require(pluginName))
  pluginsForNextjs.push(options ? [pluginName, options] : pluginName)
}

const postcssConfig = (options: PostcssConfig) => {
  options = deepMerge(defaultOptions, options || {})!

  if (options['postcss-import'] !== false) {
    unPlugins('postcss-import')
  }

  if (options['tailwindcss/nesting'] !== false) {
    unPlugins('tailwindcss/nesting')
  }

  {
    const { tailwindcss } = options
    if (tailwindcss !== false) {
      const options = isObject(tailwindcss) ? tailwindcss : undefined
      unPlugins('tailwindcss', options)
    }
  }

  {
    const { autoprefixer } = options
    if (autoprefixer !== false) {
      unPlugins('autoprefixer')
    }
  }

  {
    const pxtorem = options['postcss-pxtorem']
    if (pxtorem) {
      unPlugins('@minko-fe/postcss-pxtorem', options)
    }
  }

  {
    const pxtoviewport = options['postcss-pxtoviewport']
    if (pxtoviewport) {
      unPlugins('@minko-fe/postcss-pxtoviewport', options)
    }
  }

  // last
  {
    const presetEnv = options['postcss-preset-env']

    if (presetEnv !== false) {
      const browserslist = _require('browserslist')

      const defaultBrowserslist = browserslist.loadConfig({ path: '.' })

      const defaultOptions: pluginOptions = {
        browsers: defaultBrowserslist || ['defaults'],
        features: {
          'nesting-rules': false,
          'custom-properties': false,
        },
        autoprefixer: {
          // Disable legacy flexbox support
          flexbox: 'no-2009',
        },
        // Enable CSS features that have shipped to the
        // web platform, i.e. in 2+ browsers unflagged.
        stage: 3,
      }

      const _options = deepMerge(defaultOptions, isObject(presetEnv) ? presetEnv : {})

      if (options['tailwindcss/nesting'] === false) {
        _options.features['nesting-rules'] = true
      }

      unPlugins('postcss-preset-env', _options)
    }
  }

  return {
    normal: plugins,
    nextjs: pluginsForNextjs,
  }
}

export function definePlugins(options: PostcssConfig) {
  return postcssConfig(options)
}
