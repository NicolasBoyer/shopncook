package com.shopncook

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
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

    private val mainViewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ShopNCookTheme {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    val state by mainViewModel.mainState.collectAsState()

                    when (state) {
                        is MainState.Loading -> {
                            Box(
                                modifier = Modifier.fillMaxSize(),
                                contentAlignment = Alignment.Center
                            ) {
                                CircularProgressIndicator()
                            }
                        }
                        is MainState.UserLoggedIn -> {
                            AppNavigation(startDestination = Screen.Home.route)
                        }
                        is MainState.UserLoggedOut -> {
                            AppNavigation(startDestination = Screen.Login.route)
                        }
                    }
                }
            }
        }
    }
}
