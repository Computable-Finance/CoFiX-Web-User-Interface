import { FC, useEffect, useState } from 'react'
import './styles'
import classNames from 'classnames'

type Props = {
  value?: boolean
  onChange?: (value: boolean) => void
}

const Switch: FC<Props> = (props) => {
  const [value, setValue] = useState<boolean>(props.value || false)

  useEffect(() => {
    if (typeof props.value !== 'undefined') {
      setValue(props.value)
    }
  }, [props.value])
  useEffect(() => {
    if (props.onChange) {
      props.onChange(value)
    }
  }, [value])

  const classPrefix = 'cofi-switch'
  return (
    <input
      type="checkbox"
      className={classNames({
        [`${classPrefix}`]: true,
        checked: value,
      })}
      checked={value}
      onChange={(e) => {
        setValue(e.target.checked)
      }}
    />
  )
}

export default Switch
