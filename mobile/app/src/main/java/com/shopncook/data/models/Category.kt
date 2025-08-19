package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class Category(
    @SerializedName("_id")
    val id: String,

    @SerializedName("title")
    val title: String
)
