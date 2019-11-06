
import { APIGatewayEvent, Context, Callback } from "aws-lambda";
import { MongoClient } from "mongodb";
import { generate } from "shortid";
import { connectToDB, success } from "./lib";

const DB_NAME = process.env.DB_NAME as string;
let dbClient: MongoClient;

export async function handler(event: APIGatewayEvent, context: Context, callback: Callback){
    try {
        console.log(event);
        dbClient = await connectToDB();
        const body = JSON.parse(event.body as string);
        const db = dbClient.db(DB_NAME);
        const shortId = generate();
        await db.collection("urls").insertOne({
            url: body.url,
            createdAt: new Date().toUTCString(),
            shortId,
            requesterIP: event.requestContext.identity.sourceIp
        });
        const baseURL = `https://${event.requestContext.domainName}${event.requestContext.path}`;
        callback(null, success({shortUrl: `${baseURL}/${shortId}`}));
    } catch(err) {
        console.error(err);
        callback("Internal error");
    } finally {
        await dbClient.close();
    }
}

