import Foundation
import CallKit

/// ScamVigil Call Directory Extension Handler
/// This extension provides blocking and identification data to iOS for incoming cellular calls.
/// iOS will automatically block or label calls based on the data we provide here.
class CallDirectoryHandler: CXCallDirectoryProvider {
    
    /// Called by iOS when the system needs to reload the call directory data
    /// This happens when:
    /// - Extension is first enabled in Settings
    /// - App calls reloadExtension()
    /// - iOS decides to refresh (periodic)
    override func beginRequest(with context: CXCallDirectoryExtensionContext) async throws {
        
        // STEP 1: Load scam numbers from shared container
        let scamNumbers = try await loadScamNumbersFromSharedContainer()
        
        // STEP 2: Add blocking entries (these numbers will be automatically blocked)
        try await addBlockingEntries(to: context, numbers: scamNumbers.filter { $0.shouldBlock })
        
        // STEP 3: Add identification entries (these numbers will show labels)
        try await addIdentificationEntries(to: context, numbers: scamNumbers)
        
        // Done! iOS now has our data and will use it for all incoming calls
        print("✅ Call Directory loaded: \(scamNumbers.count) scam numbers")
    }
    
    // MARK: - Load Data
    
    /// Load scam numbers from shared App Group container
    /// The main app writes data here, and this extension reads it
    private func loadScamNumbersFromSharedContainer() async throws -> [ScamNumber] {
        // Shared container between main app and extension
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: "group.dev.a0.apps.scamvigil"
        ) else {
            throw CallDirectoryError.containerNotFound
        }
        
        let fileURL = containerURL.appendingPathComponent("scam-numbers.json")
        
        // Check if file exists
        guard FileManager.default.fileExists(atPath: fileURL.path) else {
            print("⚠️ No scam numbers file found, using empty list")
            return []
        }
        
        // Read and decode JSON
        let data = try Data(contentsOf: fileURL)
        let decoder = JSONDecoder()
        let scamNumbers = try decoder.decode([ScamNumber].self, from: data)
        
        return scamNumbers
    }
    
    // MARK: - Blocking Entries
    
    /// Add blocking entries to the call directory
    /// These numbers will be automatically blocked by iOS (no ring, no notification)
    private func addBlockingEntries(
        to context: CXCallDirectoryExtensionContext,
        numbers: [ScamNumber]
    ) async throws {
        
        // iOS requires numbers to be added in ASCENDING numerical order
        let sortedNumbers = numbers
            .compactMap { $0.phoneNumber }
            .sorted()
        
        for phoneNumber in sortedNumbers {
            context.addBlockingEntry(withNextSequentialPhoneNumber: phoneNumber)
        }
        
        print("✅ Added \(sortedNumbers.count) blocking entries")
    }
    
    // MARK: - Identification Entries
    
    /// Add identification entries to the call directory
    /// These numbers will show custom labels on the incoming call screen
    private func addIdentificationEntries(
        to context: CXCallDirectoryExtensionContext,
        numbers: [ScamNumber]
    ) async throws {
        
        // iOS requires numbers to be added in ASCENDING numerical order
        let sortedNumbers = numbers
            .sorted { $0.phoneNumber < $1.phoneNumber }
        
        for scamNumber in sortedNumbers {
            let label = formatLabel(for: scamNumber)
            context.addIdentificationEntry(
                withNextSequentialPhoneNumber: scamNumber.phoneNumber,
                label: label
            )
        }
        
        print("✅ Added \(sortedNumbers.count) identification entries")
    }
    
    // MARK: - Helpers
    
    /// Format a user-friendly label for the incoming call screen
    private func formatLabel(for scamNumber: ScamNumber) -> String {
        let emoji: String
        let prefix: String
        
        switch scamNumber.confidence {
        case 0.9...1.0:
            emoji = "🚨"
            prefix = "KNOWN SCAM"
        case 0.7..<0.9:
            emoji = "⚠️"
            prefix = "Suspected Scam"
        default:
            emoji = "⚠️"
            prefix = "Reported"
        }
        
        if let type = scamNumber.scamType, !type.isEmpty {
            return "\(emoji) \(prefix) - \(type)"
        } else {
            return "\(emoji) \(prefix)"
        }
    }
}

// MARK: - Data Models

/// Represents a scam phone number with metadata
struct ScamNumber: Codable {
    let phoneNumber: CXCallDirectoryPhoneNumber
    let scamType: String?
    let confidence: Double
    let reportCount: Int
    let shouldBlock: Bool
    
    enum CodingKeys: String, CodingKey {
        case phoneNumber = "phone_number"
        case scamType = "scam_type"
        case confidence
        case reportCount = "report_count"
        case shouldBlock = "should_block"
    }
}

// MARK: - Errors

enum CallDirectoryError: Error {
    case containerNotFound
    case dataLoadFailed
    case invalidFormat
}