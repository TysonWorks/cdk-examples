import * as cdk from "aws-cdk-lib";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {readFileSync} from "fs";
import { Construct } from "constructs";
import { config } from "dotenv";
config();

class DynamoStreamsLambdaStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const srcPath = `${__dirname}/stream-handler.py`;
        const streamLambda = new lambda.Function(this, "StreamHandler", {
            functionName: "StreamHandler",
            code: new lambda.InlineCode(readFileSync(srcPath, { encoding: 'utf-8' })),
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
            eventSourceArn: dogsTable.tableStreamArn as string,
            enabled: true,
            startingPosition: lambda.StartingPosition.LATEST
        })
    }
}

const app = new cdk.App();
new DynamoStreamsLambdaStack(app, "DynamoStreamsLambdaStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.AWS_ACCOUNT_ID
    }
});