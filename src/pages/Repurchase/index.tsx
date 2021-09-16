import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useEffect, useMemo, useState } from 'react'
import Card from 'src/components/Card'
import CollapseCard from 'src/components/CollapaseCard'
import Field from 'src/components/Field'
import { GrayTokenCOFI, GrayTokenETH, GrayTokenUSDT } from 'src/components/Icon'
import TokenInput from 'src/components/TokenInput'
import useDAOBalance from 'src/hooks/useDAOBalance'
import useDAOInfo from 'src/hooks/useDAOInfo'
import useTokenBalance from 'src/hooks/useTokenBalance'
import useRepurchase from 'src/libs/web3/hooks/useRepurchase'
import { TransactionType } from 'src/libs/web3/hooks/useTransaction'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { toBigNumber } from 'src/libs/web3/util'
import TransactionButtonGroup from 'src/pages/shared/TransactionButtonGroup'

import { RiskAction, useRiskModal } from '../shared/RiskModal'
import AnchorSelector from './AnchorSelector'
import RepurchaseCard from './Card'
import useEtherScanHost from 'src/hooks/useEtherScanHost'

const Repurchase: FC = () => {
  const { checkRisk } = useRiskModal()
  useEffect(() => {
    ;(async () => {
      try {
        await checkRisk(RiskAction.Repurchase)
      } catch (_) {
        // comment for eslint
      }
    })()
  }, [])

  const { account, api } = useWeb3()
  const daoInfo = useDAOInfo()

  const [amount, setAmount] = useState('')
  const [symbol, setSymbol] = useState('ETH')
  // const { balance: ethBalance } = useTokenBalance('ETH', account || '')
  const { balance: cofiBalance } = useTokenBalance('COFI', account || '')
  const anchorPool = api?.CoFixAnchorPools[symbol]
  const [insufficient, setInsufficient] = useState(false)
  const daoBalance = useDAOBalance()
  const etherScanHost = useEtherScanHost()

  const handleRepurchase = useRepurchase({
    amount,
    symbol,
  })

  const insufficientAnchor = useMemo(() => {
    if (!cofiBalance || !amount || !anchorPool || !daoBalance) {
      return false
    }

    const target = anchorPool.anchorToken === 'ETH' ? handleRepurchase.ethAmount : handleRepurchase.usdtAmount
    if (!target) {
      return false
    }

    return target.amount.gte(daoBalance[symbol].amount)
  }, [cofiBalance, amount, anchorPool, daoBalance, handleRepurchase.ethAmount, handleRepurchase.usdtAmount])

  const classPrefix = 'cofi-page-repurchase'


  return (
    <div className={`cofi-page ${classPrefix}`}>
      <section className={`${classPrefix}-summary`}>
        <ul>
          <li>
            <RepurchaseCard
              title={t`DAO balance（ETH-Anchor）`}
              value={daoInfo ? api?.Tokens.ETH.format(daoInfo.ethAmount) : '--'}
              icon={<GrayTokenETH />}
              loading={!daoInfo}
            />
          </li>
          <li>
            <RepurchaseCard
              title={t`DAO balance（USD-Anchor）`}
              value={daoInfo ? api?.Tokens.USDT.format(daoInfo.usdtAmount) : '--'}
              icon={<GrayTokenUSDT />}
              loading={!daoInfo}
            />
          </li>
          <li>
            <RepurchaseCard
              title={t`Accumulated repurchase in DAO (COFI)`}
              value={daoInfo ? toBigNumber(daoInfo.cofiAmount).toFormat(0) : '--'}
              icon={<GrayTokenCOFI />}
              loading={!daoInfo}
            />
          </li>
          <li>
            <RepurchaseCard
              title={t`Current Circulation (COFI)`}
              value={daoInfo ? toBigNumber(daoInfo.cofiCirculationAmount).toFormat(0) : '--'}
              icon={<GrayTokenCOFI />}
              loading={!daoInfo}
            />
          </li>
        </ul>
      </section>

      <section>
        <Card title={t`Repurchase`}>
          <TokenInput
            title={t`Input Repurchase Amount`}
            symbol="COFI"
            selectable={false}
            value={amount}
            onChange={(v) => setAmount(v)}
            checkInsufficientBalance
            onInsufficientBalance={(i) => setInsufficient(i)}
          />

          <AnchorSelector symbol={symbol} onChange={(s) => setSymbol(s)} insufficient={insufficientAnchor} />

          <TokenInput
            title={t`Estimated Receive:`}
            value={
              (anchorPool?.anchorToken === 'ETH'
                ? handleRepurchase.ethAmount?.formatAmount
                : handleRepurchase.usdtAmount?.formatAmount) || '--'
            }
            symbol={symbol}
            selectable={false}
            noExtra
            editable={false}
          />

          <Field
            name={t`Current available amount of repurchase`}
            value={daoInfo ? daoInfo.quota.toFixed(0) : `--`}
            loading={!daoInfo}
          />
          {anchorPool?.anchorToken === 'ETH' ? (
            <Field
              name={t`Current Repurchase Price` + ` (COFI/ETH)`}
              value={
                daoInfo
                  ? `${daoInfo.cofiETHAmount ? api?.Tokens.ETH.format(daoInfo.cofiETHAmount) : '--'} ETH`
                  : '-- ETH'
              }
              loading={!daoInfo}
            />
          ) : (
            <Field
              name={t`Current Repurchase Price` + ` (COFI/USDT)`}
              value={
                daoInfo
                  ? `${daoInfo.cofiUSDTAmount ? api?.Tokens.USDT.format(daoInfo.cofiUSDTAmount) : '--'} USDT`
                  : '-- ETH'
              }
              loading={!daoInfo}
            />
          )}
          {/* <Field
            name={t`ETH Balance in your wallet`}
            value={`${ethBalance ? ethBalance.formatAmount : '--'} ETH`}
            loading={!ethBalance || ethBalance.value.lt(0)}
          /> */}

          <TransactionButtonGroup
            approve={{
              transactionType: TransactionType.Repurchase,
              token: ['COFI', 'COFI'],
            }}
            disabled={insufficient || insufficientAnchor || !amount || toBigNumber(amount).lte(0)}
            onClick={handleRepurchase.handler}
          >
            <Trans>Repurchase</Trans>
          </TransactionButtonGroup>
        </Card>
      </section>

      <section>
        <CollapseCard title={t`About Repurchase`}>
          <section>
            <p>
              <Trans>
                When the user uses the CoFiX protocol, a certain transaction fee will be locked in the CoFiX DAO;
              </Trans>
            </p>
            <p>
              <Trans>
                CoFiX Repurchase means that users can exchange COFI Token and DAO contract transactions into ETH, thus
                reducing the circulation of COFI Token and enhancing its intrinsic value.
              </Trans>
            </p>
          </section>

          <section>
            <p>
              <Trans>CoFiX DAO contract address:</Trans>
            </p>
            <p>
              <a
                href={etherScanHost + '/address/' + api?.Contracts.CoFiXDAO?.address}
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                {api?.Contracts.CoFiXDAO?.address}
              </a>
            </p>
          </section>
        </CollapseCard>
      </section>
    </div>
  )
}

export default Repurchase
