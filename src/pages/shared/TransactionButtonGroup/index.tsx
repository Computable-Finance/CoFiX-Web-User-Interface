import './styles'

import { Trans } from '@lingui/macro'
import { FC, useState } from 'react'
import Button from 'src/components/Button'
import ButtonGroup from 'src/components/Button/Group'
import { Loading } from 'src/components/Icon'
import useApprove from 'src/libs/web3/hooks/useApprove'
import useTransaction, {
  Transaction,
  TransactionApproveContent,
  TransactionReceiptStatus,
} from 'src/libs/web3/hooks/useTransaction'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

import WalletConnectButton from '../WalletConnect/Button'

type Props = {
  approve?: TransactionApproveContent
  disabled?: boolean
  onClick?: () => Promise<Transaction | undefined | void> | void | undefined
}
const TransactionButtonGroup: FC<Props> = (props) => {
  const { account } = useWeb3()
  const { getTransactionById } = useTransaction()
  const approve = useApprove(props.approve)
  const [transactionId, setTransactionId] = useState('')
  const transaction = getTransactionById(transactionId)

  const [approveTransactionId, setApproveTransactionId] = useState('')
  const approveTransaction = getTransactionById(approveTransactionId)

  const handleApprove = async () => {
    const t = await approve.handler()
    if (t?.id) {
      setApproveTransactionId(t.id)
    }
  }

  const handleClick = async () => {
    if (props.onClick) {
      const t = await props.onClick()
      if (t?.id) {
        setTransactionId(t.id)
      }
    }
  }

  const transactionChecking = transaction?.receiptStatus === TransactionReceiptStatus.Unknown
  const approveTransactionChecking = approveTransaction?.receiptStatus === TransactionReceiptStatus.Unknown

  const classPrefix = 'cofi-transaction-button-group'
  return (
    <ButtonGroup block responsive className={`${classPrefix}`}>
      {!account && <WalletConnectButton block gradient primary />}

      {account && !approve.allowance && (
        <Button block gradient primary onClick={handleApprove} disabled={approveTransactionChecking}>
          {approveTransactionChecking && <Loading className="animation-spin" height={22} />}

          <Trans>Approve</Trans>
        </Button>
      )}

      <Button
        block
        gradient
        primary={!!account && approve.allowance && !transactionChecking}
        onClick={handleClick}
        disabled={props.disabled || !approve.allowance || transactionChecking}
      >
        {transactionChecking && <Loading className="animation-spin" height={22} />}

        {props.children}
      </Button>
    </ButtonGroup>
  )
}

export default TransactionButtonGroup
