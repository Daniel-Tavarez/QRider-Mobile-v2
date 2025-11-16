#!/usr/bin/env python3
import re
import uuid

# Read the pbxproj file
pbxproj_path = 'ios/QRiderRD.xcodeproj/project.pbxproj'

with open(pbxproj_path, 'r') as f:
    content = f.read()

# Generate unique IDs for new files
def generate_uuid():
    return uuid.uuid4().hex[:24].upper()

tracking_service_uuid = generate_uuid()
tracking_bridge_uuid = generate_uuid()
bridging_header_uuid = generate_uuid()
googleservice_uuid = generate_uuid()

tracking_service_build_uuid = generate_uuid()
tracking_bridge_build_uuid = generate_uuid()
googleservice_resource_uuid = generate_uuid()

# Add file references in PBXFileReference section
file_refs_to_add = f"""		{tracking_service_uuid} /* TrackingService.swift */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.swift; name = TrackingService.swift; path = QRiderRD/TrackingService.swift; sourceTree = "<group>"; }};
		{tracking_bridge_uuid} /* TrackingServiceBridge.m */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.c.objc; name = TrackingServiceBridge.m; path = QRiderRD/TrackingServiceBridge.m; sourceTree = "<group>"; }};
		{bridging_header_uuid} /* QRiderRD-Bridging-Header.h */ = {{isa = PBXFileReference; lastKnownFileType = sourcecode.c.h; name = "QRiderRD-Bridging-Header.h"; path = "QRiderRD/QRiderRD-Bridging-Header.h"; sourceTree = "<group>"; }};
		{googleservice_uuid} /* GoogleService-Info.plist */ = {{isa = PBXFileReference; fileEncoding = 4; lastKnownFileType = text.plist.xml; name = "GoogleService-Info.plist"; path = "GoogleService-Info.plist"; sourceTree = "<group>"; }};"""

# Find the end of PBXFileReference section and insert before it
content = re.sub(
    r'(\/\* End PBXFileReference section \*\/)',
    file_refs_to_add + '\n' + r'\1',
    content,
    count=1
)

# Add build files in PBXBuildFile section
build_files_to_add = f"""		{tracking_service_build_uuid} /* TrackingService.swift in Sources */ = {{isa = PBXBuildFile; fileRef = {tracking_service_uuid} /* TrackingService.swift */; }};
		{tracking_bridge_build_uuid} /* TrackingServiceBridge.m in Sources */ = {{isa = PBXBuildFile; fileRef = {tracking_bridge_uuid} /* TrackingServiceBridge.m */; }};
		{googleservice_resource_uuid} /* GoogleService-Info.plist in Resources */ = {{isa = PBXBuildFile; fileRef = {googleservice_uuid} /* GoogleService-Info.plist */; }};"""

content = re.sub(
    r'(\/\* End PBXBuildFile section \*\/)',
    build_files_to_add + '\n' + r'\1',
    content,
    count=1
)

# Add files to PBXGroup (QRiderRD group)
group_files_to_add = f"""				{tracking_service_uuid} /* TrackingService.swift */,
				{tracking_bridge_uuid} /* TrackingServiceBridge.m */,
				{bridging_header_uuid} /* QRiderRD-Bridging-Header.h */,
				{googleservice_uuid} /* GoogleService-Info.plist */,"""

# Find the QRiderRD group and add files
content = re.sub(
    r'(13B07FAE1A68108700A75B9A \/\* QRiderRD \*\/ = \{[\s\S]*?children = \(\s*)',
    r'\1' + group_files_to_add + '\n',
    content,
    count=1
)

# Add files to Sources build phase
sources_to_add = f"""				{tracking_service_build_uuid} /* TrackingService.swift in Sources */,
				{tracking_bridge_build_uuid} /* TrackingServiceBridge.m in Sources */,"""

content = re.sub(
    r'(13B07F871A680F5B00A75B9A \/\* Sources \*\/ = \{[\s\S]*?files = \(\s*)',
    r'\1' + sources_to_add + '\n',
    content,
    count=1
)

# Add GoogleService-Info.plist to Resources build phase
# Find the Resources section
resources_match = re.search(r'(13B07F8E1A680F5B00A75B9A \/\* Resources \*\/ = \{[^\}]*files = \([^)]*)', content)
if resources_match:
    resources_section = resources_match.group(1)
    # Add our resource
    new_resources = resources_section + f'\n\t\t\t\t{googleservice_resource_uuid} /* GoogleService-Info.plist in Resources */,'
    content = content.replace(resources_section, new_resources)

# Add SWIFT_OBJC_BRIDGING_HEADER to build settings for both Debug and Release
bridging_header_setting = '\t\t\t\tSWIFT_OBJC_BRIDGING_HEADER = "QRiderRD/QRiderRD-Bridging-Header.h";'

# Add to Debug configuration (13B07F941A680F5B00A75B9A)
content = re.sub(
    r'(13B07F941A680F5B00A75B9A \/\* Debug \*\/ = \{[^\}]*buildSettings = \{[^\}]*SWIFT_VERSION = 5\.0;)',
    r'\1\n' + bridging_header_setting,
    content,
    count=1
)

# Add to Release configuration (13B07F951A680F5B00A75B9A)
content = re.sub(
    r'(13B07F951A680F5B00A75B9A \/\* Release \*\/ = \{[^\}]*buildSettings = \{[^\}]*SWIFT_VERSION = 5\.0;)',
    r'\1\n' + bridging_header_setting,
    content,
    count=1
)

# Update PRODUCT_BUNDLE_IDENTIFIER to com.qriderrd
content = re.sub(
    r'PRODUCT_BUNDLE_IDENTIFIER = "[^"]*";',
    'PRODUCT_BUNDLE_IDENTIFIER = com.qriderrd;',
    content
)

# Write the updated content back
with open(pbxproj_path, 'w') as f:
    f.write(content)

print("✅ Xcode project updated successfully!")
print("📝 Added files:")
print("   - TrackingService.swift")
print("   - TrackingServiceBridge.m")
print("   - QRiderRD-Bridging-Header.h")
print("   - GoogleService-Info.plist")
print("🔧 Updated Bundle Identifier to: com.qriderrd")
print("🔗 Configured Swift Bridging Header")
