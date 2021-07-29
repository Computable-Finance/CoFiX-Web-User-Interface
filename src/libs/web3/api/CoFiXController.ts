import { CoFiXController__factory, CoFiXController as TypeCoFiXController } from 'src/abis/types/cofix'
import API from '.'
import Contract, { ContractProps } from './Contract'

export type CoFiXControllerProps = ContractProps

class CoFiXController extends Contract {
  contract?: TypeCoFiXController

  constructor(api: API, props: CoFiXControllerProps) {
    super(api, props)

    if (this.address && this.api.provider) {
      this.contract = CoFiXController__factory.connect(
        this.address,
        this.api.provider?.getSigner() || this.api.provider
      )
    }
  }
}

export default CoFiXController
