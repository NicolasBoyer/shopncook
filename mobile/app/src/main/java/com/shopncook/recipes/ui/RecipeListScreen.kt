package com.shopncook.recipes.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shopncook.data.models.Recipe
import com.shopncook.recipes.viewmodel.RecipeState
import com.shopncook.recipes.viewmodel.RecipeViewModel

@Composable
fun RecipeListScreen(
    recipeViewModel: RecipeViewModel = viewModel()
    // onRecipeClick: (String) -> Unit // For future navigation to recipe details
) {
    val state by recipeViewModel.recipeState.collectAsState()

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        when (val recipeState = state) {
            is RecipeState.Loading -> {
                CircularProgressIndicator()
            }
            is RecipeState.Success -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(recipeState.recipes) { recipe ->
                        RecipeListItem(recipe = recipe, onClick = { /* onRecipeClick(recipe.id) */ })
                    }
                }
            }
            is RecipeState.Error -> {
                Text(text = "Error: ${recipeState.message}")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RecipeListItem(recipe: Recipe, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = recipe.title)
        }
    }
}
