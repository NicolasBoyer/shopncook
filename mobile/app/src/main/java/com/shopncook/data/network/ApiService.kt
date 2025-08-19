package com.shopncook.data.network

import com.google.gson.JsonElement
import com.shopncook.data.models.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST

interface ApiService {

    // --- Auth ---
    @POST("register")
    suspend fun register(@Body registrationRequest: RegistrationRequest): Response<AuthResponse>

    @POST("login")
    suspend fun login(@Body loginRequest: LoginRequest): Response<AuthResponse>

    @POST("logout")
    suspend fun logout(): Response<Unit>

    @GET("currentUser")
    suspend fun getCurrentUser(): Response<User>


    // --- Generic Data Endpoints ---
    @GET("recipes.json")
    suspend fun getRecipesJson(): Response<List<Recipe>>

    @GET("ingredients.json")
    suspend fun getIngredientsJson(): Response<List<Ingredient>>

    @GET("lists.json")
    suspend fun getListIngredientsJson(): Response<List<ListIngredient>>

    @GET("categories.json")
    suspend fun getCategoriesJson(): Response<List<Category>>

    @GET("dishes.json")
    suspend fun getDishesJson(): Response<List<Dish>>

    // --- Generic DB Resolver ---
    @POST("db")
    suspend fun dbRequest(@Body request: Map<String, @JvmSuppressWildcards Any>): Response<JsonElement>


    // --- Request/Response Data Classes ---

    data class LoginRequest(
        val email: String,
        val password: String
    )

    data class RegistrationRequest(
        val firstName: String,
        val lastName: String,
        val mail: String,
        val password: String,
        val passwordBis: String
    )

    data class AuthResponse(
        val success: Boolean,
        val message: String,
        val token: String?
    )
}
