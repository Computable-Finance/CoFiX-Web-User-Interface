import './styles'

import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { toast } from 'react-toastify'
import { FailOutline, SuccessOutline } from 'src/components/Icon'
import useEtherScanHost from 'src/hooks/useEtherScanHost'
import {
  getTransactionContent,
  getTransactionTitle,
  Transaction,
  TransactionReceiptStatus,
} from 'src/libs/web3/hooks/useTransaction'

type Props = {
  transaction: Transaction
}

const TransactionNotification: FC<Props> = ({ transaction }) => {
  const etherScanHost = useEtherScanHost()
  const icon = (() => {
    switch (transaction.receiptStatus) {
      case TransactionReceiptStatus.Successful:
        return <SuccessOutline width={28} height={28} />
      case TransactionReceiptStatus.Reverted:
        return <FailOutline width={28} height={28} />
      default:
        return <></>
    }
  })()

  const title = getTransactionTitle(transaction)
  const content = getTransactionContent(transaction)

  const classPrefix = 'cofi-transaction-notification'

  return (
    <div className={`${classPrefix}`}>
      <div className={`${classPrefix}-container`}>
        {icon}
        <div className={`${classPrefix}-desc`}>
          <div className={`${classPrefix}-title`}>{title}</div>
          <div className={`${classPrefix}-content`}>{content}</div>
        </div>
      </div>

      <a
        className={`${classPrefix}-link`}
        href={etherScanHost + '/tx/' + transaction.hash}
        target="_blank"
        rel="noreferrer"
      >
        <Trans>View in Browser</Trans>
      </a>
    </div>
  )
}

export default TransactionNotification

export const notifyTransaction = (transaction: Transaction) => {
  toast(<TransactionNotification transaction={transaction} />, {
    closeOnClick: false,
    hideProgressBar: true,
  })
}
