import { FC } from 'react'
import './styles'
import classNames from 'classnames'

type Props = {
  className?: string
  block?: boolean
  responsive?: boolean
}
const ButtonGroup: FC<Props> = ({ children, ...props }) => {
  const classPrefix = 'cofi-button-group'

  return (
    <span
      className={classNames({
        [props.className || '']: true,
        [`${classPrefix}`]: true,
        [`block`]: !!props.block,
        [`responsive`]: !!props.responsive,
      })}
    >
      {children}
    </span>
  )
}

export default ButtonGroup
