import { INestPriceFacade__factory as NestPriceFacade__factory, INestPriceFacade as TypeNestPriceFacade } from 'src/abis/types/cofix'
import API from '.'
import Contract, { ContractProps } from './Contract'

export type NestPriceFacadeProps = ContractProps

class NestPriceFacade extends Contract {
  contract?: TypeNestPriceFacade

  constructor(api: API, props: NestPriceFacadeProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = NestPriceFacade__factory.connect(
        this.address,
        this.api.provider?.getSigner() || this.api.provider
      )
    }
  }
}

export default NestPriceFacade
