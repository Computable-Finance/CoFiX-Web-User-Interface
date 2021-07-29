import './styles'

import { Trans } from '@lingui/macro'
import { FC } from 'react'
import Popup from 'reactjs-popup'
import Button from 'src/components/Button'
import Card from 'src/components/Card'
import { FailOutline, Loading, SuccessOutline } from 'src/components/Icon'
import useEtherScanHost from 'src/hooks/useEtherScanHost'
import useTransaction, { TransactionStatus } from 'src/libs/web3/hooks/useTransaction'

const TransactionModal: FC = () => {
  const { showModal, closeModal, current } = useTransaction()
  const etherScanHost = useEtherScanHost()

  if (!current) {
    return <></>
  }

  const classPrefix = 'cofi-transaction-modal'
  const pending = (
    <>
      <Loading className="animation-spin" />
      <h1>
        <Trans>Waiting For Confirmation</Trans>
      </h1>

      <p>
        <Trans>Confirm the transaction in your Wallet</Trans>
      </p>
    </>
  )

  const success = (
    <>
      <SuccessOutline />
      <h1>
        <Trans>Transaction Submitted</Trans>
      </h1>

      <p>
        <a
          href={etherScanHost + '/tx/' + current.hash}
          target="_blank"
          rel="noreferrer"
          className={`${classPrefix}-link`}
        >
          <Trans>View in Etherscan</Trans>
        </a>
      </p>

      <Button block primary gradient onClick={closeModal}>
        <Trans>Close</Trans>
      </Button>
    </>
  )

  const fail = (
    <>
      <FailOutline />
      <h1>
        <Trans>Transaction Rejected</Trans>
      </h1>

      <p>{current.msg?.error?.data?.reason || <Trans>You failed confirming the transaction</Trans>}</p>

      <Button block primary gradient onClick={closeModal}>
        <Trans>Close</Trans>
      </Button>
    </>
  )

  const content = (() => {
    switch (current.status) {
      case TransactionStatus.Pending:
        return pending
      case TransactionStatus.Success:
        return success
      case TransactionStatus.Fail:
        return fail
      default:
        return <></>
    }
  })()

  return (
    <Popup open={current && showModal} className={`${classPrefix}`}>
      <Card closable onClose={closeModal}>
        <div className={`${classPrefix}-content`}>{content}</div>
      </Card>
    </Popup>
  )
}

export default TransactionModal
