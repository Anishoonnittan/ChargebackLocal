import Foundation
import CallKit
import React

/// React Native bridge module for Call Directory Extension
/// Allows JavaScript to:
/// - Sync scam numbers to shared container
/// - Reload the extension
/// - Check if extension is enabled
@objc(CallDirectoryModule)
class CallDirectoryModule: NSObject {
    
    private let extensionIdentifier = "dev.a0.apps.scamvigil.CallDirectoryExtension"
    private let appGroupIdentifier = "group.dev.a0.apps.scamvigil"
    
    // MARK: - React Native Methods
    
    /// Sync scam numbers from Convex to shared container
    /// JavaScript calls this after fetching fresh data from the backend
    @objc
    func syncScamNumbers(
        _ numbers: [[String: Any]],
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        do {
            // Convert JavaScript array to Swift models
            let scamNumbers = try parseScamNumbers(numbers)
            
            // Write to shared container
            try writeToSharedContainer(scamNumbers)
            
            // Automatically reload extension after sync
            reloadExtension(resolve, rejecter: reject)
            
        } catch {
            reject("SYNC_ERROR", "Failed to sync scam numbers: \(error.localizedDescription)", error)
        }
    }
    
    /// Reload the Call Directory Extension
    /// Tells iOS to re-read the data we've provided
    @objc
    func reloadExtension(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: extensionIdentifier) { error in
            if let error = error {
                reject("RELOAD_ERROR", "Failed to reload extension: \(error.localizedDescription)", error)
            } else {
                resolve(true)
            }
        }
    }
    
    /// Check if the Call Directory Extension is enabled in Settings
    /// User must manually enable in: Settings → Phone → Call Blocking & Identification
    @objc
    func getEnabledStatus(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(withIdentifier: extensionIdentifier) { status, error in
            if let error = error {
                reject("STATUS_ERROR", "Failed to get status: \(error.localizedDescription)", error)
            } else {
                let isEnabled = (status == .enabled)
                resolve(isEnabled)
            }
        }
    }
    
    /// Open iOS Settings to the Call Blocking page
    /// Helps users quickly enable the extension
    @objc
    func openSettings(
        _ resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            if let url = URL(string: "App-prefs:Phone") {
                if UIApplication.shared.canOpenURL(url) {
                    UIApplication.shared.open(url) { success in
                        resolve(success)
                    }
                } else {
                    // Fallback to general settings
                    if let settingsUrl = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(settingsUrl) { success in
                            resolve(success)
                        }
                    } else {
                        resolve(false)
                    }
                }
            } else {
                resolve(false)
            }
        }
    }
    
    // MARK: - Helper Methods
    
    /// Parse JavaScript array into Swift ScamNumber models
    private func parseScamNumbers(_ data: [[String: Any]]) throws -> [ScamNumberData] {
        var scamNumbers: [ScamNumberData] = []
        
        for item in data {
            guard let phoneNumberString = item["phone_number"] as? String,
                  let phoneNumber = CXCallDirectoryPhoneNumber(phoneNumberString) else {
                continue
            }
            
            let scamNumber = ScamNumberData(
                phoneNumber: phoneNumber,
                scamType: item["scam_type"] as? String,
                confidence: item["confidence"] as? Double ?? 0.5,
                reportCount: item["report_count"] as? Int ?? 1,
                shouldBlock: item["should_block"] as? Bool ?? false
            )
            
            scamNumbers.append(scamNumber)
        }
        
        return scamNumbers
    }
    
    /// Write scam numbers to shared App Group container
    /// This makes the data accessible to the Call Directory Extension
    private func writeToSharedContainer(_ numbers: [ScamNumberData]) throws {
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupIdentifier
        ) else {
            throw CallDirectoryModuleError.containerNotFound
        }
        
        let fileURL = containerURL.appendingPathComponent("scam-numbers.json")
        
        let encoder = JSONEncoder()
        encoder.outputFormatting = .prettyPrinted
        let data = try encoder.encode(numbers)
        
        try data.write(to: fileURL, options: .atomic)
        
        print("✅ Wrote \(numbers.count) scam numbers to shared container")
    }
    
    // MARK: - React Native Configuration
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return false
    }
}

// MARK: - Data Models

struct ScamNumberData: Codable {
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

enum CallDirectoryModuleError: Error {
    case containerNotFound
    case invalidData
}

// MARK: - React Native Bridge

extension CXCallDirectoryPhoneNumber {
    /// Initialize from string (digits only)
    init?(_ string: String) {
        let cleaned = string.replacingOccurrences(of: "[^0-9]", with: "", options: .regularExpression)
        guard let number = Int64(cleaned) else { return nil }
        self = CXCallDirectoryPhoneNumber(number)
    }
}