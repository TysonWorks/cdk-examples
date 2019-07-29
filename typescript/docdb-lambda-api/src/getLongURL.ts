
import { APIGatewayEvent, Context, Callback } from "aws-lambda";

import { connectToDB, success, redirect, notFound } from "./lib";
import { MongoClient } from "mongodb";

const DB_NAME = process.env.DB_NAME as string;

let dbClient: MongoClient;

export async function handler(event: APIGatewayEvent, context: Context, callback: Callback) {
    try {
        dbClient = await connectToDB();
        const db = dbClient.db(DB_NAME);
        const id = event.pathParameters!["id"];
        const dbItem = await db.collection("urls").findOne({shortId: id});
        if(!dbItem) {
            return callback(null, notFound({}));
        }
        return callback(null, redirect(dbItem.url));
    } catch(err) {
        console.error(err);
        return callback("Internal error");
    } finally {
        await dbClient.close();
    }
}