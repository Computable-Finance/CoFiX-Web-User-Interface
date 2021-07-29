import { FC, useEffect, useState } from 'react'
import './styles'

import { QuestionOutline, ArrowDown } from 'src/components/Icon'
import Switch from 'src/components/Switch'
import Popup from 'reactjs-popup'
import classNames from 'classnames'
import Skeleton from 'react-loading-skeleton'

type Props = {
  name?: string
  value?: string | boolean | JSX.Element
  tooltip?: JSX.Element
  onChange?: (value: Props['value']) => void
  loading?: boolean
}

const Field: FC<Props> = ({ children, ...props }) => {
  const [collapse, setCollapse] = useState(true)
  const [value, setValue] = useState(props.value)

  useEffect(() => {
    setValue(props.value)
  }, [props.value])

  useEffect(() => {
    if (!props.onChange) {
      return
    }
    props.onChange(value)
  }, [value])

  const classPrefix = 'cofi-field'
  return (
    <div className={`${classPrefix}`}>
      <div
        className={classNames({
          [`${classPrefix}-container`]: true,
          ['cursor-pointer']: !!children,
        })}
        onClick={() => setCollapse(!collapse)}
      >
        <div className={`${classPrefix}-name`}>
          <span>{props.name}</span>
          {props.tooltip && (
            <Popup
              on="hover"
              trigger={
                <span className={`${classPrefix}-tooltip-icon`}>
                  <QuestionOutline />
                </span>
              }
            >
              <div className={`${classPrefix}-tooltip`}>{props.tooltip}</div>
            </Popup>
          )}
        </div>

        <div className={`${classPrefix}-value`}>
          {props.loading ? (
            <Skeleton width={200} />
          ) : (
            <>
              {typeof value === 'boolean' ? (
                <Switch value={value} onChange={(v) => setValue(v)} />
              ) : (
                <span>{value}</span>
              )}
              {!!children && (
                <ArrowDown
                  className={classNames({
                    [`${classPrefix}-arrow-down`]: true,
                    flip: !collapse,
                  })}
                />
              )}
            </>
          )}
        </div>
      </div>

      {!collapse && !props.loading && <div className={`${classPrefix}-content`}>{children}</div>}
    </div>
  )
}

export default Field
