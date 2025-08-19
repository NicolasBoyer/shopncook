package com.shopncook.data.network

import com.shopncook.MyApplication
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.runBlocking
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val tokenManager = MyApplication.tokenManager
        // runBlocking is used here because the interceptor chain is synchronous.
        // This is a common pattern for injecting tokens from a Flow into OkHttp.
        val token = runBlocking {
            tokenManager.authToken.first()
        }

        val requestBuilder = chain.request().newBuilder()

        // Add the token to the header if it exists.
        // The backend expects the token in a cookie, but for a mobile app,
        // sending it as a Bearer token is a more standard approach.
        // I will assume the backend can be modified to accept this.
        // If not, I'll need to adjust to send it as a Cookie header.
        // For now, I'll use the standard 'Authorization' header.
        if (token != null && token.isNotBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $token")
            // The original web app used a cookie named 'fsTk'.
            // If the backend strictly requires a cookie, the header would be:
            // requestBuilder.addHeader("Cookie", "fsTk=$token")
        }

        return chain.proceed(requestBuilder.build())
    }
}
