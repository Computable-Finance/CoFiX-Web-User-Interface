import { ContractTransaction } from '@ethersproject/contracts'
import { t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { notifyTransaction } from 'src/pages/shared/TransactionNotification'
import { createContainer } from 'unstated-next'

import useWeb3 from './useWeb3'

export enum TransactionType {
  Swap,
  AddLiquidity,
  RemoveLiquidity,
  StakeXToken,
  WithdrawXToken,
  ClaimCOFI,
  Repurchase,
  Approve,
}

export enum TransactionStatus {
  Pending,
  Success,
  Fail,
}

export type TansactionSwapContent = {
  src: {
    amount: string
    symbol: string
  }
  dest: {
    amount: string
    symbol: string
  }
}

export type TransactionRepurchaseContent = {
  amount: string
  symbol: string
}

export type TransasctionClaimCOFIContent = {
  token0: string
  token1?: string
  amount?: string
}

export type TransactionAddLiquidityContent = {
  token0: { amount: string; symbol: string }
  token1?: { amount: string; symbol: string }

  liquidity?: string
  autoStake?: boolean
}

export type TransactionRemoveLiquidityContent = {
  token0: string
  token1?: string
  liquidity: string

  receive?: Array<{ symbol: string; amount: string }>
}

export type TransactionStakeXTokenContent = {
  token0: string
  token1?: string
  amount: string
}

export type TransactionWithdrawXTokenContent = {
  token0: string
  token1?: string
  amount: string
}

export type TransactionApproveContent = {
  transactionType: TransactionType
  token: [string, string]
}

export enum TransactionReceiptStatus {
  Unknown,
  Reverted,
  Successful,
}

export type Transaction = {
  id?: string
  timestamp?: number
  status?: TransactionStatus
  hash?: string
  msg?: any
  tx?: string

  receiptStatus?: TransactionReceiptStatus
} & (
  | {
      type: TransactionType.Swap
      content: TansactionSwapContent
    }
  | {
      type: TransactionType.Repurchase
      content: TransactionRepurchaseContent
    }
  | {
      type: TransactionType.ClaimCOFI
      content: TransasctionClaimCOFIContent
    }
  | {
      type: TransactionType.AddLiquidity
      content: TransactionAddLiquidityContent
    }
  | {
      type: TransactionType.RemoveLiquidity
      content: TransactionRemoveLiquidityContent
    }
  | {
      type: TransactionType.Approve
      content: TransactionApproveContent
    }
  | {
      type: TransactionType.StakeXToken
      content: TransactionStakeXTokenContent
    }
  | {
      type: TransactionType.WithdrawXToken
      content: TransactionWithdrawXTokenContent
    }
)

const _useTransaction = () => {
  const { api } = useWeb3()
  const [transactions, setTransactions] = useState<Array<Transaction>>([])
  const [current, setCurrent] = useState<Transaction>()
  const [showModal, setShowModal] = useState(false)

  const upsertTranasction = (transaction: Transaction) => {
    const index = transactions.findIndex((t) => t.id === transaction.id)
    if (index > -1) {
      transactions[index] = transaction
      setTransactions({ ...transactions })
    } else {
      setTransactions(transactions.concat(transaction))
    }
  }

  const updateCurrent = (transaction: Transaction) => {
    if (!current) {
      setCurrent({ ...transaction })
      return
    }

    if (current.timestamp && transaction.timestamp) {
      if (current.timestamp > transaction.timestamp) {
        return
      }
    }

    setCurrent({ ...transaction })
    upsertTranasction(transaction)
  }

  const push = async (transaction: Transaction, t: () => Promise<ContractTransaction | undefined>) => {
    try {
      transaction.id = `${Date.now()}`
      transaction.timestamp = Date.now()
      transaction.status = TransactionStatus.Pending
      transaction.receiptStatus = TransactionReceiptStatus.Unknown

      upsertTranasction(transaction)
      updateCurrent(transaction)
      setShowModal(true)

      const result = await t()
      if (!result) {
        return
      }

      transaction.hash = result.hash
      transaction.status = TransactionStatus.Success
      // transaction.tx = utils.serializeTransaction(result)
      updateCurrent(transaction)

      setTimeout(() => {
        closeModal()
      }, 2000)

      const check = async () => {
        if (transaction.status !== TransactionStatus.Success) {
          return
        }

        const recipet = await api?.provider?.getTransactionReceipt(result.hash)
        if (typeof recipet?.status !== 'undefined') {
          const status = recipet.status
            ? (transaction.receiptStatus = TransactionReceiptStatus.Successful)
            : (transaction.receiptStatus = TransactionReceiptStatus.Reverted)
          transaction.receiptStatus = status
          updateCurrent(transaction)
          notifyTransaction(transaction)
        } else {
          setTimeout(check, 3000)
        }
      }

      check()
    } catch (e) {
      console.error(e)
      transaction.msg = e
      transaction.status = TransactionStatus.Fail
      transaction.receiptStatus = TransactionReceiptStatus.Reverted
      updateCurrent(transaction)
    }

    return transaction
  }

  useEffect(() => {
    if (!api) {
      return
    }

    ;(async () => {
      const cache = localStorage.getItem(`transactions:${api.chainId}`)
      if (cache) {
        setTransactions(JSON.parse(cache as string) as any)
      }
    })()
  }, [api])

  useEffect(() => {
    if (!api) {
      return
    }

    ;(async () => {
      localStorage.setItem(`transactions:${api.chainId}`, JSON.stringify(transactions))
    })()
  }, [api, transactions])

  useEffect(() => {
    if (!current) {
      return
    }

    const index = transactions.findIndex((t) => t.id === current.id)
    if (index > -1) {
      transactions[index] = current as any
      setTransactions([...transactions])
    }
  }, [current])

  const closeModal = () => {
    setShowModal(false)
  }

  const getTransactionById = (id: string) => {
    return transactions.find((t) => t.id === id)
  }

  return { transactions, push, current, showModal, closeModal, getTransactionById }
}

const transaction = createContainer(_useTransaction)

const useTransaction = () => {
  return transaction.useContainer()
}

export default useTransaction

export const Provider = transaction.Provider

export const getTransactionTitle = (transaction: Transaction) => {
  switch (transaction.type) {
    case TransactionType.Swap:
      return t`Swap`
    case TransactionType.AddLiquidity:
      return t`Add Liquidity`
    case TransactionType.RemoveLiquidity:
      return t`Remove Liquidity`
    case TransactionType.StakeXToken:
      return t`Stake XToken`
    case TransactionType.WithdrawXToken:
      return t`Withdraw XToken`
    case TransactionType.ClaimCOFI:
      return t`Claim COFI`
    case TransactionType.Repurchase:
      return t`Repurchase`
    case TransactionType.Approve:
      return t`Approve`
    default:
      return t`Unsupported Type`
  }
}

export const getTransactionContent = (transaction: Transaction) => {
  switch (transaction.type) {
    case TransactionType.Swap:
      return `${transaction.content.src.amount} ${transaction.content.src.symbol} → ${transaction.content.dest.amount} ${transaction.content.dest.symbol}`
    case TransactionType.AddLiquidity:
      return (
        `${transaction.content.token0.amount} ${transaction.content.token0.symbol}` +
        (transaction.content.token1
          ? ` + ${transaction.content.token1.amount} ${transaction.content.token1.symbol}`
          : '')
      )
    case TransactionType.StakeXToken:
      return `${transaction.content.amount} XToken`
    case TransactionType.WithdrawXToken:
      return `${transaction.content.amount} XToken`
    case TransactionType.RemoveLiquidity:
      return `${transaction.content.liquidity} XToken`
    case TransactionType.ClaimCOFI:
      return `${transaction.content.amount} COFI`
    case TransactionType.Repurchase:
      return `${transaction.content.amount} COFI`
    case TransactionType.Approve:
      switch (transaction.content.transactionType) {
        case TransactionType.AddLiquidity:
          return `${t`Add Liquidity`} ${transaction.content.token.filter(Boolean).join(' + ')}`
        case TransactionType.RemoveLiquidity:
          return `${t`Remove Liquidity`} ${transaction.content.token.filter(Boolean).join(' + ')}`
        default:
          return ''
      }
    default:
      return t`Unsupported Content`
  }
}
