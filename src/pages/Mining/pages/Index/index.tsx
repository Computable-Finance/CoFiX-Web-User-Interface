import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useState } from 'react'
import Skeleton from 'react-loading-skeleton'
import { Link } from 'react-router-dom'
import Button from 'src/components/Button'
import ButtonGroup from 'src/components/Button/Group'
import Card from 'src/components/Card'
import Field from 'src/components/Field'
import TokenInput from 'src/components/TokenInput'
import useEarnedCOFI from 'src/hooks/useEarnedCOFI'
import useStakeInfo from 'src/hooks/useStakeInfo'
import useToken from 'src/hooks/useToken'
import useTokenUSDTAmount from 'src/hooks/useTokenUSDTAmount'
import useClaimCOFI from 'src/libs/web3/hooks/useClaimCOFI'
import PoolSelector from 'src/pages/shared/PoolSelector'
import TransactionButtonGroup from 'src/pages/shared/TransactionButtonGroup'

const Item: FC<{
  title: string
  content: string
  loading: boolean
}> = (props) => {
  return (
    <>
      <span>{props.title}</span>
      {props.loading ? <Skeleton width={50} /> : <span>{props.content}</span>}
    </>
  )
}

const Mining: FC = () => {
  const [pair, setPair] = useState(['ETH', 'USDT'])
  const [token0, token1] = [useToken(pair[0]), useToken(pair[1])]
  const pairStakeInfo = useStakeInfo(pair[0], pair[1])
  const pairEarnedCOFI = useEarnedCOFI(pair[0], pair[1])
  const cofiUSDTAmount = useTokenUSDTAmount('COFI')
  const handlePairClaimCOFI = useClaimCOFI({
    token0: pair[0],
    token1: pair[1],
    amount: pairEarnedCOFI?.formatAmount,
  })

  const [symbol, setSymbol] = useState('USDT')
  const token = useToken(symbol)
  const anchorStakeInfo = useStakeInfo(symbol)
  const anchorEarnedCOFI = useEarnedCOFI(symbol)
  const handleAnchorClaimCOFI = useClaimCOFI({
    token0: symbol,
    amount: anchorEarnedCOFI?.formatAmount,
  })

  const classPrefix = 'cofi-page-mining-index'

  const sectionPairPool = token0 && token1 && (
    <section className={`${classPrefix}-mining`}>
      <PoolSelector symbol={pair} onChange={(p) => setPair(p)} />

      <div className={`${classPrefix}-info`}>
        <div className={`${classPrefix}-info-container`}>
          <h1 className={`${classPrefix}-h1`}>{`${token0.symbol}-${token1.symbol} ${t`Pool`}`}</h1>

          <Card>
            <div className={`${classPrefix}-section`}>
              <ul className={`${classPrefix}-simple-ul`}>
                <li>
                  <Item
                    title={t`XToken In Mining Pool`}
                    content={`${pairStakeInfo ? pairStakeInfo.xTokenInPool.formatAmount : '--'} XToken`}
                    loading={!pairStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`XToken Staked`}
                    content={`${pairStakeInfo ? pairStakeInfo.stakedXToken.formatAmount : '--'} XToken`}
                    loading={!pairStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`Percentage`}
                    content={pairStakeInfo ? pairStakeInfo.stakedRatio : '--'}
                    loading={!pairStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`Estimated Daily Mined`}
                    content={`${pairStakeInfo ? pairStakeInfo.dailyMined.toString() : '--'} COFI`}
                    loading={!pairStakeInfo}
                  />
                </li>
              </ul>
            </div>
          </Card>

          <ButtonGroup block responsive>
            <Button block gradient primary>
              <Link to={`/mining/stake-xtoken/${token0.symbol}/${token1.symbol}`}>
                <Trans>Stake XToken</Trans>
              </Link>
            </Button>

            {pairStakeInfo?.stakedXToken.value.gt(0) && (
              <Button block gradient>
                <Link to={`/mining/withdraw-xtoken/${token0.symbol}/${token1.symbol}`}>
                  <Trans>Withdraw XToken</Trans>
                </Link>
              </Button>
            )}
          </ButtonGroup>
        </div>

        <div className={`${classPrefix}-info-container`}>
          <h1 className={`${classPrefix}-h1`}>{t`Claim COFI`}</h1>

          <TokenInput
            title={t`Available COFI Amount to Claim`}
            symbol="COFI"
            value={pairEarnedCOFI?.amount.toFixed(4) || ''}
            selectable={false}
            editable={false}
            noExtra
            className={`${classPrefix}-token-input`}
            loading={!pairEarnedCOFI}
          />

          <Field
            name={t`COFI Market Price (Nest Oracle)`}
            value={`
          ${cofiUSDTAmount ? cofiUSDTAmount.formatAmount : '--'} USD
          `}
            loading={!cofiUSDTAmount?.formatAmount}
          />

          <TransactionButtonGroup
            onClick={handlePairClaimCOFI.handler}
            disabled={!pairEarnedCOFI || pairEarnedCOFI.value.lte(0)}
          >
            <Trans>Claim COFI</Trans>
          </TransactionButtonGroup>
        </div>
      </div>
    </section>
  )

  const sectionAnchorPool = token && (
    <section className={`${classPrefix}-mining`}>
      <PoolSelector symbol={[symbol]} onChange={(t) => setSymbol(t[0])} />

      <div className={`${classPrefix}-info`}>
        <div className={`${classPrefix}-info-container`}>
          <h1 className={`${classPrefix}-h1`}>{`${token.symbol} ${t`Pool`}`}</h1>

          <Card>
            <div className={`${classPrefix}-section`}>
              <ul className={`${classPrefix}-simple-ul`}>
                <li>
                  <Item
                    title={t`XToken In Mining Pool`}
                    content={`${anchorStakeInfo ? anchorStakeInfo.xTokenInPool.formatAmount : '--'} XToken`}
                    loading={!anchorStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`XToken Staked`}
                    content={`${anchorStakeInfo ? anchorStakeInfo.stakedXToken.formatAmount : '--'} XToken`}
                    loading={!anchorStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`Percentage`}
                    content={anchorStakeInfo ? anchorStakeInfo.stakedRatio : '--'}
                    loading={!anchorStakeInfo}
                  />
                </li>

                <li>
                  <Item
                    title={t`Estimated Daily Mined`}
                    content={`${anchorStakeInfo ? anchorStakeInfo.dailyMined.toString() : '--'} COFI`}
                    loading={!anchorStakeInfo}
                  />
                </li>
              </ul>
            </div>
          </Card>

          <ButtonGroup block responsive>
            <Button block gradient primary>
              <Link to={`/mining/stake-xtoken/${token.symbol}`}>
                <Trans>Stake XToken</Trans>
              </Link>
            </Button>

            {anchorStakeInfo?.stakedXToken.value.gt(0) && (
              <Button block gradient>
                <Link to={`/mining/withdraw-xtoken/${token.symbol}`}>
                  <Trans>Withdraw XToken</Trans>
                </Link>
              </Button>
            )}
          </ButtonGroup>
        </div>

        <div className={`${classPrefix}-info-container`}>
          <h1 className={`${classPrefix}-h1`}>{t`Claim COFI`}</h1>

          <TokenInput
            title={t`Available COFI Amount to Claim`}
            symbol="COFI"
            value={anchorEarnedCOFI?.amount.toFixed(4) || ''}
            selectable={false}
            editable={false}
            noExtra
            className={`${classPrefix}-token-input`}
            loading={!anchorEarnedCOFI}
          />

          <Field
            name={t`COFI Market Price (Nest Oracle)`}
            value={`
          ${cofiUSDTAmount ? cofiUSDTAmount.formatAmount : '--'} USD
          `}
            loading={!cofiUSDTAmount?.formatAmount}
          />

          <TransactionButtonGroup
            onClick={handleAnchorClaimCOFI.handler}
            disabled={!anchorEarnedCOFI || anchorEarnedCOFI.value.lte(0)}
          >
            <Trans>Claim COFI</Trans>
          </TransactionButtonGroup>
        </div>
      </div>
    </section>
  )

  return (
    <div className="cofi-page cofi-page-mining-index">
      {sectionPairPool}
      {sectionAnchorPool}
    </div>
  )
}

export default Mining
