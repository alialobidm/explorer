module NetworkHelper
  def network_icon_path(network)
    network[:icon].starts_with?("currency") ? asset_path(network[:icon]) : image_pack_path("static/node_modules/cryptocurrency-icons/svg/icon/#{network[:icon]}")
  end

  def network_icon(network, options = {})
    image_tag network_icon_path(network), {style: "width: 32px; height: auto", alt: network[:name]}.merge(options)
  end
end
