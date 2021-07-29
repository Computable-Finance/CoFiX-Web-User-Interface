import './styles'
import { FC, HTMLAttributes } from 'react'
import classNames from 'classnames'

type Props = HTMLAttributes<HTMLSpanElement> & {
  primary?: boolean
}

const Tag: FC<Props> = ({ primary, children, className = '', ...props }) => {
  return (
    <span
      className={classNames({
        'cofi-tag': true,
        primary: primary,
        [className]: className,
      })}
      {...props}
    >
      {children}
    </span>
  )
}

export default Tag
