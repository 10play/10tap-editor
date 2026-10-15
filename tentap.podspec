require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "tentap"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => (defined?(min_ios_version_supported) ? min_ios_version_supported : "15.1") }
  s.source       = { :git => "https://github.com/10play/10Tap-Editor.git", :tag => "v#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm}"
  s.frameworks   = "WebKit"

  # Available since React Native 0.71; the native floor is 0.74.
  install_modules_dependencies(s)
end
