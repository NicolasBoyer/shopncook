package com.shopncook.auth.ui

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shopncook.auth.viewmodel.AuthViewModel
import com.shopncook.auth.viewmodel.AuthState
import com.shopncook.ui.theme.ShopNCookTheme

@Composable
fun LoginScreen(
    authViewModel: AuthViewModel = viewModel(),
    onLoginSuccess: () -> Unit,
    onNavigateToRegister: () -> Unit
) {
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    val authState by authViewModel.authState.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(authState) {
        when (val state = authState) {
            is AuthState.Success -> {
                if (state.authResponse.success) {
                    Toast.makeText(context, "Login Successful!", Toast.LENGTH_SHORT).show()
                    onLoginSuccess()
                } else {
                    Toast.makeText(context, "Login Failed: ${state.authResponse.message}", Toast.LENGTH_LONG).show()
                }
            }
            is AuthState.Error -> {
                Toast.makeText(context, "Error: ${state.message}", Toast.LENGTH_LONG).show()
            }
            else -> {}
        }
    }

    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.Center,
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Login", style = MaterialTheme.typography.headlineMedium)
            Spacer(modifier = Modifier.height(16.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                label = { Text("Email") },
                modifier = Modifier.fillMaxWidth(),
                enabled = authState !is AuthState.Loading
            )
            Spacer(modifier = Modifier.height(8.dp))

            OutlinedTextField(
                value = password,
                onValueChange = { password = it },
                label = { Text("Password") },
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
                enabled = authState !is AuthState.Loading
            )
            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = { authViewModel.login(email, password) },
                modifier = Modifier.fillMaxWidth(),
                enabled = authState !is AuthState.Loading
            ) {
                Text("Login")
            }
            Spacer(modifier = Modifier.height(8.dp))
            TextButton(onClick = onNavigateToRegister) {
                Text("Don't have an account? Sign up")
            }
        }

        if (authState is AuthState.Loading) {
            CircularProgressIndicator()
        }
    }
}

@Preview(showBackground = true)
@Composable
fun LoginScreenPreview() {
    ShopNCookTheme {
        // The preview won't have a real ViewModel, so it shows the initial state.
        LoginScreen(onLoginSuccess = {}, onNavigateToRegister = {})
    }
}
