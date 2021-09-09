import './styles'

import { t } from '@lingui/macro'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'
import { FC, useMemo } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import { TokenXToken } from 'src/components/Icon'
import useToken from 'src/hooks/useToken'
import useTokenBalance from 'src/hooks/useTokenBalance'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { toBigNumber } from 'src/libs/web3/util'
import Switch from 'src/components/Switch'

type Props = {
  symbol?: string
  choice?: boolean
  balance?: {
    amount: BigNumber
    value: BigNumber
    formatAmount: string
  }
  balanceTitle?: string
  className?: string
  value?: string
  onChange?: (amount: string, symbol: string) => any
  onInsufficientBalance?: (insufficient: boolean) => any
  checkInsufficientBalance?: boolean
  loading?: boolean
}

const TokenWithdraw: FC<Props> = ({ ...props }) => {
  const [value, setValue] = useState(props.value && !isNaN(+props.value) ? props.value : '')
  const [symbol, setSymbol] = useState(props.symbol as string)
  const token = useToken(symbol)
  const [choice, setChoice] = useState(props.choice)
  const {account } = useWeb3()
  const { balance: tokenBalance, loading: loadingBalance } = useTokenBalance(symbol, account || '')
  const [balance, setBalance] = useState<Props['balance']>(props.balance || tokenBalance)


  useEffect(() => {
    if (typeof props.balance !== 'undefined') {
      setBalance(props.balance)
    } else {
      setBalance(tokenBalance)
    }
  }, [props.balance, tokenBalance])

  useEffect(() => {
    if (typeof props.value === 'undefined') {
      return
    }

    if (!isNaN(+props.value)) {
      setValue(props.value)
    }
  }, [props.value])

  useEffect(() => {
    if (typeof props.symbol === 'undefined') {
      return
    }

    setSymbol(props.symbol)
  }, [props.symbol])

  const insufficientBalance = useMemo(() => {
    return !!value && !!props.checkInsufficientBalance && !!balance && toBigNumber(value).gt(balance.amount)
  }, [value, balance, balance?.amount, props.balance])

  useEffect(() => {
    if (props.onInsufficientBalance) {
      props.onInsufficientBalance(insufficientBalance)
    }
  }, [insufficientBalance])

  const shouldShowBalanceLoading = useMemo(() => {
    if (!tokenBalance) {
      return true
    }
    if (tokenBalance?.amount.lt(0)) {
      return true
    }

    if (tokenBalance) {
      return false
    }

    return loadingBalance
  }, [props.balance, loadingBalance])

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
          {typeof choice === 'boolean' ? (
            <Switch value={choice} onChange={(v) => setChoice(v)}/>
          ) : (
            <span>{choice}</span>
          )}
        </div>

      </div>
      <div className={`${classPrefix}-extra`}>
        {shouldShowBalanceLoading ? (
          <span className="w100">
              <Skeleton/>
            </span>
        ) : (
          <>
              <span
                className={classNames({
                  [`${classPrefix}-balance`]: true,
                  error: insufficientBalance,
                })}
              >
                <>
                  {`${props.balanceTitle || t`Balance:`} ${balance ? balance.formatAmount : '--'} `}
                  {token ? (token.isXToken ? 'XToken' : token.symbol) : ''}
                </>
              </span>
            <span className={`${classPrefix}-result`}>
              预计获得：{token ? (token.isXToken ? 'XToken' : token.symbol) : ''}
            </span>
          </>
        )}
      </div>
    </div>
  )
}

TokenWithdraw.defaultProps = {
  choice: false
}

export default TokenWithdraw
