// swift-tools-version: 5.9
// Squad Party iOS App — SwiftUI + Swift Package Manager

import PackageDescription

let package = Package(
    name: "SquadParty",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "SquadParty",
            targets: ["SquadParty"]
        ),
    ],
    dependencies: [
        // Auth + networking will be added in Phase 5 Item 1
    ],
    targets: [
        .target(
            name: "SquadParty",
            dependencies: [],
            path: "Sources"
        ),
    ]
)
