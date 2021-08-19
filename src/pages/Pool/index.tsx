import './styles'

import { FC, useEffect } from 'react'
import { Switch, Route, Redirect } from 'react-router-dom'
import CollapseCard from 'src/components/CollapaseCard'
import { Trans, t } from '@lingui/macro'
import Card from 'src/components/Card'

import loadable from '@loadable/component'
import { RiskAction, useRiskModal } from '../shared/RiskModal'

const Index = loadable(() => import('./pages/Index'))
const AddLiquidity = loadable(() => import('./pages/AddLiquidity'))
const RemoveLiquidity = loadable(() => import('./pages/RemoveLiquidity'))

const Pool: FC = () => {
  const { checkRisk } = useRiskModal()
  useEffect(() => {
    ;(async () => {
      try {
        await checkRisk(RiskAction.Pool)
      } catch (_) {
        // comment for eslint
      }
    })()
  }, [])

  const classPrefix = 'cofi-page-pool'

  return (
    <div className={`cofi-page ${classPrefix}`}>
      <section className={`${classPrefix}-notice`}>
        <Card>
          <section>
            <p>
              <Trans>
                CoFiX 2.1 brand new upgrade fund pool contract, CoFiX 2.0 pool needs to be manually migrated to CoFiX
                2.1 version, V2.0 version of the pool certificate XToken is abandoned, staking will not generate COFI
                rewards, please Take out the staking XToken from V2.0 as soon as possible, and withdraw Token from the
                pool, re-add liquidity in CoFiX 2.1, generate new XToken for mining.
              </Trans>

              <a href="https://v2.cofix.tech" className="link" target="_blank" rel="noreferrer">
                <Trans>Jump to v2.0</Trans>
              </a>
            </p>
          </section>
        </Card>
      </section>

      <Switch>
        <Route path="/pool" exact>
          <Index />
        </Route>

        <Route path="/pool/add-liquidity/:token0/:token1?" exact>
          <AddLiquidity />
        </Route>

        <Route path="/pool/remove-liquidity/:token0/:token1?" exact>
          <RemoveLiquidity />
        </Route>

        <Redirect to="/pool" />
      </Switch>

      <section>
        <CollapseCard title={t`risk warning`}>
          <section>
            <p>
              <Trans>
                Add assets (ETH, USDT, etc.) to the asset pool, you will receive XToken, deposit XToken in the mining
                pool, and you can start mining, get COFI rewards. Although COFI 2.0 introduces the mining mechanism of
                reversing trade to help liquidity providers hedge and reduce risks, However, when the market fluctuates
                or there are no user to do reversing trade for a long time, the ratio of holding assets will be
                unbalanced, which may cause losses, please understand the market-making rules and the risks involved
                thoroughly before providing liquidity.
              </Trans>
            </p>
          </section>

          <section>
            <p>
              <a
                href="https://github.com/Computable-Finance/Doc#4-market-maker-mechanism"
                target="_blank"
                rel="noreferrer"
                className="link"
              >
                <Trans>Read More</Trans>
              </a>
            </p>
          </section>
        </CollapseCard>
      </section>
    </div>
  )
}

export default Pool
