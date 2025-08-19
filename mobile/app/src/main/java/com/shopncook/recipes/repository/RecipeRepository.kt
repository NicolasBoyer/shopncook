package com.shopncook.recipes.repository

import com.shopncook.data.models.Recipe
import com.shopncook.data.network.ApiService
import com.shopncook.data.network.RetrofitInstance

class RecipeRepository {
    private val apiService: ApiService = RetrofitInstance.api

    suspend fun getRecipes(): List<Recipe> {
        val response = apiService.getRecipesJson()
        if (response.isSuccessful) {
            return response.body() ?: emptyList()
        } else {
            throw Exception("Failed to fetch recipes: ${response.message()}")
        }
    }

    // Future functions for adding, updating, deleting recipes will go here
    // e.g., suspend fun addRecipe(recipe: Recipe) { ... }
}
