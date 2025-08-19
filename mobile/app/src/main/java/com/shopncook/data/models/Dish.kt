package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class Dish(
    @SerializedName("_id")
    val id: String,

    @SerializedName("day")
    val day: String,

    @SerializedName("name")
    val name: String,

    @SerializedName("time")
    val time: String
)
