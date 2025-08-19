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
            if (authResponse.success) {
                // The backend sends the token in a 'Set-Cookie' header.
                // We need to parse it to get the token value.
                val cookieHeader = response.headers()["Set-Cookie"]
                if (cookieHeader != null) {
                    val token = parseTokenFromCookie(cookieHeader)
                    if (token.isNotBlank()) {
                        tokenManager.saveAuthToken(token)
                    }
                }
            }
            return authResponse
        } else {
            throw Exception("Login failed: ${response.message()}")
        }
    }

    private fun parseTokenFromCookie(cookieHeader: String): String {
        // Example cookie: "fsTk=some_long_token_string; HttpOnly; Path=/; Secure; SameSite=Strict"
        val tokenPart = cookieHeader.split(";").firstOrNull { it.trim().startsWith("fsTk=") }
        return tokenPart?.split("=")?.getOrNull(1)?.trim() ?: ""
    }

    suspend fun register(firstName: String, lastName: String, email: String, password: String, confirmPass: String): ApiService.AuthResponse {
        val request = ApiService.RegistrationRequest(firstName, lastName, email, password, confirmPass)
        val response = apiService.register(request)
        if (response.isSuccessful) {
            // Assuming registration does not automatically log the user in / set a cookie.
            // If it does, the same cookie parsing logic would be needed here.
            return response.body()!!
        } else {
            throw Exception("Registration failed: ${response.message()}")
        }
    }

    suspend fun logout() {
        tokenManager.clearAuthToken()
        // Here you might also call a backend endpoint to invalidate the token
    }
}
