import './styles'

import { Trans, t } from '@lingui/macro'
import classNames from 'classnames'
import { FC, useEffect, useRef, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import Popup from 'reactjs-popup'
import Button from 'src/components/Button'
import Card from 'src/components/Card'
import { ArrowDownOutline } from 'src/components/Icon'
import useDAOBalance from 'src/hooks/useDAOBalance'
import useToken from 'src/hooks/useToken'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

type Props = {
  symbol: string
  onChange?: (symbol: string) => any
  insufficient?: boolean
}

const AnchorSelector: FC<Props> = (props) => {
  const { api } = useWeb3()
  const [symbol, setSymbol] = useState(props.symbol as string)
  const token = useToken(symbol)
  const modal = useRef<any>()
  const daoBalance = useDAOBalance()

  useEffect(() => {
    if (symbol !== props.symbol && props.onChange) {
      props.onChange(symbol)
    }
  }, [symbol])

  if (!api) {
    return <></>
  }

  const classPrefix = `cofi-anchor-selector`
  return (
    <div className={`${classPrefix}`}>
      <div className={`${classPrefix}-title`}>
        <Trans>Select Anchor</Trans>
      </div>

      <div className={`${classPrefix}-container`}>
        <div className={`${classPrefix}-token`}>
          {token && <token.Icon />}
          {token && <span>{token.symbol}</span>}

          <Popup
            ref={modal}
            modal
            trigger={
              <span className={`${classPrefix}-arrow`}>
                <ArrowDownOutline />
              </span>
            }
          >
            <Card
              title={t`Select Anchor`}
              closable
              onClose={() => modal.current.close()}
              className={`${classPrefix}-modal`}
            >
              {Array.from(new Set(Object.values(api.CoFixAnchorPools))).map((p) => {
                return (
                  <div key={p.title}>
                    <h1>
                      <Trans id={p.title}></Trans>
                    </h1>

                    <ul>
                      {Object.values(p.tokens).map((s) => {
                        const t = api.Tokens[s]

                        return (
                          <li
                            key={t.symbol}
                            onClick={() => {
                              setSymbol(t.symbol)
                              modal.current.close()
                            }}
                          >
                            <Button block primary={t.symbol === symbol}>
                              <div className={`${classPrefix}-modal-token`}>
                                <t.Icon />
                                <div>{`${t.symbol}`}</div>
                              </div>
                              <div className={`${classPrefix}-modal-balance`}>
                                <div>
                                  <Trans>Balance In DAO</Trans>
                                </div>
                                {daoBalance ? (
                                  <div>{`${daoBalance[t.symbol].formatAmount || '--'} ${t.symbol}`}</div>
                                ) : (
                                  <Skeleton width={100} />
                                )}
                              </div>
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )
              })}
            </Card>
          </Popup>
        </div>
      </div>

      <div className={`${classPrefix}-extra`}>
        {daoBalance && token ? (
          <span
            className={classNames({
              [`${classPrefix}-balance`]: true,
              error: props.insufficient,
            })}
          >{`${t`Balance in DAO:`} ${daoBalance[symbol].formatAmount || '--'} ${token?.symbol}`}</span>
        ) : (
          <span className="w100">
            <Skeleton />
          </span>
        )}
      </div>
    </div>
  )
}

export default AnchorSelector
