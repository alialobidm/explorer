module Conflux
  class SmartContractController < Conflux::AddressController
    def inflow
      render 'conflux/address/inflow'
    end

    def outflow
      render 'conflux/address/outflow'
    end

    def calls_contracts
      render 'conflux/address/calls_contracts'
    end

    def money_flow
      render 'conflux/address/money_flow'
    end

    private

    def redirect_by_type
      if !(sc = @info.try(:smartContract))
        change_controller! 'conflux/address'
      elsif sc.try(:currency)
        change_controller! 'conflux/token'
      end
    end
  end
end
