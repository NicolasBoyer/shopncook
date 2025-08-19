package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class Recipe(
    @SerializedName("_id")
    val id: String,

    @SerializedName("slug")
    val slug: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("ingredients")
    val ingredients: List<ListIngredient>
)
