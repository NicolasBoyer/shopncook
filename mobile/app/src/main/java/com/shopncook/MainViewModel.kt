package com.shopncook

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopncook.data.datastore.TokenManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch

sealed class MainState {
    object Loading : MainState()
    object UserLoggedIn : MainState()
    object UserLoggedOut : MainState()
}

class MainViewModel : ViewModel() {

    private val tokenManager: TokenManager = MyApplication.tokenManager

    private val _mainState = MutableStateFlow<MainState>(MainState.Loading)
    val mainState: StateFlow<MainState> = _mainState

    init {
        checkUserLoginStatus()
    }

    private fun checkUserLoginStatus() {
        viewModelScope.launch {
            val token = tokenManager.authToken.first()
            if (token != null && token.isNotBlank()) {
                _mainState.value = MainState.UserLoggedIn
            } else {
                _mainState.value = MainState.UserLoggedOut
            }
        }
    }
}
