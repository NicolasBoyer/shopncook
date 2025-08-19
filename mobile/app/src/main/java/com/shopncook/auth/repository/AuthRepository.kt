package com.shopncook.auth.repository

import com.shopncook.MyApplication
import com.shopncook.data.datastore.TokenManager
import com.shopncook.data.network.ApiService
import com.shopncook.data.network.RetrofitInstance

class AuthRepository {

    private val apiService: ApiService = RetrofitInstance.api
    private val tokenManager: TokenManager = MyApplication.tokenManager

    suspend fun login(email: String, password: String): ApiService.AuthResponse {
        val request = ApiService.LoginRequest(email, password)
        val response = apiService.login(request)
        if (response.isSuccessful) {
            val authResponse = response.body()!!
            if (authResponse.success && authResponse.token != null) {
                tokenManager.saveAuthToken(authResponse.token)
            }
            return authResponse
        } else {
            // A more robust implementation would parse the error body
            throw Exception("Login failed: ${response.message()}")
        }
    }

    suspend fun register(firstName: String, lastName: String, email: String, password: String, confirmPass: String): ApiService.AuthResponse {
        val request = ApiService.RegistrationRequest(firstName, lastName, email, password, confirmPass)
        val response = apiService.register(request)
        if (response.isSuccessful) {
            val authResponse = response.body()!!
            if (authResponse.success && authResponse.token != null) {
                tokenManager.saveAuthToken(authResponse.token)
            }
            return authResponse
        } else {
            throw Exception("Registration failed: ${response.message()}")
        }
    }

    suspend fun logout() {
        tokenManager.clearAuthToken()
        // Here you might also call a backend endpoint to invalidate the token
    }
}
