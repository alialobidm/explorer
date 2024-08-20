module Cardano
  class SitemapController < NetworkController
    QUERY = <<-GRAPHQL.freeze
           query ($network: CardanoNetwork! $from: ISO8601DateTime){#{'            '}
              receivers: cardano(network: $network ) {#{'                 '}
                      outputs(options:{desc: "value", limit: 100 },
                      date: { since: $from }
                    ) {
                      value
                      currency {
                        symbol
                      }
                      address: outputAddress{
                        address
                      }
                    }
              }
              senders: cardano(network: $network ) {#{'                 '}
                      inputs(options:{desc: "value", limit: 100 },
                      date: { since: $from }
                    ) {
                      value
                      currency {
                        symbol
                      }
                      address: inputAddress{
                        address
                      }
                    }
              }
           }
    GRAPHQL

    def index
      @response = Graphql::V1.query_with_retry(QUERY, variables: { from: Time.zone.today - 14,
                                                                   network: @network[:network] }, context: { authorization: @streaming_access_token }).data
    end
  end
end
