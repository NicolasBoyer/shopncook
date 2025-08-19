package com.shopncook.auth.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopncook.auth.repository.AuthRepository
import com.shopncook.data.network.ApiService
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

// Sealed class to represent the different states of the authentication process
sealed class AuthState {
    object Idle : AuthState()
    object Loading : AuthState()
    data class Success(val authResponse: ApiService.AuthResponse) : AuthState()
    data class Error(val message: String) : AuthState()
}


class AuthViewModel(private val authRepository: AuthRepository = AuthRepository()) : ViewModel() {

    private val _authState = MutableStateFlow<AuthState>(AuthState.Idle)
    val authState: StateFlow<AuthState> = _authState

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = AuthState.Loading
            try {
                val response = authRepository.login(email, password)
                _authState.value = AuthState.Success(response)
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "An unknown error occurred")
            }
        }
    }

    fun register(firstName: String, lastName: String, email: String, password: String, confirmPass: String) {
        viewModelScope.launch {
            // Basic validation
            if (password != confirmPass) {
                _authState.value = AuthState.Error("Passwords do not match")
                return@launch
            }
            _authState.value = AuthState.Loading
            try {
                val response = authRepository.register(firstName, lastName, email, password, confirmPass)
                _authState.value = AuthState.Success(response)
            } catch (e: Exception) {
                _authState.value = AuthState.Error(e.message ?: "An unknown error occurred")
            }
        }
    }
}
