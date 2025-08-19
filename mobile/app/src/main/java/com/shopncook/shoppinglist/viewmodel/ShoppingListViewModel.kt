package com.shopncook.shoppinglist.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.shopncook.data.models.ListIngredient
import com.shopncook.shoppinglist.repository.ShoppingListRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed class ShoppingListState {
    object Loading : ShoppingListState()
    data class Success(val items: List<ListIngredient>) : ShoppingListState()
    data class Error(val message: String) : ShoppingListState()
}

class ShoppingListViewModel(private val repository: ShoppingListRepository = ShoppingListRepository()) : ViewModel() {

    private val _listState = MutableStateFlow<ShoppingListState>(ShoppingListState.Loading)
    val listState: StateFlow<ShoppingListState> = _listState

    init {
        loadShoppingList()
    }

    fun loadShoppingList() {
        viewModelScope.launch {
            _listState.value = ShoppingListState.Loading
            try {
                val items = repository.getShoppingList()
                _listState.value = ShoppingListState.Success(items)
            } catch (e: Exception) {
                _listState.value = ShoppingListState.Error(e.message ?: "An unknown error occurred")
            }
        }
    }

    fun removeItem(itemId: String) {
        viewModelScope.launch {
            try {
                repository.removeItem(itemId)
                // Refresh the list after removing an item
                loadShoppingList()
            } catch (e: Exception) {
                // Optionally expose a separate error state for single actions
                _listState.value = ShoppingListState.Error(e.message ?: "Failed to remove item")
            }
        }
    }

    fun clearList() {
        viewModelScope.launch {
            try {
                repository.clearList()
                loadShoppingList()
            } catch (e: Exception) {
                _listState.value = ShoppingListState.Error(e.message ?: "Failed to clear list")
            }
        }
    }

    fun addItem(item: ListIngredient) {
        viewModelScope.launch {
            try {
                repository.addOrUpdateItem(item)
                loadShoppingList()
            } catch (e: Exception) {
                _listState.value = ShoppingListState.Error(e.message ?: "Failed to add item")
            }
        }
    }
}
