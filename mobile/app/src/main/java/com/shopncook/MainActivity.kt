package com.shopncook

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import com.shopncook.navigation.AppNavigation
import com.shopncook.navigation.Screen
import com.shopncook.ui.theme.ShopNCookTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ShopNCookTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val token by MyApplication.tokenManager.authToken.collectAsState(initial = null)

                    // Show a loading indicator while we wait for the token to be read from DataStore
                    if (token == null) {
                        Box(
                            modifier = Modifier.fillMaxSize(),
                            contentAlignment = Alignment.Center
                        ) {
                            CircularProgressIndicator()
                        }
                    } else {
                        val startDestination = if (token!!.isNotBlank()) Screen.Home.route else Screen.Login.route
                        AppNavigation(startDestination = startDestination)
                    }
                }
            }
        }
    }
}
