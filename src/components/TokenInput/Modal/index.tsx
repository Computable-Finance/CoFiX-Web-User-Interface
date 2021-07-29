import { FC } from 'react'
import './styles'

import Card from 'src/components/Card'
import { t } from '@lingui/macro'
import { useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import Button from 'src/components/Button'
import { useMemo } from 'react'

type Props = {
  onClose?: () => any
  onSelect?: (symbol: string) => any

  tokens?: Array<string>
}

const Modal: FC<Props> = (props) => {
  const [search, setSearch] = useState('')
  const { api } = useWeb3()

  const classPrefix = 'cofi-token-input-modal'
  const handleSelect = (symbol: string) => {
    return () => {
      if (props.onSelect) {
        props.onSelect(symbol)
      }
    }
  }

  const Whitelist = useMemo(() => {
    if (!api) {
      return []
    }

    if (props.tokens) {
      return props.tokens.map((t) => api.Tokens[t])
    }

    return Object.values(api.Tokens).filter((t) => !t.isXToken)
  }, [api?.Tokens, props.tokens])

  return (
    <Card title={t`Select Token`} closable onClose={props.onClose} className={`${classPrefix}`}>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t`Search name or address`}
      />

      <ul>
        {Whitelist.filter((t) => {
          if (t.symbol.toLowerCase().indexOf(search.toLowerCase()) > -1) {
            return true
          }

          if (!t.address) {
            return false
          }

          if (t.address.toLowerCase().indexOf(search.toLowerCase()) > -1) {
            return true
          }

          return false
        }).map((t) => (
          <li key={t.symbol}>
            <Button className={`${classPrefix}-button`} onClick={handleSelect(t.symbol)}>
              <div className={`${classPrefix}-icon`}>
                <t.Icon />
              </div>

              <div className={`${classPrefix}-token`}>
                <div className={`${classPrefix}-symbol`}>{t.symbol}</div>
                {t.address && t.symbol !== 'ETH' && <div className={`${classPrefix}-address`}>{t.address}</div>}
              </div>
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  )
}

export default Modal
