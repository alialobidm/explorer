module Eos
  class TokenController < Eos::AddressController
    before_action :is_native, :query_date

    QUERY = <<-GRAPHQL.freeze
  query{
    eos{
      blocks(options:{desc: "date.date", limit: 1}){
        date {date}
      }
    }
  }
    GRAPHQL

    def smart_contract
      render 'eos/smart_contract/show'
    end

    def methods
      render 'eos/smart_contract/methods'
    end

    def events
      render 'eos/smart_contract/events'
    end

    def transactions
      render 'eos/smart_contract/transactions'
    end

    def inflow
      render 'eos/address/inflow'
    end

    def outflow
      render 'eos/address/outflow'
    end

    def calls_contracts
      render 'eos/address/calls_contracts'
    end

    private

    def is_native
      @token = params[:address]
      @native_token = native_token?
    end

    def native_token?
      @address == @network[:currency]
    end

    def redirect_by_type
      return if native_token?

      if !(sc = @info.try(:smartContract))
        change_controller! 'eos/address'
      elsif !sc.try(:currency)
        change_controller! 'eos/smart_contract'
      end
    end

    def query_date
      @block_date = Graphql::V1.query_with_retry(QUERY, variables: {},
                                                        context: { authorization: @streaming_access_token }).data.eos.blocks[0].date.date
    end
  end
end
