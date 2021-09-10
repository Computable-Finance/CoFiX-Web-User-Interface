import './styles'

import { t, Trans } from '@lingui/macro'
import { FC, useEffect, useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import Card from 'src/components/Card'
import TokenInput from 'src/components/TokenInput'
import useStakeInfo from 'src/hooks/useStakeInfo'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import useWithdrawXToken from 'src/libs/web3/hooks/useWithdrawXToken'
import useXToken from 'src/libs/web3/hooks/useXToken'
import { toBigNumber } from 'src/libs/web3/util'
import TransactionButtonGroup from 'src/pages/shared/TransactionButtonGroup'

const WithdrawXToken: FC = () => {
  const history = useHistory()
  const params = useParams<{
    token0: string
    token1: string
  }>()

  const { api } = useWeb3()
  const [symbol, setSymbol] = useState(['', ''])
  const stakeInfo = useStakeInfo(symbol[0], symbol[1])
  const [amount, setAmount] = useState('')
  const xtoken = useXToken(symbol[0], symbol[1])
  const [insufficient, setInsufficient] = useState(false)

  useEffect(() => {
    if (!api) {
      return
    }

    setSymbol([params.token0, params.token1])
    const token0 = api.Tokens[params.token0]
    if (!token0) {
      history.push('/mining')
      return
    }
    const token1 = api.Tokens[params.token1]
    if (params.token1 && !token1) {
      history.push('/mining')
      return
    }
  }, [api, params])

  const handleWithdrawXToken = useWithdrawXToken({
    token0: symbol[0],
    token1: symbol[1],
    amount,
  })

  if (!xtoken) {
    return <></>
  }

  return (
    <Card backward onBackwardClick={() => history.push('/mining')} title={t`Claim XToken`}>
      <TokenInput
        selectable={false}
        symbol={xtoken.symbol}
        title={`${t`Input Claim Amount (XToken)`}`}
        balanceTitle={t`Staked Amount:`}
        balance={stakeInfo?.stakedXToken}
        value={amount}
        onChange={(v) => setAmount(v)}
        checkInsufficientBalance
        onInsufficientBalance={(i) => setInsufficient(i)}
      />

      <TransactionButtonGroup
        disabled={insufficient || !amount || toBigNumber(amount).lte(0)}
        onClick={handleWithdrawXToken.handler}
      >
        <Trans>Withdraw XToken</Trans>
      </TransactionButtonGroup>
    </Card>
  )
}

export default WithdrawXToken
