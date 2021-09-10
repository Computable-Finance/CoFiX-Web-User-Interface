import './styles'

import {t, Trans} from '@lingui/macro'
import classNames from 'classnames'
import { FC } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TokenXToken } from 'src/components/Icon'
import useToken from 'src/hooks/useToken'
import Switch from 'src/components/Switch'
import usePoolInfo from "../../hooks/usePoolInfo";
import {AnchorPoolInfo} from "../../libs/web3/api/CoFiXAnchorPool";

type Props = {
  symbol: string
  choice: string
  balance?: string
  balanceTitle?: string
  className?: string
  handleChoice: (symbol: string) => void
  loading?: boolean
}

const TokenWithdraw: FC<Props> = ({ ...props }) => {
  const [symbol, setSymbol] = useState(props.symbol as string)
  const token = useToken(symbol)
  const [value, setValue] = useState(props.choice === symbol)
  const { info: AnchorPoolInfo } = usePoolInfo<AnchorPoolInfo>(symbol)
  const [balance, setBalance] = useState(props.balance)

  const handleClick = (value: boolean) => {
    setValue(value)
    if (value) {
      props.handleChoice(symbol)
      return
    }
    if (props.choice === symbol && !value){
      props.handleChoice("Null")
    }
  }

  useEffect(() => {
    if (props.choice !== "Null" && props.choice !== symbol && value) {
      setValue(false)
    }
  })

  useEffect(() => {
    if (typeof props.balance !== 'undefined') {
      setBalance(props.balance)
    } else {
      setBalance(AnchorPoolInfo?.formatAmount)
    }
  }, [props.balance, AnchorPoolInfo?.formatAmount])

  useEffect(() => {
    if (typeof props.symbol === 'undefined') {
      return
    }

    setSymbol(props.symbol)
  }, [props.symbol])

  const classPrefix = 'cofi-token-withdraw'
  return (
    <div className={`${classPrefix} ${props.className}`}>
      <div className={`${classPrefix}-container`}>
        <div className={`${classPrefix}-token`}>
          {token ? token.isXToken ? <TokenXToken /> : <token.Icon /> : <Skeleton width={44} height={44} circle />}
          <span>{token ? token.isXToken ? 'XToken' : token.symbol : <Skeleton width={80} />}</span>
        </div>

        {/*props.loading || shouldShowBalanceLoading*/}
        <div className={`${classPrefix}-switch`}>
          {typeof value === 'boolean' ? (
            <Switch value={value} onChange={(v) => handleClick(v)}/>
          ) : (
            <span>{value}</span>
          )}
        </div>

      </div>
      <div className={`${classPrefix}-extra`}>
              <span
                className={classNames({
                  [`${classPrefix}-balance`]: true,
                })}
              >
                <>
                  {`${props.balanceTitle || t`Balance:`} ${balance ? balance : '--'} `}
                  {token ? (token.isXToken ? 'XToken' : token.symbol) : ''}
                </>
              </span>
        <span className={`${classPrefix}-result`}>
              <Trans>Received Tokens (Estimated)</Trans>
              :
              {token ? (token.isXToken ? 'XToken' : token.symbol) : ''}
            </span>
      </div>
    </div>
  )
}

export default TokenWithdraw
