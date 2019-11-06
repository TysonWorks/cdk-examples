import cdk = require("@aws-cdk/core");
import dynamodb = require("@aws-cdk/aws-dynamodb");
import lambda = require("@aws-cdk/aws-lambda");

import fs = require("fs");

export class DynamoStreamsLambdaStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const srcPath = `${__dirname}/stream-handler.py`;
        const streamLambda = new lambda.Function(this, "StreamHandler", {
            functionName: "StreamHandler",
            code: new lambda.InlineCode(fs.readFileSync(srcPath, { encoding: 'utf-8' })),
            handler: 'index.handler',
            timeout: cdk.Duration.seconds(30),
            runtime: lambda.Runtime.PYTHON_3_7
        })

        const dogsTable = new dynamodb.Table(this, "DogsTable", {
            tableName: "DogsTable",
            partitionKey: {name: "id", type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        });
        dogsTable.grantStreamRead(streamLambda);
        streamLambda.addEventSourceMapping("EventSourceMapping", {
            eventSourceArn: dogsTable.tableStreamArn,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST
        })
    }
}

const app = new cdk.App();
new DynamoStreamsLambdaStack(app, "DynamoStreamsLambdaStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.ACCOUNT_ID
    }
});