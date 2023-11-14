class Cardano::BlockController < NetworkController
  layout 'tabs'

  before_action :query_date

  QUERY = Graphql::V1::Client.parse <<-'GRAPHQL'
           query ($height: Int! $network: CardanoNetwork!){
              cardano(network: $network ) { blocks( height: {is: $height}) { date {date} } }
           }
  GRAPHQL

  private

  def query_date
    @block_date = Graphql::V1.instance.query_with_retry(QUERY, variables: { height: @height.to_i,
                                                                            network: @network[:network] }, context: { 'Authorization': @streaming_access_token }).data.cardano.blocks[0].date.date
  end
end
