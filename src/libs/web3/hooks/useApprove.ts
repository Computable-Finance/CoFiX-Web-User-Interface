import { useCallback, useEffect, useMemo, useState } from 'react'
import useTransaction, { TransactionApproveContent, TransactionReceiptStatus, TransactionType } from './useTransaction'
import useWeb3 from './useWeb3'

const useApprove = (content?: TransactionApproveContent) => {
  const { api } = useWeb3()
  const { push, getTransactionById } = useTransaction()
  const [transactionId, setTransactionId] = useState('')
  const transaction = getTransactionById(transactionId)

  const args = useMemo(() => {
    if (!api || !content) return

    switch (content.transactionType) {
      case TransactionType.AddLiquidity:
        return {
          token: api.Tokens[content.token[1]],
          spender: api.Contracts.CoFiXRouter.address,
        }
      case TransactionType.RemoveLiquidity:
        if (!content.token[0]) {
          return
        }
        return {
          token: content.token[1]
            ? api.CoFiXPairs[content.token[0]][content.token[1]]
            : api.CoFixAnchorPools[content.token[0]].xtokens[content.token[0]],
          spender: api.Contracts.CoFiXRouter.address,
        }
      case TransactionType.StakeXToken:
        if (!content.token[0]) {
          return
        }
        return {
          token: content.token[1]
            ? api.CoFiXPairs[content.token[0]][content.token[1]]
            : api.CoFixAnchorPools[content.token[0]].xtokens[content.token[0]],
          spender: api.Contracts.CoFiXVaultForStaking.address,
        }
      case TransactionType.Swap:
        return {
          token: api.Tokens[content.token[0]],
          spender: api.Contracts.CoFiXRouter.address,
        }
      case TransactionType.Repurchase:
        return {
          token: api.Tokens[content.token[0]],
          spender: api.Contracts.CoFiXDAO.address,
        }
    }
  }, [api, content?.token?.[0], content?.token?.[1], content?.transactionType])

  // use true as default for a better expierence
  const [allowance, setAllowance] = useState(true)

  const check = useCallback(async () => {
    if (!api || !args || !args.token || !args.spender) {
      return false
    }

    const value = await args.token.allowance(args.spender)
    setAllowance(value)
    return value
  }, [args?.token, args?.spender])

  const handler = useCallback(async () => {
    if (!api || !args || !args.token || !args.spender || !content) {
      return
    }

    const transaction = await push(
      {
        type: TransactionType.Approve,
        content,
      },
      () => args.token.approve(args.spender as string)
    )

    if (transaction?.id) {
      setTransactionId(transaction.id)
    }

    return transaction
  }, [args])

  check()

  useEffect(() => {
    if (transaction?.receiptStatus === TransactionReceiptStatus.Successful) {
      check()
    }

    check()
  }, [transaction?.receiptStatus])

  return {
    handler,
    allowance,
    check,
  }
}

export default useApprove
