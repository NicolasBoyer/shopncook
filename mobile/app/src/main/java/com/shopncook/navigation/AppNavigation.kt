package com.shopncook.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.shopncook.auth.ui.LoginScreen
import com.shopncook.auth.ui.RegistrationScreen
import com.shopncook.home.ui.HomeScreen

import com.shopncook.recipes.ui.RecipeListScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object Home : Screen("home")
    object Recipes : Screen("recipes")
}

@Composable
fun AppNavigation(startDestination: String) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(navController.graph.startDestinationId) {
                            inclusive = true
                        }
                        launchSingleTop = true
                    }
                }
            )
        }
        composable(Screen.Register.route) {
            RegistrationScreen(
                onRegistrationSuccess = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            HomeScreen(
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Home.route) { inclusive = true }
                    }
                },
                onNavigateToRecipes = {
                    navController.navigate(Screen.Recipes.route)
                }
            )
        }
        composable(Screen.Recipes.route) {
            RecipeListScreen()
        }
    }
}
