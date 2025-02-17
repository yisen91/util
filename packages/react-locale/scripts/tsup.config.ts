import { type Options } from 'tsup'

export default {
  entry: {
    'client/index': 'src/client/index.ts',
    'node/plugin/index': 'src/node/plugin/index.ts',
  },
  target: 'esnext',
  format: ['cjs', 'esm'],
} as Options
