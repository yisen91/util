import { isDef, isNumber } from '@minko-fe/lodash-pro'

export function addUnit(value?: string | number): string | undefined {
  if (!isDef(value)) {
    return undefined
  }

  value = String(value)
  return isNumber(value) ? `${value}px` : value
}
