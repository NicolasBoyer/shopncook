package com.shopncook.home.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun HomeScreen(
    onLogout: () -> Unit,
    onNavigateToRecipes: () -> Unit,
    onNavigateToShoppingList: () -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize(),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Welcome to ShopNCook!")
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onNavigateToShoppingList) {
            Text("Shopping List")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onNavigateToRecipes) {
            Text("View Recipes")
        }
        Spacer(modifier = Modifier.height(8.dp))
        Button(onClick = onLogout) {
            Text("Logout")
        }
    }
}
