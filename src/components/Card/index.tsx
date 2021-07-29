import { FC } from 'react'
import './styles'
import { ArrowLeft, CloseOutline } from 'src/components/Icon'
import classNames from 'classnames'

type Props = {
  title?: string

  backward?: boolean
  onBackwardClick?: () => void

  closable?: boolean
  onClose?: () => void

  className?: string
}

const Card: FC<Props> = ({ children, ...props }) => {
  const classPrefix = 'cofi-card'
  return (
    <div
      className={classNames({
        [classPrefix]: true,
        [props.className || '']: true,
      })}
    >
      {(props.backward || props.title || props.closable) && (
        <div className={`${classPrefix}-header`}>
          {props.backward && <ArrowLeft className={`${classPrefix}-backward`} onClick={props.onBackwardClick} />}
          {props.title && <div className={`${classPrefix}-title`}>{props.title}</div>}
          {props.closable && <CloseOutline className={`${classPrefix}-closable`} onClick={props.onClose} />}
        </div>
      )}

      <div className={`${classPrefix}-content`}>{children}</div>
    </div>
  )
}

export default Card
