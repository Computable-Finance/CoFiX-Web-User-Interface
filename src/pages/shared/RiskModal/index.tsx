import './styles';

import { t, Trans } from '@lingui/macro';
import { FC, useEffect, useRef, useState } from 'react';
import Popup from 'reactjs-popup';
import Button from 'src/components/Button';
import Card from 'src/components/Card';
import { createContainer } from 'unstated-next';

export enum RiskAction {
  Swap,
  Pool,
  Repurchase,
}
const container = createContainer(() => {
  const [show, setShow] = useState(false)
  const [action, setAction] = useState<RiskAction>(RiskAction.Swap)
  const [promise, setPromise] = useState<{
    resolve: any
    reject: any
  }>()

  const checkRisk = async (action: RiskAction) => {
    if (window.localStorage.getItem(`risk:${action}`)) {
      return
    }

    setAction(action)
    setShow(true)

    return new Promise((resolve, reject) => {
      setPromise({ resolve, reject })
    })
  }

  const approve = async (action: RiskAction) => {
    window.localStorage.setItem(`risk:${action}`, Date.now().toString())
    setShow(false)
    promise?.resolve()
  }

  useEffect(() => {
    if (promise?.reject && !show) {
      promise.reject(new Error('do not approve the risk'))
    }
  }, [show, promise])

  return {
    checkRisk,
    approve,
    action,
    show,
    setShow,
  }
})

export const RiskModalProvider = container.Provider
export const useRiskModal = container.useContainer

const RiskModal: FC = () => {
  const { action, approve, show, setShow } = useRiskModal()
  const modal = useRef<any>()

  useEffect(() => {
    if (show) {
      modal.current.open()
    } else {
      modal.current.close()
    }
  }, [show])

  const content = (() => {
    switch (action) {
      case RiskAction.Swap:
        return (
          <>
            <section>
              <p>
                <Trans>
                  The current exchange price is calculated based on the NEST oracle quotation and comprehensive risk
                  compensation, and may be slightly higher than the market price. When the oracle quotation is not
                  timely or the risk compensation is too large, it will cause losses. Please understand the CoFiX
                  trading mechanism thoroughly before trading.
                </Trans>
              </p>
            </section>
          </>
        )

      case RiskAction.Pool:
        return (
          <>
            <section>
              <p>
                <Trans>
                  CoFiX rewards Liquidity Providers with XToken, which allow you to mine COFI tokens and earn ETH
                  dividends from market fees.
                </Trans>
              </p>
            </section>

            <section>
              <p>
                <Trans>
                  Market making has the risk of losing money in case of big directional changes in the underlying price
                  of your assets, and changes in the liquidity pool ratio or balance. Please understand how it affects
                  your assets before you add liquidity and hedge appropriately.
                </Trans>
              </p>
            </section>
          </>
        )

      case RiskAction.Repurchase:
        return (
          <>
            <section>
              <p>
                <Trans>
                  Regarding the CoFiX repurchase, you need to know the following rules and risks. Please read carefully
                  before participating in the CoFiX repurchase
                </Trans>
              </p>
            </section>
            <section>
              <p>
                <Trans>
                  1. The price of COFI comes from the NEST oracle machine, which will generate oracle call fees. In
                  addition, due to the characteristics of the blockchain itself. The actual settlement price may be
                  different from the price displayed on this page, because when the repurchase code is executed, it uses
                  the effective price of the oracle at the time of the repurchase;
                </Trans>
              </p>
            </section>

            <section>
              <p>
                <Trans>
                  2. CoFiX DAO repurchase quota is released according to blocks, each block releases 50 COFI, and the
                  amount of repurchase has an upper limit. If the current upper limit has been reached, you may have to
                  wait a few blocks before continuing to participate;
                </Trans>
              </p>
            </section>

            <section>
              <p>
                <Trans>
                  3. In order to ensure the security of the system, when the COFI price fluctuates sharply, the
                  repurchase may fail, and the failure will result in the loss of the mining fee and the oracle call
                  fee;
                </Trans>
              </p>
            </section>

            <section>
              <p>
                <Trans>
                  4. As market prices fluctuate, participating in the repurchase may not always be beneficial; smart
                  contracts have been tested, but there are inherent risks in the contract code, so please use it at
                  your own risk.
                </Trans>
              </p>
            </section>
          </>
        )

      default:
        return <></>
    }
  })()

  const classPrefix = 'cofi-risk-modal'
  return (
    <Popup modal open={show} onClose={() => setShow(false)} ref={modal}>
      <Card title={t`Risk Warning`} className={`${classPrefix}-card`}>
        {content}

        <Button block primary onClick={() => approve(action)}>
          <Trans>Ok, I understand the risk</Trans>
        </Button>

        <Button block>
          <a href="https://github.com/Computable-Finance/Doc#4-market-maker-mechanism" target="_blank" rel="noreferrer">
            <Trans>Read More</Trans>
          </a>
        </Button>
      </Card>
    </Popup>
  )
}

export default RiskModal
