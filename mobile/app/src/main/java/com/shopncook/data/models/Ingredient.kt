package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class Ingredient(
    @SerializedName("_id")
    val id: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("recipes")
    val recipes: List<RecipeInIngredient>,

    @SerializedName("category")
    val category: String
)

data class RecipeInIngredient(
    @SerializedName("recipeId")
    val recipeId: String,

    @SerializedName("size")
    val size: String,

    @SerializedName("unit")
    val unit: String
)
