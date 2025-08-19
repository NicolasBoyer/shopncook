package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class ListIngredient(
    @SerializedName("_id")
    val id: String?,

    @SerializedName("unit")
    val unit: String,

    @SerializedName("title")
    val title: String,

    @SerializedName("category")
    val category: String,

    @SerializedName("size")
    val size: String,

    @SerializedName("ordered")
    val ordered: Boolean? = false
)
