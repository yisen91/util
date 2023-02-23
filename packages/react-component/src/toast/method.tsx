import { extend, isBrowser, isObject } from '@minko-fe/lodash-pro'
import { useLatest } from '@minko-fe/react-util-hook'
import { useEffect, useState } from 'react'
import { resolveContainer } from '../utils/dom/getContainer'
import { render, unmount } from '../utils/dom/render'
import { lockClick } from './lock-click'
import type { ToastInstance, ToastProps, ToastReturnType, ToastType } from './PropsType'
import { Toast as BaseToast } from './Toast'

const defaultOptions: ToastProps = {
  message: '',
  className: '',
  type: 'info',
  position: 'middle',
  forbidClick: false,
  duration: 2000,
  teleport: () => document.body,
  keepOnHover: true,
}

const toastArray: (() => void)[] = []

let allowMultiple = false
let currentOptions = extend({}, defaultOptions)

// default options of specific type
const defaultOptionsMap = new Map<string, ToastProps>()

// 同步的销毁
function syncClear() {
  let fn = toastArray.pop()
  while (fn) {
    fn()
    fn = toastArray.pop()
  }
}

// 针对 toast 还没弹出来就立刻销毁的情况，将销毁放到下一个 event loop 中，避免销毁失败。
function nextTickClear() {
  setTimeout(syncClear)
}

function parseOptions(message: ToastProps) {
  if (isObject(message)) {
    return message
  }
  return { message }
}

// 可返回用于销毁此弹窗的方法
const ToastObj = (props: ToastProps) => {
  if (!isBrowser()) return null
  const update: ToastReturnType = {
    config: () => {},
    clear: () => null,
  }
  let timer = 0
  const { onClose, teleport } = props
  const container = document.createElement('div')
  const bodyContainer = resolveContainer(teleport)
  bodyContainer.appendChild(container)

  const TempToast = () => {
    const options = {
      duration: 2000,
      ...currentOptions,
      ...props,
    } as ToastProps
    const [visible, setVisible] = useState(false)
    const [state, setState] = useState<ToastProps>({ ...options })
    const internalOnClosed = () => {
      if (state.forbidClick) {
        lockClick(false)
      }
      const unmountResult = unmount(container)
      if (unmountResult && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    }
    // close with animation
    const destroy = () => {
      setVisible(false)
      onClose?.()
    }

    update.clear = internalOnClosed

    update.config = (nextState) => {
      setState((prev) =>
        typeof nextState === 'function' ? { ...prev, ...nextState(prev) } : { ...prev, ...nextState },
      )
    }

    const [_, setIsHovering] = useState(false)

    const isHovering = useLatest(_)
    const latestState = useLatest(state)

    function beforeDestory() {
      if (isHovering.current && latestState.current.keepOnHover) {
        delayClear()
      } else {
        destroy()
      }
    }

    function delayClear() {
      timer && clearTimeout(timer)
      timer = window.setTimeout(() => {
        beforeDestory()
      }, +state.duration!)
    }

    useEffect(() => {
      setVisible(true)
      if (!allowMultiple) syncClear()
      toastArray.push(internalOnClosed)

      if (state.duration !== 0 && 'duration' in state) {
        delayClear()
      }

      return () => {
        if (timer !== 0) {
          window.clearTimeout(timer)
        }
      }
    }, [])

    return (
      <BaseToast
        {...state}
        visible={visible}
        teleport={() => container}
        onClose={destroy}
        onHoverStateChange={setIsHovering}
        onClosed={internalOnClosed}
      />
    )
  }

  render(<TempToast />, container)

  return update
}

const createMethod = (type: ToastType) => (options: ToastProps) => {
  return ToastObj({
    ...currentOptions,
    ...defaultOptionsMap.get(type),
    ...parseOptions(options),
    type,
  })
}

;(['info', 'loading', 'success', 'fail'] as const).forEach((method) => {
  ToastObj[method] = createMethod(method)
})

ToastObj.allowMultiple = (value = true) => {
  allowMultiple = value
}

ToastObj.clear = nextTickClear

function setDefaultOptions(type: ToastType | ToastProps, options?: ToastProps) {
  if (typeof type === 'string') {
    defaultOptionsMap.set(type, options || {})
  } else {
    extend(currentOptions, type)
  }
}

ToastObj.setDefaultOptions = setDefaultOptions

ToastObj.resetDefaultOptions = (type?: ToastType) => {
  if (typeof type === 'string') {
    defaultOptionsMap.delete(type)
  } else {
    currentOptions = extend({}, defaultOptions)
    defaultOptionsMap.clear()
  }
}

const Toast = ToastObj as ToastInstance
export { Toast }
