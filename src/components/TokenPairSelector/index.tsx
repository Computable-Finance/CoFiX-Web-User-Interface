import { FC, useState, useEffect } from 'react'
import './styles'
import { ArrowLeftOutline, ArrowRightOutline } from 'src/components/Icon'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { useMemo } from 'react'
import useToken from 'src/hooks/useToken'

type TokenPair = [string, string]
type Props = {
  value?: TokenPair
  onChange?: (pair: TokenPair) => void
}

const TokenPairSelector: FC<Props> = (props) => {
  const { api } = useWeb3()
  const pairs = useMemo(() => {
    if (!api) {
      return []
    }

    const arr: Array<TokenPair> = []
    Object.values(api.CoFiXPairs).map((map) =>
      Object.values(map).map((p) => {
        arr.push([p.pair[0].symbol, p.pair[1].symbol])
      })
    )

    return arr
  }, [api])

  const [pair, setPair] = useState<TokenPair>(props.value || pairs[0])
  const token0 = useToken(pair[0])
  const token1 = useToken(pair[1])

  function prev() {
    let index = pairs.findIndex((p) => p[0] === pair[0] && p[1] === pair[1])
    if (index === -1) {
      index = 0
    } else if (index === 0) {
      index = pairs.length - 1
    } else {
      index = index - 1
    }

    setPair(pairs[index])
  }

  function next() {
    let index = pairs.findIndex((p) => p[0] === pair[0] && p[1] === pair[1])
    if (index === -1) {
      index = 0
    } else if (index === pair.length - 1) {
      index = 0
    } else {
      index = index + 1
    }

    setPair(pairs[index])
  }

  useEffect(() => {
    if (typeof props.value === 'undefined') {
      return
    }
    setPair(props.value)
  }, [props.value])

  useEffect(() => {
    if (!props.onChange) {
      return
    }

    props.onChange(pair)
  }, [pair])

  const classPrefix = 'cofi-token-pair-selector'
  if (pairs.length === 0 || !token0 || !token1) {
    return <></>
  }

  return (
    <div className={`${classPrefix}`}>
      <ArrowLeftOutline onClick={prev} />
      <div className={`${classPrefix}-pair`}>
        <div className={`${classPrefix}-icon`}>
          <token0.Icon />
          <token1.Icon />
        </div>
        <div className={`${classPrefix}-symbol`}>{`${token0.symbol} - ${token1.symbol}`}</div>
      </div>
      <ArrowRightOutline onClick={next} />
    </div>
  )
}

export default TokenPairSelector
