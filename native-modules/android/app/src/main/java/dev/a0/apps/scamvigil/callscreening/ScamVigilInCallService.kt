package dev.a0.apps.scamvigil.callscreening

import android.telecom.Call
import android.telecom.InCallService
import android.content.Intent
import android.util.Log

/**
 * ScamVigil In-Call Service
 * 
 * Shows warnings and provides actions DURING an active call
 * This runs when the user has already answered the call
 * 
 * Requires Android 6+ (API 23+)
 */
class ScamVigilInCallService : InCallService() {
    
    private val TAG = "ScamVigilInCall"
    private val activeCalls = mutableMapOf<String, Call>()
    
    /**
     * Called when a new call is added
     * This is our chance to show a scam warning overlay
     */
    override fun onCallAdded(call: Call) {
        super.onCallAdded(call)
        
        val phoneNumber = call.details?.handle?.schemeSpecificPart
        if (phoneNumber == null) {
            Log.w(TAG, "No phone number in call details")
            return
        }
        
        activeCalls[phoneNumber] = call
        
        Log.d(TAG, "Call added from: $phoneNumber")
        
        // Check if this is a suspected scam
        checkForScam(phoneNumber, call)
        
        // Monitor call state changes
        call.registerCallback(object : Call.Callback() {
            override fun onStateChanged(call: Call, state: Int) {
                when (state) {
                    Call.STATE_ACTIVE -> {
                        Log.d(TAG, "Call active: $phoneNumber")
                    }
                    Call.STATE_DISCONNECTED -> {
                        Log.d(TAG, "Call ended: $phoneNumber")
                        activeCalls.remove(phoneNumber)
                    }
                }
            }
        })
    }
    
    /**
     * Called when a call is removed
     */
    override fun onCallRemoved(call: Call) {
        super.onCallRemoved(call)
        
        val phoneNumber = call.details?.handle?.schemeSpecificPart
        activeCalls.remove(phoneNumber)
        
        Log.d(TAG, "Call removed: $phoneNumber")
    }
    
    /**
     * Check if the phone number is a known scam
     * If so, show warning overlay
     */
    private fun checkForScam(phoneNumber: String, call: Call) {
        val db = ScamDatabase.getInstance(applicationContext)
        val scamInfo = db.scamNumberDao().getScamInfo(phoneNumber)
        
        if (scamInfo != null && scamInfo.confidence >= 0.6) {
            // This is a suspected/known scam!
            Log.w(TAG, "⚠️ SCAM CALL DETECTED: $phoneNumber (confidence: ${scamInfo.confidence})")
            
            // Show warning overlay
            showScamWarningOverlay(phoneNumber, scamInfo, call)
        }
    }
    
    /**
     * Show floating warning overlay during the call
     * Displays scam information and quick actions
     */
    private fun showScamWarningOverlay(
        phoneNumber: String,
        scamInfo: ScamInfo,
        call: Call
    ) {
        val intent = Intent(this, ScamWarningOverlayActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
            putExtra("phone_number", phoneNumber)
            putExtra("scam_type", scamInfo.scamType)
            putExtra("confidence", scamInfo.confidence)
            putExtra("report_count", scamInfo.reportCount)
        }
        
        // Launch overlay activity
        startActivity(intent)
        
        // Send broadcast to React Native app (for logging/analytics)
        val broadcastIntent = Intent("dev.a0.apps.scamvigil.SCAM_CALL_DETECTED").apply {
            putExtra("phone_number", phoneNumber)
            putExtra("scam_type", scamInfo.scamType)
            putExtra("confidence", scamInfo.confidence)
        }
        sendBroadcast(broadcastIntent)
    }
    
    /**
     * Hang up a specific call (called from overlay UI)
     */
    fun hangUpCall(phoneNumber: String) {
        activeCalls[phoneNumber]?.disconnect()
        Log.d(TAG, "Hung up call: $phoneNumber")
    }
}