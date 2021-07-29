import { useEffect, useState } from 'react'
import useWeb3 from 'src/libs/web3/hooks/useWeb3'
import { DAOInfo } from 'src/libs/web3/api/CoFixDAO'
import useInterval from '@use-it/interval'

const useDAOInfo = () => {
  const { api } = useWeb3()
  const [info, setInfo] = useState<DAOInfo>()

  const refresh = async () => {
    if (!api) {
      setInfo(undefined)
      return
    }

    const i = await api.Contracts.CoFiXDAO.getDAOInfo()
    if (JSON.stringify(i) !== JSON.stringify(info)) {
      setInfo(i)
    }
  }
  useEffect(() => {
    refresh()
  }, [api])
  useInterval(refresh, 1000)

  return info
}

export default useDAOInfo
