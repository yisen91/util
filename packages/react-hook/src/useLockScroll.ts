import { isBrowser } from '@minko-fe/lodash-pro'
import { type RefObject, useEffect } from 'react'
import { getScrollParent } from './useScrollParent'
import { useTouch } from './useTouch'

let supportsPassive = false

if (isBrowser()) {
  try {
    const opts = {}
    Object.defineProperty(opts, 'passive', {
      get() {
        supportsPassive = true
      },
    })
    window.addEventListener('test-passive', null as any, opts)
  } catch {}
}

let totalLockCount = 0

const BODY_LOCK_CLASS = 'rc-overflow-hidden'

// Taken from vant：https://github.com/youzan/vant/blob/HEAD/src/composables/use-lock-scroll.ts
export function useLockScroll(rootRef: RefObject<HTMLElement>, shouldLock = false) {
  const touch = useTouch()

  const onTouchMove = (event: TouchEvent) => {
    touch.move(event)
    const direction = touch.deltaY.current > 0 ? '10' : '01'
    const el = getScrollParent(event.target as Element, rootRef.current!) as HTMLElement
    if (!el) return
    const { scrollHeight, offsetHeight, scrollTop } = el
    let status = '11'
    if (scrollTop === 0) {
      status = offsetHeight >= scrollHeight ? '00' : '01'
    } else if (scrollTop + offsetHeight >= scrollHeight) {
      status = '10'
    }

    if (status !== '11' && touch.isVertical() && !(Number.parseInt(status, 2) & Number.parseInt(direction, 2))) {
      if (event.cancelable) {
        event.preventDefault()
      }
    }
  }

  const lock = () => {
    document.addEventListener('touchstart', touch.start)
    document.addEventListener('touchmove', onTouchMove, supportsPassive ? { passive: false } : false)

    if (!totalLockCount) {
      document.body.classList.add(BODY_LOCK_CLASS)
    }

    totalLockCount++
  }

  const unlock = () => {
    if (totalLockCount) {
      document.removeEventListener('touchstart', touch.start)
      document.removeEventListener('touchmove', onTouchMove)

      totalLockCount--

      if (!totalLockCount) {
        document.body.classList.remove(BODY_LOCK_CLASS)
      }
    }
  }

  useEffect(() => {
    if (shouldLock) {
      lock()
      return () => {
        unlock()
      }
    }
  }, [shouldLock])
}
