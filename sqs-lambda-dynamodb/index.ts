import * as cdk from "@aws-cdk/core";
import * as sqs from '@aws-cdk/aws-sqs';
import * as lambda from "@aws-cdk/aws-lambda";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import { SqsEventSource } from '@aws-cdk/aws-lambda-event-sources';
import { readFileSync } from "fs";
import { config } from "dotenv";
config();

class SQSLambdaDynamodbStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const queue = new sqs.Queue(this, "Orders", {
            queueName: "Orders"
        });

        const table = new dynamodb.Table(this, "OrdersTable", {
            tableName: "OrdersTable",
            partitionKey: {name: "id", type: dynamodb.AttributeType.STRING},
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST
        });

        const srcPath = `${__dirname}/lambdaHandler.js`;
        const lambdaFunction = new lambda.Function(this, "ProcessOrder", {
            functionName: "ProcessOrder", 
            code: new lambda.InlineCode(readFileSync(srcPath, {encoding: "utf-8"})),
            handler: "index.handler",
            timeout: cdk.Duration.seconds(30),
            runtime: lambda.Runtime.NODEJS_8_10,
            environment: {
                TABLE_NAME: table.tableName,
                REGION: process.env.AWS_REGION as string
            },
            events: [
                new SqsEventSource(queue)
            ]
        });
        table.grantWriteData(lambdaFunction);
        new cdk.CfnOutput(this, 'QueueURL', {
            value: queue.queueUrl
          });
    }
}

const app = new cdk.App();
new SQSLambdaDynamodbStack(app, "SQSLambdaDynamodbStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
})

