import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useState } from 'react'
import { useEffect } from 'react'
import { useMemo } from 'react'
import Popup from 'reactjs-popup'
import Card from 'src/components/Card'
import CollapseCard from 'src/components/CollapaseCard'
import Field from 'src/components/Field'
import { SwitchOutline } from 'src/components/Icon'
import TokenInput from 'src/components/TokenInput'
import useSlippageTolerance from 'src/hooks/useSlippageTolerance'
import useSwap from 'src/libs/web3/hooks/useSwap'
import { TransactionType } from 'src/libs/web3/hooks/useTransaction'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { toBigNumber } from 'src/libs/web3/util'

import { RiskAction, useRiskModal } from '../shared/RiskModal'
import TransactionButtonGroup from '../shared/TransactionButtonGroup'

const Swap: FC = () => {
  const { api } = useWeb3()
  const { ratio: slippageTolerance } = useSlippageTolerance()

  const [pair, setPair] = useState({
    src: { symbol: 'ETH', amount: '' },
    dest: { symbol: 'USDT', amount: '' },
  })
  const swap = useSwap(pair)
  const [confirm, setConfirm] = useState(false)
  const { checkRisk } = useRiskModal()
  const [insufficient, setInsufficient] = useState(false)
  const [change, setChange] = useState<string>()

  const handleSwitch = () => {
    setPair({
      src: pair.dest,
      dest: pair.src,
    })
  }

  const handleChangeSrc = (amount: string, symbol: string) => {
    if (symbol === pair.dest.symbol) {
      handleSwitch()
    } else {
      if (symbol === pair.src.symbol && amount === pair.src.amount) {
        return
      }

      setChange('src')
      pair.src = {
        symbol,
        amount,
      }
      if (swap?.ratio && amount) {
        pair.dest = {
          symbol: pair.dest.symbol,
          amount: toBigNumber(amount).multipliedBy(swap?.ratio).toFixed(),
        }
      }

      setPair({ ...pair })
      setChange(undefined)
    }
  }

  const handleChangeDest = (amount: string, symbol: string) => {
    if (symbol === pair.src.symbol) {
      handleSwitch()
    } else {
      if (symbol === pair.dest.symbol && amount === pair.dest.amount) {
        return
      }

      setChange('dest')
      pair.dest = {
        symbol,
        amount,
      }
      if (swap?.ratio && amount) {
        pair.src = {
          symbol: pair.src.symbol,
          amount: toBigNumber(amount).div(swap?.ratio).toFixed(),
        }
      }

      setPair({ ...pair })
      setChange(undefined)
    }
  }

  useEffect(() => {
    if (swap?.ratio) {
      handleChangeSrc(pair.src.amount, pair.src.symbol)
    }
  }, [swap?.ratio])

  const { src, dest } = pair
  const classPrefix = 'cofi-page-swap'
  const sectionSwap = (
    <section>
      <Card title={t`Exchange`}>
        <div className="token-input-pair">
          <TokenInput
            title={t`FROM`}
            symbol={src.symbol}
            value={src.amount}
            onChange={handleChangeSrc}
            checkInsufficientBalance
            onInsufficientBalance={(b) => setInsufficient(b)}
            loading={!swap.ratio || (swap.loading && change === 'dest')}
          />
          <SwitchOutline onClick={handleSwitch} />
          <TokenInput
            title={t`TO(ESTIMATED)`}
            symbol={dest.symbol}
            value={dest.amount}
            onChange={handleChangeDest}
            loading={!swap.ratio || (swap.loading && change === 'src')}
          />
        </div>

        <Field
          name={t`Trading Price`}
          loading={!swap?.amount?.finalFormat}
          value={`1 ${src.symbol} = ${swap?.amount?.finalFormat || '--'} ${dest.symbol}`}
          tooltip={
            <>
              <h1>
                <Trans>Trade Price Calculation</Trans>
              </h1>

              <section>
                <p>
                  <Trans>
                    The Trade Price is calculated based on the Decentralized NEST Oracle Price, the Computable Risk
                    Compensation Coefficient, the Price Impact, and a Trading Fee. Trading Fee goes to all the COFI
                    holders.
                  </Trans>
                </p>
              </section>
            </>
          }
        >
          {swap && (
            <div className={`${classPrefix}-trading-price-container`}>
              <ul>
                <li>
                  <span>
                    <Trans>NEST Oracle Price</Trans>
                  </span>
                  <span>{`1 ${src.symbol} = ${swap?.amount?.oracleFormat || '--'} ${dest.symbol}`}</span>
                </li>

                <li>
                  <span>
                    <Trans>Price Spread</Trans>
                  </span>
                  <span>{`${swap?.amount?.spreadFormat || '--'} ${dest.symbol}`}</span>
                </li>
              </ul>

              <div className={`${classPrefix}-trading-price-tip`}>
                <span>
                  <Trans>Includes Risk Compensation,Trading Fee and Price Impact</Trans>
                </span>

                <Popup
                  on="hover"
                  trigger={
                    <span className="link">
                      <Trans>How is this calculated?</Trans>
                    </span>
                  }
                >
                  <div className={`${classPrefix}-trading-price-popup`}>
                    <section>
                      <h1>
                        <Trans>Trade Price Calculation</Trans>
                      </h1>
                    </section>

                    <section>
                      <p>
                        <Trans>
                          The Trade Price is calculated based on the Decentralised NEST Oracle Price, the Computable
                          Risk Compensation Coefficient, the Price Impact, and a Trading Fee. Trading Fee goes to all
                          the COFI holders.
                        </Trans>
                      </p>
                    </section>
                  </div>
                </Popup>
              </div>
            </div>
          )}
        </Field>

        <Field
          name={t`Oracle Call Fee`}
          loading={!swap?.oracleCallFee?.format}
          value={`+ ${swap?.oracleCallFee?.format || '--'} ETH`}
          tooltip={
            <>
              <h1>
                <Trans>Oracle Call Fee</Trans>
              </h1>

              <section>
                <p>
                  <Trans>
                    Oracle Fee is what you pay to the NEST protocol for providing accurate market price data to the
                    smart contract.
                  </Trans>
                </p>
              </section>
            </>
          }
        />

        <TransactionButtonGroup
          approve={{
            transactionType: TransactionType.Swap,
            token: [src.symbol, dest.symbol],
          }}
          disabled={!src.amount || toBigNumber(src.amount).lte(0) || !swap.ratio || insufficient}
          onClick={async () => {
            try {
              await checkRisk(RiskAction.Swap)
              setConfirm(true)
            } catch (_) {
              // comment for eslint
            }
          }}
        >
          <Trans>Exchange</Trans>
        </TransactionButtonGroup>
      </Card>
    </section>
  )

  const paths = useMemo(() => {
    if (swap.paths) {
      return swap.paths.map((p) => api?.getTokenByAddress(p)?.symbol).join(' > ')
    } else {
      return [src.symbol, dest.symbol].join(' > ')
    }
  }, [swap.paths])

  const sectionConfirm = (
    <section>
      <Card title={t`Confirm Swap`} backward onBackwardClick={() => setConfirm(false)}>
        <Field name={t`FROM`} value={`${src.amount} ${src.symbol}`} />
        <Field name={t`TO(ESTIMATED)`} value={`${dest.amount} ${dest.symbol}`} />
        <Field name={t`Swap Rate`} value={`1 ${src.symbol} = ${swap?.amount?.finalFormat || '--'} ${dest.symbol}`} />
        <Field name={t`Swap Route`} value={paths} />
        {swap?.swapInfo?.fee && (
          <Field
            name={t`FEE(ESTIMATED)`}
            value={
              <>
                {Object.keys(swap.swapInfo.fee).map((token) => (
                  <div key={token}>
                    {api?.Tokens[token].format(swap?.swapInfo?.fee[token] || '')} {token}
                  </div>
                ))}
              </>
            }
          />
        )}
        <Field
          name={t`Oracle Call Fee`}
          value={`+ ${swap?.oracleCallFee?.format || '--'} ETH`}
          tooltip={
            <>
              <h1>
                <Trans>Oracle Call Fee</Trans>
              </h1>

              <section>
                <p>
                  <Trans>
                    Oracle Fee is what you pay to the NEST protocol for providing accurate market price data to the
                    smart contract.
                  </Trans>
                </p>
              </section>
            </>
          }
        />
        <Field
          tooltip={
            <>
              <section>
                <p>
                  <Trans>If you receive less than this amount, the transaction will be rejected</Trans>
                </p>
              </section>
            </>
          }
          name={t`Minimum Received`}
          value={`${swap.amountOutMinFormat} ${dest.symbol}`}
        />
        <Field
          tooltip={
            <>
              <section>
                <p>
                  <Trans>
                    If your actual exchange rate is {`${slippageTolerance * 100} %`} higher than the current page, the
                    transaction will be rejected
                  </Trans>
                </p>
              </section>
            </>
          }
          name={t`Slippage Tolerance`}
          value={`${slippageTolerance * 100} %`}
        />

        <TransactionButtonGroup
          approve={{
            transactionType: TransactionType.Swap,
            token: [src.symbol, dest.symbol],
          }}
          disabled={!src.amount || !swap.ratio}
          onClick={swap.handler}
        >
          <Trans>Exchange</Trans>
        </TransactionButtonGroup>
      </Card>
    </section>
  )

  return (
    <div className={`cofi-page ${classPrefix}`}>
      {confirm ? sectionConfirm : sectionSwap}

      <section>
        <CollapseCard title={t`What is CoFiX Swap?`}>
          <section>
            <p>
              <Trans>CoFiX Dapp is the most efficient Token Swap on Ethereum.</Trans>
            </p>
            <p>
              <Trans>Traders always get market prices at the smallest spread.</Trans>
            </p>
            <p>
              <Trans>Reversing trade in CoFiX can mining COFI Tokens by hedging.</Trans>
            </p>
          </section>

          <section>
            <p>
              <a
                href="https://github.com/Computable-Finance/Doc#5-trading-mechanism"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                <Trans>Read More about CoFiX Mining</Trans>
              </a>
            </p>
          </section>
        </CollapseCard>
      </section>
    </div>
  )
}

export default Swap
