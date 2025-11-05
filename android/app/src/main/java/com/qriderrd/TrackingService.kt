package com.qriderrd

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class TrackingService : Service() {
  companion object {
    const val CHANNEL_ID = "qrider_tracking_channel"
    const val CHANNEL_NAME = "QRider Tracking"
    const val NOTIFICATION_ID = 424242
    const val EXTRA_TITLE = "title"
    const val EXTRA_TEXT = "text"
  }

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val title = intent?.getStringExtra(EXTRA_TITLE) ?: "Evento activo"
    val text = intent?.getStringExtra(EXTRA_TEXT) ?: "Seguimiento en segundo plano habilitado"

    val notification: Notification = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(title)
      .setContentText(text)
      .setSmallIcon(android.R.drawable.ic_menu_mylocation)
      .setOngoing(true)
      .setPriority(NotificationCompat.PRIORITY_LOW)
      .build()

    startForeground(NOTIFICATION_ID, notification)
    // We do not perform location work here; JS layer handles it via Geolocation.watchPosition.
    // The foreground service keeps the app process alive for reliable updates when screen is off.
    return START_STICKY
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onDestroy() {
    stopForeground(true)
    super.onDestroy()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        CHANNEL_NAME,
        NotificationManager.IMPORTANCE_LOW
      )
      channel.setShowBadge(false)
      val nm = getSystemService(NotificationManager::class.java)
      nm?.createNotificationChannel(channel)
    }
  }
}

