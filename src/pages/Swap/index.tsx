import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useEffect, useState } from 'react'
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

let ver = 0
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
  const [change, setChange] = useState('')

  const handleSwitch = () => {
    setPair((pair) => ({
      src: pair.dest,
      dest: pair.src,
    }))
  }

  useEffect(() => {
    handleChange('src', pair.src.amount, pair.src.symbol)
  }, [pair.dest.symbol, pair.src.symbol])

  const handleChange = async (action: 'src' | 'dest', amount: string, symbol: string) => {
    if (action === 'src') {

      pair.src = {
        symbol,
        amount,
      }
      if (toBigNumber(amount).eq(0)) {
        pair.dest = {
          symbol: pair.dest.symbol,
          amount: amount,
        }
        setPair({ ...pair })
        return
      }

      const curVer = ++ver
      setChange('src')
      const info = await api?.getSwapInfo(symbol, pair.dest.symbol, amount)
      
      if (ver > curVer) {
        return
      }

      if (info && amount) {
        const ratio = info.amountOut.div(amount)
        pair.dest = {
          symbol: pair.dest.symbol,
          amount: toBigNumber(amount)
            .multipliedBy(ratio)
            .toFixed(Math.min(api?.Tokens[pair.dest.symbol].decimals || 18, 8)),
        }
      }

      setPair({ ...pair })
    } else {

      if (symbol === pair.dest.symbol && amount === pair.dest.amount) {
        return
      }

      pair.dest = {
        symbol,
        amount,
      }
      if (toBigNumber(amount).eq(0)) {
        pair.src = {
          symbol: pair.src.symbol,
          amount: amount,
        }
        setPair({ ...pair })
        return
      }

      const curVer = ++ver
      setChange('dest')
      const info = await api?.getSwapInfo(pair.src.symbol, symbol, "1")
      if (ver > curVer) {
        return
      }

      if (info && amount) {
        // const ratio = info.amountOut.div(amount)
        pair.src = {
          symbol: pair.src.symbol,
          amount: toBigNumber(amount)
            .div(info.amountOut)
            .toFixed(Math.min(api?.Tokens[pair.src.symbol].decimals || 18, 8)),
        }
      }

      setPair({ ...pair })
    }
  }

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
            onChange={(amount: string, symbol: string) => handleChange('src', amount, symbol)}
            checkInsufficientBalance
            onInsufficientBalance={(b) => setInsufficient(b)}
            loading={swap.loading && change != 'src'}
            onFocus={() => setChange('src')}
          />
          <button className="token-input-pair-middleButton" onClick={handleSwitch}>
            <SwitchOutline/>
          </button>
          
          <TokenInput
            title={t`TO(ESTIMATED)`}
            symbol={dest.symbol}
            value={dest.amount}
            noExtra={dest.symbol === "ETH" && src.symbol === "USDT" || dest.symbol === "USDT" && src.symbol === "ETH"}
            onChange={(amount: string, symbol: string) => handleChange('dest', amount, symbol)}
            loading={swap.loading && change != 'dest'}
            onFocus={() => setChange('dest')}
          />
        </div>

        <Field
          name={t`Trading Price`}
          loading={swap.loading}
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
        { !(src.symbol === "ETH" && dest.symbol === "USDT" || src.symbol === "USDT" && dest.symbol === "ETH") && (
          <Field
            name={t`Oracle Call Fee`}
            loading={swap.loading}
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
        )}

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
        <Field name={t`TO(ESTIMATED)`} value={`${api?.Tokens[dest.symbol].format(dest.amount)} ${dest.symbol}`} />
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
        { !(src.symbol === "ETH" && dest.symbol === "USDT" || src.symbol === "USDT" && dest.symbol === "ETH") && (
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
        )}
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
