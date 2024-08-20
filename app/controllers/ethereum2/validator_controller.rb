module Ethereum2
  class ValidatorController < NetworkController
    layout 'tabs'

    before_action :get_index, :breadcrumb

    private

    def get_index
      @index = params[:index]
    end

    def breadcrumb
      @breadcrumbs << { name: t("tabs.#{controller_name}.#{action_name}.name") }
    end
  end
end
