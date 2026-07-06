package com.smsbroadcast

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

class ServerForegroundService : Service() {

    companion object {
        const val ACTION_STOP = "com.smsbroadcast.STOP_SERVER_SERVICE"
        const val ACTION_UPDATE = "com.smsbroadcast.UPDATE_SERVER_SERVICE"
        const val EXTRA_PORT = "port"
        const val EXTRA_SENT = "sent"
        const val EXTRA_ERRORS = "errors"
        const val CHANNEL_ID = "sms_server_channel"
        const val NOTIFICATION_ID = 42

        // JS registers a lambda here; native invokes it when the user taps "Stop"
        var stopCallback: (() -> Unit)? = null
    }

    override fun onCreate() {
        super.onCreate()
        ensureChannel()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                // Let JS handle the teardown; if JS is gone, stop directly
                if (stopCallback != null) {
                    stopCallback?.invoke()
                } else {
                    stopForegroundCompat()
                    stopSelf()
                }
                return START_NOT_STICKY
            }
            ACTION_UPDATE -> {
                val port   = intent.getIntExtra(EXTRA_PORT, 8080)
                val sent   = intent.getIntExtra(EXTRA_SENT, 0)
                val errors = intent.getIntExtra(EXTRA_ERRORS, 0)
                getSystemService(NotificationManager::class.java)
                    .notify(NOTIFICATION_ID, buildNotification(port, sent, errors))
            }
            else -> {
                val port = intent?.getIntExtra(EXTRA_PORT, 8080) ?: 8080
                val notification = buildNotification(port, 0, 0)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    startForeground(NOTIFICATION_ID, notification,
                        ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC)
                } else {
                    startForeground(NOTIFICATION_ID, notification)
                }
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun buildNotification(port: Int, sent: Int, errors: Int): android.app.Notification {
        val stopIntent = Intent(this, ServerForegroundService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPi = PendingIntent.getService(
            this, 0, stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val body = if (sent > 0 || errors > 0)
            "Puerto $port · Enviados: $sent · Errores: $errors"
        else
            "Servidor escuchando en el puerto $port"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SMS Broadcast activo")
            .setContentText(body)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setOngoing(true)
            .addAction(0, "Detener", stopPi)
            .build()
    }

    private fun ensureChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID, "SMS Server", NotificationManager.IMPORTANCE_DEFAULT
            )
            getSystemService(NotificationManager::class.java).createNotificationChannel(channel)
        }
    }

    @Suppress("DEPRECATION")
    private fun stopForegroundCompat() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
            stopForeground(true)
        }
    }
}
