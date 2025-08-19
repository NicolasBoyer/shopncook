package com.shopncook.recipes.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopncook.data.models.Recipe
import com.shopncook.recipes.repository.RecipeRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class RecipeState {
    object Loading : RecipeState()
    data class Success(val recipes: List<Recipe>) : RecipeState()
    data class Error(val message: String) : RecipeState()
}

class RecipeViewModel(private val recipeRepository: RecipeRepository = RecipeRepository()) : ViewModel() {

    private val _recipeState = MutableStateFlow<RecipeState>(RecipeState.Loading)
    val recipeState: StateFlow<RecipeState> = _recipeState

    init {
        fetchRecipes()
    }

    fun fetchRecipes() {
        viewModelScope.launch {
            _recipeState.value = RecipeState.Loading
            try {
                val recipes = recipeRepository.getRecipes()
                _recipeState.value = RecipeState.Success(recipes)
            } catch (e: Exception) {
                _recipeState.value = RecipeState.Error(e.message ?: "An unknown error occurred")
            }
        }
    }
}
