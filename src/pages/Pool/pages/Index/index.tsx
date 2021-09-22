import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Link, useHistory } from 'react-router-dom'
import Button from 'src/components/Button'
import Card from 'src/components/Card'
import { BarGraphOutline, DashboardOutline, DollarOutline, Empty, PercentageSignOutline } from 'src/components/Icon'
// import Tag from 'src/components/Tag'
import usePoolInfo from 'src/hooks/usePoolInfo'
import useToken from 'src/hooks/useToken'
import { AnchorPoolInfo } from 'src/libs/web3/api/CoFiXAnchorPool'
import { PoolInfo } from 'src/libs/web3/api/CoFiXPair'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import PoolSelector from 'src/pages/shared/PoolSelector'

const Item: FC<{
  Icon: typeof DollarOutline
  title: string
  content: string
  loading: boolean
}> = ({ Icon, title, content, loading }) => {
  return (
    <>
      <Icon />

      <div>
        <span>{title}</span>
        {loading ? <Skeleton width={100} /> : <span>{content}</span>}
      </div>
    </>
  )
}

const Pool: FC = () => {
  const { api } = useWeb3()
  const [pair, setPair] = useState(['ETH', 'NEST'])
  const [symbol, setSymbol] = useState('USDT')
  const { info: poolInfo } = usePoolInfo<PoolInfo>(pair[0], pair[1])
  const { info: anchorPoolInfo } = usePoolInfo<AnchorPoolInfo>(symbol)

  const [token0, token1] = [useToken(pair[0]), useToken(pair[1])]
  const token = useToken(symbol)

  const classPrefix = 'cofi-page-pool-index'

  const empty = (
    <div className={`${classPrefix}-empty`}>
      <Empty />
      <div>
        <Trans>Empty Liquidity</Trans>
      </div>
    </div>
  )

  const history = useHistory()

  const sectionPairPool = token0 && token1 && (
    <section className={`${classPrefix}-pool-container`}>
      <div className={`${classPrefix}-pool`}>
        <PoolSelector symbol={pair} onChange={(p) => setPair(p)} />

        <div className={`${classPrefix}-info`}>
          <div className={`${classPrefix}-info-container`}>
            <h1 className={`${classPrefix}-h1`}>{`${token0.symbol}-${token1.symbol} ${t`Pool`}`}</h1>
            <Card>
              <div className={`${classPrefix}-section`}>
                <div className={`${classPrefix}-header`}>
                  <div className={`${classPrefix}-title`}>
                    <span>{`${token0.symbol}-${token1.symbol} ${t`Pool`}`}</span>
                    {/* <Tag>{`${t`Mining`} x2`}</Tag> */}
                  </div>
                </div>

                <ul className={`${classPrefix}-ul responsive`}>
                  <li>
                    <Item
                      Icon={DollarOutline}
                      title={t`TVL`}
                      content={api && poolInfo ? api.Tokens.USDT.format(poolInfo.totalFunds) : '--'}
                      loading={!poolInfo}
                    />
                  </li>
                  <li>
                    <Item
                      Icon={PercentageSignOutline}
                      title={t`Net worth`}
                      content={poolInfo ? poolInfo.nav.toFormat(8) : '--'}
                      loading={!poolInfo}
                    />
                  </li>
                  <li>
                    <Item
                      Icon={token0.Icon}
                      title={`${token0.symbol} ${t`Amount`}`}
                      content={poolInfo ? poolInfo.formatAmounts[0] : '--'}
                      loading={!poolInfo}
                    />
                  </li>
                  <li>
                    <Item
                      Icon={token1.Icon}
                      title={`${token1.symbol} ${t`Amount`}`}
                      content={poolInfo ? poolInfo.formatAmounts[1] : '--'}
                      loading={!poolInfo}
                    />
                  </li>
                  <li>
                    <Item
                      Icon={DashboardOutline}
                      title={t`Mining Speed`}
                      content={`${poolInfo ? poolInfo.miningSpeed : '--'} COFI / ${t`Block`}`}
                      loading={!poolInfo}
                    />
                  </li>
                  <li>
                    <Item
                      Icon={BarGraphOutline}
                      title={t`Current APR`}
                      content={poolInfo ? poolInfo.apr : '--'}
                      loading={!poolInfo}
                    />
                  </li>
                </ul>
              </div>
            </Card>

            <Button
              block
              gradient
              primary
              disabled={token0.symbol === 'ETH' && token1.symbol === 'USDT'}
              onClick={() => history.push(`/pool/add-liquidity/${token0.symbol}/${token1.symbol}`)}
            >
              <Trans>Add Liquidity</Trans>
            </Button>

            {token0.symbol === 'ETH' && token1.symbol === 'USDT' && (
              <div className={`${classPrefix}-footer`}>
                <span>
                  <Trans>The current fund pool is no longer mined</Trans>
                </span>
              </div>
            )}
          </div>

          <div className={`${classPrefix}-info-container`}>
            <h1 className={`${classPrefix}-h1`}>{t`My Pool`}</h1>
            {poolInfo?.emptyLiquidity ? (
              empty
            ) : (
              <Card>
                <div className={`${classPrefix}-section`}>
                  <div className={`${classPrefix}-header`}>
                    <div className={`${classPrefix}-title`}>
                      <span>{`${token0.symbol}-${token1.symbol} ${t`Pool`}`}</span>
                      {/* <Tag>{`${t`Mining`} x2`}</Tag> */}
                    </div>

                    <div className={`${classPrefix}-extra`}>
                      <Trans>Amount | Percentage</Trans>
                    </div>
                  </div>

                  <ul className={`${classPrefix}-ul`}>
                    <li>
                      <token0.Icon />
                      <div>
                        <span>{token0.symbol}</span>
                        {poolInfo ? (
                          <span>{poolInfo ? `${poolInfo.myPoolAmounts[0]} | ${poolInfo.myPoolRatio}` : '--'}</span>
                        ) : (
                          <Skeleton width={200} />
                        )}
                      </div>
                    </li>
                    <li>
                      <token1.Icon />
                      <div>
                        <span>{token1.symbol}</span>
                        {poolInfo ? (
                          <span>{poolInfo ? `${poolInfo.myPoolAmounts[1]} | ${poolInfo.myPoolRatio}` : '--'}</span>
                        ) : (
                          <Skeleton width={200} />
                        )}
                      </div>
                    </li>
                  </ul>
                </div>
              </Card>
            )}

            {!poolInfo || poolInfo?.emptyLiquidity || (
              <Button block gradient>
                <Link to={`/pool/remove-liquidity/${token0.symbol}/${token1.symbol}`}>
                  <Trans>Remove Liquidity</Trans>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )

  const sectionAnchorPool = token && (
    <section className={`${classPrefix}-pool-container`}>
      <div className={`${classPrefix}-pool`}>
        <PoolSelector symbol={[symbol]} onChange={(t) => setSymbol(t[0])} />

        <div className={`${classPrefix}-info`}>
          <div className={`${classPrefix}-info-container`}>
            <h1 className={`${classPrefix}-h1`}>{`${token.symbol} ${t`Pool`}`}</h1>
            <Card>
              <div className={`${classPrefix}-section`}>
                <div className={`${classPrefix}-header`}>
                  <div className={`${classPrefix}-title`}>
                    <span>{`${token.symbol} ${t`Pool`}`}</span>
                    {/* <Tag>{`${t`Mining`}`}</Tag> */}
                  </div>
                </div>

                <ul className={`${classPrefix}-ul responsive`}>
                  <li>
                    <Item
                      Icon={DollarOutline}
                      title={t`TVL`}
                      content={api && anchorPoolInfo ? api.Tokens.USDT.format(anchorPoolInfo.totalFunds) : '--'}
                      loading={!anchorPoolInfo}
                    />
                  </li>

                  <li>
                    <Item
                      Icon={token.Icon}
                      title={`${token.symbol} ${t`Amount`}`}
                      content={anchorPoolInfo ? anchorPoolInfo.formatAmount : '--'}
                      loading={!anchorPoolInfo}
                    />
                  </li>

                  <li>
                    <Item
                      Icon={PercentageSignOutline}
                      title={t`Total Supply`}
                      content={anchorPoolInfo ? anchorPoolInfo.xtokenTotalSupply.formatAmount : '--'}
                      loading={!anchorPoolInfo}
                    />
                  </li>

                  <li>
                    <Item
                      Icon={DashboardOutline}
                      title={t`Mining Speed`}
                      content={`${anchorPoolInfo ? anchorPoolInfo.miningSpeed : '--'} COFI / ${t`Block`}`}
                      loading={!anchorPoolInfo}
                    />
                  </li>

                  <li>
                    <Item
                      Icon={BarGraphOutline}
                      title={t`Current APR`}
                      content={anchorPoolInfo ? anchorPoolInfo.apr : '--'}
                      loading={!anchorPoolInfo}
                    />
                  </li>
                </ul>
              </div>
            </Card>

            <Button
              block
              gradient
              primary
              disabled={anchorPoolInfo?.miningSpeed === 0}
              onClick={() => history.push(`/pool/add-liquidity/${token.symbol}`)}
            >
              <Trans>Add Liquidity</Trans>
            </Button>

            {anchorPoolInfo?.miningSpeed === 0 && (
              <div className={`${classPrefix}-footer`}>
                <span>The current fund pool is no longer mined</span>
              </div>
            )}
          </div>

          <div className={`${classPrefix}-info-container`}>
            <h1 className={`${classPrefix}-h1`}>{t`My Pool`}</h1>
            {anchorPoolInfo?.emptyLiquidity ? (
              empty
            ) : (
              <Card>
                <div className={`${classPrefix}-section`}>
                  <div className={`${classPrefix}-header`}>
                    <div className={`${classPrefix}-title`}>
                      <span>{`${token.symbol} ${t`Pool`}`}</span>
                      {/* <Tag>{`${t`Mining`}`}</Tag> */}
                    </div>

                    <div className={`${classPrefix}-extra`}>
                      <Trans>Amount | Percentage</Trans>
                    </div>
                  </div>

                  <ul className={`${classPrefix}-ul`}>
                    <li>
                      <token.Icon />
                      <div>
                        <span>{token.symbol}</span>
                        {anchorPoolInfo ? (
                          <span>
                            {anchorPoolInfo
                              ? `${anchorPoolInfo.myPoolFormatAmount} | ${anchorPoolInfo.myPoolRatio}`
                              : '--'}
                          </span>
                        ) : (
                          <Skeleton width={200} />
                        )}
                      </div>
                    </li>
                  </ul>
                </div>
              </Card>
            )}

            {!anchorPoolInfo || anchorPoolInfo?.emptyLiquidity || (
              <Button block gradient>
                <Link to={`/pool/remove-liquidity/${token.symbol}`}>
                  <Trans>Remove Liquidity</Trans>
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <>
      {sectionPairPool}
      {sectionAnchorPool}
    </>
  )
}

export default Pool
