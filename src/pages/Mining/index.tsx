import './styles'

import { t, Trans } from '@lingui/macro'
import loadable from '@loadable/component'
import { FC } from 'react'
import { Redirect, Route, Switch } from 'react-router-dom'
import Card from 'src/components/Card'
import CollapseCard from 'src/components/CollapaseCard'

const Index = loadable(() => import('./pages/Index'))
const StakeXToken = loadable(() => import('./pages/StakeXToken'))
const WithdrawXToken = loadable(() => import('./pages/WithdrawXToken'))

const Mining: FC = () => {
  const classPrefix = 'cofi-page-mining'

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
        <Route path="/mining" exact>
          <Index />
        </Route>

        <Route path="/mining/stake-xtoken/:token0/:token1?" exact>
          <StakeXToken />
        </Route>

        <Route path="/mining/withdraw-xtoken/:token0/:token1?" exact>
          <WithdrawXToken />
        </Route>

        <Redirect to="/mining" />
      </Switch>

      <section>
        <CollapseCard title={t`Helpful Tips`}>
          <section>
            <p>
              <Trans>The amount of XToken you deposited to the mining Pool impacts the number of COFI mined.</Trans>
            </p>
            <p>
              <Trans>You can claim new mined COFI Tokens any time.</Trans>
            </p>
          </section>

          <section>
            <p>
              <a
                href="https://github.com/Computable-Finance/Doc#7-token-mining-incentive-system"
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

export default Mining
