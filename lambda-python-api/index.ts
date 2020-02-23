import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from "@aws-cdk/aws-apigateway";
import { readFileSync } from "fs";
import { addCorsOptions } from "./lib";
import { config } from "dotenv";
config();

class LambdaPythonAPIStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const srcPath = `${__dirname}/lambda-handler.py`;
        const lambdaFunction = new lambda.Function(this, "FindPoems", {
            code: new lambda.InlineCode(readFileSync(srcPath, { encoding: 'utf-8' })),
            handler: 'index.handler',
            timeout: cdk.Duration.seconds(30),
            runtime: lambda.Runtime.PYTHON_3_7
        });

        const api = new apigateway.RestApi(this, 'FindPoemsAPI', {
            restApiName: 'Find Poems API'
        });
        const poems = api.root.addResource("poems");
        const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction);
        poems.addMethod('GET', lambdaIntegration);
        addCorsOptions(poems)
    }
}

const app = new cdk.App();
new LambdaPythonAPIStack(app, "LambdaPythonAPIStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.AWS_ACCOUNT_ID
    }
});