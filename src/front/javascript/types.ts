import { ObjectId } from 'mongodb'
import http from 'http'
import { JwtPayload } from 'jsonwebtoken'

export type HTMLElementEvent<T extends HTMLElement> = Event &
    KeyboardEvent & {
        target: T
    }

export type TCategory = {
    _id: ObjectId
    title: string
}

export type TIngredient = {
    _id: ObjectId
    title: string
    key: string
    recipes: TRecipeInIngredient[]
    category: string
}

export type TRecipeInIngredient = { recipeId: string; size: string; unit: string }

export type TListIngredient = {
    _id?: ObjectId
    unit: string
    title: string
    category: string
    size: string
    ordered?: boolean
}

export type TRecipe = {
    _id: ObjectId
    slug: string
    title: string
    ingredients: TListIngredient[]
}

export type TDish = {
    _id: ObjectId
    day: string
    name: string
    time: string
}

export type TRoute = {
    path: string
    className: string
    title: string
    label: string
}

export type TDatabaseIngredient = Record<string, (TIngredient & TListIngredient & { id?: string; filter: { _id?: ObjectId } | { title?: string; unit?: string } })[] & string>

export type TIncomingMessage = http.IncomingMessage & {
    params: Record<string, string>
    user?: string | JwtPayload
}

export type TValidateReturn = {
    success: boolean
    message?: string
    token?: string
}

export type TUser = {
    _id: string
    firstName: string
    lastName: string
    email: string
    password: string
    roles: { db: string; permissions: string[] }[]
    userDbName: string
}
