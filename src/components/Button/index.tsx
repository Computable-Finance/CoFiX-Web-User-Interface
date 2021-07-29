import { FC, forwardRef, MouseEventHandler } from 'react'
// import styles from './Button.module.scss'
import classNames from 'classnames'
import './styles'

export type Props = {
  gradient?: boolean
  primary?: boolean
  className?: string
  rounded?: boolean
  block?: boolean
  disabled?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  flow?: boolean
}

const Button: FC<Props> = forwardRef(({ children, ...props }, ref?: any) => {
  const classPrefix = 'cofi-button'

  return (
    <button
      autoFocus={false}
      ref={ref}
      onClick={props.onClick}
      disabled={props.disabled}
      className={classNames({
        [props.className || '']: true,
        [`${classPrefix}`]: true,
        [`gradient`]: props.gradient,
        [`primary`]: props.primary,
        [`rounded`]: props.rounded,
        [`block`]: props.block,
        [`disabled`]: props.disabled,
        [`flow`]: props.flow,
      })}
    >
      {children}
    </button>
  )
})

export default Button
