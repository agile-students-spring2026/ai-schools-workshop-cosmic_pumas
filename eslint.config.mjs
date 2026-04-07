import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))

const compat = new FlatCompat({
  baseDirectory: currentDirectory
})

const config = [
  {
    ignores: ['node_modules/**', '.next/**', 'coverage/**']
  },
  ...compat.extends('next/core-web-vitals')
]

export default config
