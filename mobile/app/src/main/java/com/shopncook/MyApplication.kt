package com.shopncook

import android.app.Application
import com.shopncook.data.datastore.TokenManager

class MyApplication : Application() {

    companion object {
        lateinit var tokenManager: TokenManager
            private set
    }

    override fun onCreate() {
        super.onCreate()
        tokenManager = TokenManager(applicationContext)
    }
}
