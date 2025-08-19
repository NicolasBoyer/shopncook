package com.shopncook.shoppinglist.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.ClearAll
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.shopncook.data.models.ListIngredient
import com.shopncook.shoppinglist.viewmodel.ShoppingListState
import com.shopncook.shoppinglist.viewmodel.ShoppingListViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShoppingListScreen(
    viewModel: ShoppingListViewModel = viewModel(),
    onNavigateBack: () -> Unit
) {
    val state by viewModel.listState.collectAsState()
    var showDialog by remember { mutableStateOf(false) }

    if (showDialog) {
        AddItemDialog(
            onDismiss = { showDialog = false },
            onConfirm = { newItem ->
                viewModel.addItem(newItem)
                showDialog = false
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Shopping List") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.clearList() }) {
                        Icon(Icons.Default.ClearAll, contentDescription = "Clear List")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = { showDialog = true }) {
                Icon(Icons.Default.Add, contentDescription = "Add Item")
            }
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues),
            contentAlignment = Alignment.Center
        ) {
            when (val listState = state) {
                is ShoppingListState.Loading -> {
                    CircularProgressIndicator()
                }
                is ShoppingListState.Success -> {
                    if (listState.items.isEmpty()) {
                        Text("Your shopping list is empty.")
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(listState.items) { item ->
                                ShoppingListItem(
                                    item = item,
                                    onDeleteItem = { viewModel.removeItem(item.id!!) }
                                )
                            }
                        }
                    }
                }
                is ShoppingListState.Error -> {
                    Text(text = "Error: ${listState.message}")
                }
            }
        }
    }
}

@Composable
fun AddItemDialog(
    onDismiss: () -> Unit,
    onConfirm: (ListIngredient) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var size by remember { mutableStateOf("") }
    var unit by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add New Item") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Item Name") }
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = size,
                        onValueChange = { size = it },
                        label = { Text("Quantity") },
                        modifier = Modifier.weight(1f)
                    )
                    OutlinedTextField(
                        value = unit,
                        onValueChange = { unit = it },
                        label = { Text("Unit") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (title.isNotBlank() && size.isNotBlank() && unit.isNotBlank()) {
                        val newItem = ListIngredient(
                            id = null, // Backend will generate ID
                            title = title,
                            size = size,
                            unit = unit,
                            category = "", // Category can be assigned later
                            ordered = false
                        )
                        onConfirm(newItem)
                    }
                }
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun ShoppingListItem(
    item: ListIngredient,
    onDeleteItem: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "${item.title} (${item.size} ${item.unit})",
                modifier = Modifier.weight(1f),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            IconButton(onClick = onDeleteItem) {
                Icon(Icons.Default.Delete, contentDescription = "Delete Item")
            }
        }
    }
}
