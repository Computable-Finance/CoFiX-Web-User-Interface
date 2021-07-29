import { CoFiXVaultForStaking__factory, CoFiXVaultForStaking as TypeCoFiXVaultForStaking } from 'src/abis/types/cofix'
import API from '.'
import Contract, { ContractProps } from './Contract'
import { toBigNumber } from '../util'

export type CoFiXVaultForStakingProps = ContractProps

class CoFiXVaultForStaking extends Contract {
  contract?: TypeCoFiXVaultForStaking

  constructor(api: API, props: CoFiXVaultForStakingProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = CoFiXVaultForStaking__factory.connect(
        this.address,
        this.api.provider?.getSigner() || this.api.provider
      )
    }
  }

  async balanceOf(pair: string, account: string) {
    if (!this.contract) {
      return toBigNumber(0)
    }

    const value = await this.contract.balanceOf(pair, account)
    return toBigNumber(value)
  }

  async earned(pair: string, account: string) {
    if (!this.contract) {
      return toBigNumber(0)
    }

    const value = await this.contract.earned(pair, account)
    return toBigNumber(value)
  }
}

export default CoFiXVaultForStaking
