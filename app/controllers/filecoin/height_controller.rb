module Filecoin
  class HeightController < NetworkController
    layout 'tabs'
    before_action :blocks

    def blocks
      @is_block_section = true
    end
  end
end
