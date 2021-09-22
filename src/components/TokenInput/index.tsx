import './styles'

import { t } from '@lingui/macro'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'
import { ChangeEvent, FC, useMemo, useRef } from 'react'
import { useState } from 'react'
import { useEffect } from 'react'
import Skeleton from 'react-loading-skeleton'
import Popup from 'reactjs-popup'
import { ArrowDownOutline, TokenXToken } from 'src/components/Icon'
import useGasFee from 'src/hooks/useGasFee'
import useToken from 'src/hooks/useToken'
import useTokenBalance from 'src/hooks/useTokenBalance'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { toBigNumber } from 'src/libs/web3/util'

import Modal from './Modal'

type Props = {
  title?: string
  symbol?: string

  selectable?: boolean
  maximize?: boolean

  balance?: {
    amount: BigNumber
    value: BigNumber
    formatAmount: string
  }
  balanceTitle?: string
  noExtra?: boolean

  className?: string
  editable?: boolean

  value?: string
  onChange?: (amount: string, symbol: string) => any
  onInsufficientBalance?: (insufficient: boolean) => any
  checkInsufficientBalance?: boolean

  loading?: boolean

  tokens?: Array<string>

  onFocus?: () => any
}

const TokenInput: FC<Props> = ({ ...props }) => {
  const [value, setValue] = useState(props.value && !isNaN(+props.value) ? props.value : '')
  const [symbol, setSymbol] = useState(props.symbol as string)
  const token = useToken(symbol)

  const { api, account } = useWeb3()
  const modal = useRef<any>()
  const gasFee = useGasFee()
  const { balance: tokenBalance, loading: loadingBalance } = useTokenBalance(symbol, account || '')
  const [balance, setBalance] = useState<Props['balance']>(props.balance || tokenBalance)

  useEffect(() => {
    if (typeof props.balance !== 'undefined') {
      setBalance(props.balance)
    } else {
      setBalance(tokenBalance)
    }
  }, [props.balance, tokenBalance])

  const fixValue = (v: string) => {
    const slices = v.split('.')
    if (slices.length !== 2) {
      return v
    }

    return slices[0] + '.' + slices[1].slice(0, Math.min(8, token?.decimals || 18))
  }

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value
    if (!/^\d*(\.\d*)?$/.test(v)) {
      return
    }

    if (v[0] === '0' && v[1] !== '.' && v.length > 1) {
      v = v.slice(1)
    }

    const bv = toBigNumber(v)
    if (bv.lt(0)) {
      v = '0'
    }

    v = fixValue(v)
    setValue(v)
    if (props.onChange) {
      props.onChange(v, symbol)
    }
  }

  const handleMax = () => {
    if (!balance) {
      return
    }
    if (!api) {
      return
    }

    let v = value

    if (symbol === 'ETH' && gasFee) {
      // NOTICE: 50000 is estimate gas limit
      const final = api.Tokens.ETH.amount(balance.value.minus(gasFee.value.multipliedBy(50000)))
      if (final.gt(0)) {
        v = final.toString()
      }
    } else {
      v = balance.amount.toString()
    }

    const bv = toBigNumber(v)
    if (bv.lt(0)) {
      v = '0'
    }

    v = fixValue(v)
    setValue(v)
    if (props.onChange) {
      props.onChange(v, symbol)
    }
  }

  const handleSelectToken = (symbol: string) => {
    setSymbol(symbol)
    modal.current.close()
    if (props.onChange) {
      props.onChange(value, symbol)
    }
  }

  const handleFocus = () => {
    if (props.onFocus) {
      props.onFocus()
    }
  }

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
    if (props.noExtra) {
      return false
    }

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
  }, [props.balance, props.noExtra, loadingBalance])

  const classPrefix = 'cofi-token-input'
  return (
    <div className={`${classPrefix} ${props.className}`}>
      {props.title && <div className={`${classPrefix}-title`}>{props.title}</div>}

      <div className={`${classPrefix}-container`}>
        <div className={`${classPrefix}-token`}>
          {token ? token.isXToken ? <TokenXToken /> : <token.Icon /> : <Skeleton width={44} height={44} circle />}
          <span>{token ? token.isXToken ? 'XToken' : token.symbol : <Skeleton width={80} />}</span>

          {props.selectable && (
            <Popup
              modal
              ref={modal}
              trigger={
                <span className={`${classPrefix}-arrow`}>
                  <ArrowDownOutline />
                </span>
              }
            >
              <Modal onClose={() => modal.current.close()} onSelect={handleSelectToken} tokens={props.tokens} />
            </Popup>
          )}
        </div>

        {props.loading || shouldShowBalanceLoading ? (
          <Skeleton width={100} />
        ) : (
          <div className={`${classPrefix}-inputDiv`}>
            <input
              className={`${classPrefix}-input`}
              value={value}
              onChange={handleInput}
              placeholder={props.editable === false ? '--' : '0.0'}
              disabled={props.editable === false}
              style={{
                display: props.loading || shouldShowBalanceLoading ? 'none' : 'unset',
              }}
              min={0}
              onFocus={handleFocus}
            />
            <hr />
          </div>
        )}
      </div>

      {!props.noExtra && (
        <div className={`${classPrefix}-extra`}>
          {shouldShowBalanceLoading ? (
            <span className="w100">
              <Skeleton />
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
              {props.maximize && balance && toBigNumber(balance.value).gt(0) && (
                <span className={`${classPrefix}-max`} onClick={handleMax}>
                  MAX
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

TokenInput.defaultProps = {
  selectable: true,
  maximize: true,
}

export default TokenInput
