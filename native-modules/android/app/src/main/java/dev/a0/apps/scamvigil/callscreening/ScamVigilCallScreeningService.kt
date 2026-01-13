package dev.a0.apps.scamvigil.callscreening

import android.telecom.Call
import android.telecom.CallScreeningService
import android.content.Context
import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * ScamVigil Call Screening Service
 * 
 * This service is invoked by Android for EVERY incoming call BEFORE the phone rings.
 * We have ~2 seconds to decide: allow, silence, or block.
 * 
 * Requires Android 10+ (API 29+)
 */
class ScamVigilCallScreeningService : CallScreeningService() {
    
    private val TAG = "ScamVigilCallScreening"
    
    /**
     * Called by Android for each incoming call
     * This runs BEFORE the phone rings, giving us a chance to block scams
     */
    override fun onScreenCall(callDetails: Call.Details) {
        val phoneNumber = callDetails.handle?.schemeSpecificPart
        
        if (phoneNumber == null) {
            Log.w(TAG, "No phone number in call details, allowing call")
            respondToCall(callDetails, createAllowResponse())
            return
        }
        
        Log.d(TAG, "Screening call from: $phoneNumber")
        
        // Check if this number is a known scam (fast, local database)
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val result = screenPhoneNumber(phoneNumber)
                
                val response = when (result.action) {
                    ScreeningAction.BLOCK -> createBlockResponse()
                    ScreeningAction.SILENCE -> createSilenceResponse()
                    ScreeningAction.ALLOW -> createAllowResponse()
                }
                
                respondToCall(callDetails, response)
                
                // Log the screening result
                logScreeningResult(phoneNumber, result)
                
                // Show notification if blocked
                if (result.action == ScreeningAction.BLOCK) {
                    showBlockedNotification(phoneNumber, result)
                }
                
            } catch (e: Exception) {
                Log.e(TAG, "Error screening call", e)
                // On error, allow the call (fail-safe)
                respondToCall(callDetails, createAllowResponse())
            }
        }
    }
    
    /**
     * Screen a phone number against our scam database
     * This should be FAST (< 100ms) to avoid delaying call handling
     */
    private fun screenPhoneNumber(phoneNumber: String): ScreeningResult {
        val db = ScamDatabase.getInstance(applicationContext)
        
        // Check local database (instant)
        val scamInfo = db.scamNumberDao().getScamInfo(phoneNumber)
        
        return when {
            // High confidence scam - block immediately
            scamInfo != null && scamInfo.confidence >= 0.9 -> {
                ScreeningResult(
                    action = ScreeningAction.BLOCK,
                    confidence = scamInfo.confidence,
                    scamType = scamInfo.scamType,
                    reportCount = scamInfo.reportCount
                )
            }
            
            // Medium confidence - silence ringer but allow user to answer
            scamInfo != null && scamInfo.confidence >= 0.6 -> {
                ScreeningResult(
                    action = ScreeningAction.SILENCE,
                    confidence = scamInfo.confidence,
                    scamType = scamInfo.scamType,
                    reportCount = scamInfo.reportCount
                )
            }
            
            // Unknown or low confidence - allow
            else -> {
                ScreeningResult(
                    action = ScreeningAction.ALLOW,
                    confidence = 0.0,
                    scamType = null,
                    reportCount = 0
                )
            }
        }
    }
    
    /**
     * Create response to BLOCK a call
     * Call will be rejected, won't ring, won't show in call log
     */
    private fun createBlockResponse(): CallResponse {
        return CallResponse.Builder()
            .setDisallowCall(true)      // Don't allow this call
            .setRejectCall(true)         // Actively reject it
            .setSkipCallLog(true)        // Don't add to call log
            .setSkipNotification(true)   // Don't show system notification
            .build()
    }
    
    /**
     * Create response to SILENCE a call
     * Call will come through but won't make noise
     */
    private fun createSilenceResponse(): CallResponse {
        return CallResponse.Builder()
            .setDisallowCall(false)      // Allow the call
            .setRejectCall(false)        // Don't reject
            .setSilenceCall(true)        // But silence the ringer
            .setSkipNotification(false)  // Show notification (silently)
            .build()
    }
    
    /**
     * Create response to ALLOW a call normally
     */
    private fun createAllowResponse(): CallResponse {
        return CallResponse.Builder()
            .setDisallowCall(false)
            .setRejectCall(false)
            .setSilenceCall(false)
            .build()
    }
    
    /**
     * Log the screening result for analytics
     */
    private fun logScreeningResult(phoneNumber: String, result: ScreeningResult) {
        val db = ScamDatabase.getInstance(applicationContext)
        db.screeningLogDao().insert(ScreeningLog(
            phoneNumber = phoneNumber,
            action = result.action.name,
            confidence = result.confidence,
            scamType = result.scamType,
            timestamp = System.currentTimeMillis()
        ))
    }
    
    /**
     * Show notification that we blocked a scam call
     */
    private fun showBlockedNotification(phoneNumber: String, result: ScreeningResult) {
        val notificationHelper = NotificationHelper(applicationContext)
        notificationHelper.showBlockedCallNotification(
            phoneNumber = phoneNumber,
            scamType = result.scamType ?: "Suspected Scam",
            confidence = result.confidence
        )
    }
}

/**
 * Result of screening a phone number
 */
data class ScreeningResult(
    val action: ScreeningAction,
    val confidence: Double,
    val scamType: String?,
    val reportCount: Int
)

/**
 * Actions we can take on a call
 */
enum class ScreeningAction {
    ALLOW,      // Let call through normally
    SILENCE,    // Silence ringer but allow user to answer
    BLOCK       // Block completely (no ring, no log)
}