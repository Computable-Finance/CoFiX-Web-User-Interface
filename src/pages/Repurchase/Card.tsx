import { FC } from 'react'
import Skeleton from 'react-loading-skeleton'

type Props = {
  title?: string
  value?: string
  icon?: JSX.Element
  loading?: boolean
}

const Card: FC<Props> = (props) => {
  const classPrefix = 'cofi-repurchase-card'
  return (
    <div className={`${classPrefix}`}>
      <span className={`${classPrefix}-title`}>{props.title}</span>
      <span className={`${classPrefix}-value`}>{props.loading ? <Skeleton width={50} /> : props.value}</span>
      <span className={`${classPrefix}-icon`}>{props.icon}</span>
    </div>
  )
}

export default Card
