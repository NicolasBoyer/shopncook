package com.shopncook.shoppinglist.repository

import com.shopncook.data.models.ListIngredient
import com.shopncook.data.network.ApiService
import com.shopncook.data.network.RetrofitInstance

class ShoppingListRepository {

    private val apiService: ApiService = RetrofitInstance.api

    suspend fun getShoppingList(): List<ListIngredient> {
        val response = apiService.getListIngredientsJson()
        if (response.isSuccessful) {
            return response.body() ?: emptyList()
        } else {
            throw Exception("Failed to fetch shopping list: ${response.message()}")
        }
    }

    suspend fun removeItem(itemId: String) {
        val request = mapOf("removeListIngredient" to itemId)
        val response = apiService.dbRequest(request)
        if (!response.isSuccessful) {
            throw Exception("Failed to remove item: ${response.message()}")
        }
    }

    suspend fun clearList() {
        val request = mapOf("clearListIngredients" to "")
        val response = apiService.dbRequest(request)
        if (!response.isSuccessful) {
            throw Exception("Failed to clear list: ${response.message()}")
        }
    }

    // Add/Edit will be more complex, requiring a full ingredient object.
    // I'll add a placeholder for now.
    suspend fun addOrUpdateItem(item: ListIngredient) {
        val request = mapOf("setListIngredients" to mapOf("ingredients" to listOf(item)))
        val response = apiService.dbRequest(request)
        if (!response.isSuccessful) {
            throw Exception("Failed to add or update item: ${response.message()}")
        }
    }
}
