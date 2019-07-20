const DynamoDB = require("aws-sdk").DynamoDB

const dynamoDb = new DynamoDB.DocumentClient({
    region: process.env.REGION
  });

async function handler(event, context, callback) {
    try {
        for(const record of event.Records) {
            const input = JSON.parse(JSON.parse(JSON.stringify(record.body)));
            const item = {
                id: record.messageId,
                timestamp: Date.now(),
                items: input.items,
                customerId: input.customerId,
                sqsMessageAttributes: record.attributes
            }
            const dbParams = {
                TableName: process.env.TABLE_NAME,
                Item: item
            }
            await dynamoDb.put(dbParams).promise();
        }
        callback(null, "done");
    } catch(err) {
        console.error(err);
        callback("Internal server error");
    }
}

module.exports.handler = handler;