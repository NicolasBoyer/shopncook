package com.shopncook.data.models

import com.google.gson.annotations.SerializedName

data class User(
    @SerializedName("_id")
    val id: String,

    @SerializedName("firstName")
    val firstName: String,

    @SerializedName("lastName")
    val lastName: String,

    @SerializedName("email")
    val email: String
)
