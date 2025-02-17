import { isDef, isUndefined } from '@minko-fe/lodash-pro'
import classNames from 'classnames'
import React, { type FC, useEffect, useRef } from 'react'
import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '../icons'
import Popup from '../popup'
import { type PopupInstanceType } from '../popup/PropsType'
import { createNamespace } from '../utils/createNamespace'
import { type ToastPrivateProps, type ToastProps, type ToastType } from './PropsType'
import { lockClick } from './lock-click'

const [bem] = createNamespace('toast')

const builtinIcons: Record<ToastType, React.ReactNode> = {
  info: null,
  error: <CloseCircleFilled />,
  success: <CheckCircleFilled />,
  warning: <ExclamationCircleFilled />,
}

const Toast: FC<ToastProps & ToastPrivateProps> = (props) => {
  let clickable = false
  const {
    visible,
    closeOnClick,
    onClose,
    forbidClick,
    position = 'middle',
    type = 'info',
    icon,
    className,
    overlay = false,
    transition = 'rc-toast-bounce',
    overlayClass,
    overlayStyle,
    closeOnClickOverlay,
    onClosed,
    onOpened,
    teleport,
    onHoverStateChange,
    onIconClick,
    transitionTime,
    keyboard,
    overlayTransition,
  } = props

  const toggleClickable = () => {
    const newValue = visible && forbidClick
    if (clickable !== newValue && !isUndefined(newValue)) {
      clickable = newValue
      lockClick(clickable)
    }
    if (!visible) {
      lockClick(false)
    }
  }

  const onClick = () => {
    if (closeOnClick) {
      onClose?.()
    }
  }

  useEffect(() => {
    toggleClickable()
  }, [visible, forbidClick])

  const renderIcon = () => {
    const { icon } = props

    const hasIcon = icon || builtinIcons[type]

    if (hasIcon) {
      return React.cloneElement((icon || builtinIcons[type]) as React.ReactElement, {
        className: classNames(bem('icon'), bem(type), onIconClick && bem('icon', 'click')),
        onClick: onIconClick,
      })
    }

    return null
  }

  const renderContent = () => {
    const { content } = props
    if (isDef(content) && content !== '') {
      return <div className={classNames(bem('info'))}>{content}</div>
    }
    return null
  }

  const popupRef = useRef<PopupInstanceType>(null)

  return (
    <Popup
      ref={popupRef}
      visible={visible}
      overlay={overlay}
      transition={transition}
      overlayClass={overlayClass}
      destroyOnClose
      overlayTransition={overlayTransition}
      overlayStyle={overlayStyle}
      closeOnClickOverlay={closeOnClickOverlay}
      lockScroll={false}
      onClick={onClick}
      onClose={onClose}
      onClosed={onClosed}
      onOpened={onOpened}
      teleport={teleport}
      className={classNames([bem([position, { [type]: icon }]), className])}
      onHoverStateChange={onHoverStateChange}
      duration={transitionTime}
      keyboard={keyboard}
      wrapClassName={classNames([bem('wrap')])}
    >
      <div className={classNames(bem('content'))}>
        {renderIcon()}
        {renderContent()}
      </div>
    </Popup>
  )
}

export { Toast }
