import './styles'

import { FC } from 'react'
import { useState } from 'react'
import Popup from 'reactjs-popup'
import Button from 'src/components/Button'
import { Loading } from 'src/components/Icon'
import useTransaction, { TransactionReceiptStatus, TransactionStatus } from 'src/libs/web3/hooks/useTransaction'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'

import Modal from './Modal'

const WalletConnectStatus: FC = () => {
  const { account } = useWeb3()
  if (!account) {
    return <></>
  }

  const [open, setOpen] = useState(false)
  const { transactions, check } = useTransaction()

  const pendingTransactions = (transactions || []).filter(
    (t) => t?.receiptStatus === TransactionReceiptStatus.Unknown && t?.status === TransactionStatus.Success
  )
  pendingTransactions.map((tx) => check(tx))

  const classPrefix = 'cofi-wallet-connect'
  return (
    <Popup
      open={open}
      modal
      closeOnDocumentClick
      trigger={
        <span>
          <Button className={`${classPrefix}-button`} onClick={() => setOpen(true)}>
            {!!pendingTransactions.length && (
              <span className={`${classPrefix}-pending`}>
                <Loading className="animation-spin" height={30} width={30} />
                <span>{pendingTransactions.length}</span>
              </span>
            )}
            {account.slice(0, 6)}...{account.slice(38, 42)}
          </Button>
        </span>
      }
    >
      <Modal onClose={() => setOpen(false)} />
    </Popup>
  )
}

export default WalletConnectStatus
