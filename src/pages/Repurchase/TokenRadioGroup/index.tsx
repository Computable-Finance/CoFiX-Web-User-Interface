import './styles'

import { Trans } from '@lingui/macro'
import { FC, useEffect } from 'react'
import { useState } from 'react'
import { useMemo } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

type Props = {
  tokens: Array<string>
  amounts?: Array<string>
  onChange?: (token: string) => any
  value?: string
}

const TokenRadioGroup: FC<Props> = (props) => {
  const { api } = useWeb3()
  const [symbol, setSymbol] = useState<string>()

  const tokens = useMemo(() => {
    if (!api || !props.tokens) {
      return []
    }

    return props.tokens.map((t) => api.Tokens[t])
  }, [api, props.tokens])

  const token = useMemo(() => {
    return tokens.find((t) => t.symbol === symbol)
  }, [tokens, symbol])

  useEffect(() => {
    if (props.value) {
      setSymbol(props.value)
    }
  }, [props.value])

  useEffect(() => {
    if (props.onChange && symbol) {
      props.onChange(symbol)
    }
  }, [symbol])

  const idPrefix = `cofi-token-radio-group`
  const classPrefix = `cofi-token-radio-group`
  return (
    <div className={classPrefix}>
      <div className={`${classPrefix}-header`}>
        <Trans>Select token to repurchase</Trans>
      </div>
      <ul>
        {tokens.map((t, i) => {
          const id = `${idPrefix}-${t.symbol}`
          return (
            <li key={t.symbol}>
              <div className={`${classPrefix}-input`}>
                <label htmlFor={id}>
                  <t.Icon />
                  <span>{t.symbol}</span>
                </label>
                <input
                  type="radio"
                  id={id}
                  name={idPrefix}
                  value={t.symbol}
                  checked={props.value ? t.symbol === props.value : t.symbol === token?.symbol}
                  onChange={() => setSymbol(t.symbol)}
                />
              </div>
              <div className={`${classPrefix}-extra`}>
                <Trans>Estimated Receive: </Trans>
                <span>
                  {props.amounts?.[i] || '--'} {t.symbol}
                </span>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default TokenRadioGroup
