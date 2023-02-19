import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { config } from "dotenv";
import { Construct } from "constructs";
config();

class LambdaFunctionURLStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const lambdaFunction = new lambda.Function(this, "function-url", {
            functionName: "function-url",
            runtime: lambda.Runtime.NODEJS_18_X,
            code: new lambda.AssetCode("src"),
            handler: "lambdaHandler.handler",
            timeout: cdk.Duration.seconds(60)
        });

        const cors = {
            allowedOrigins: ['*'],
        };
        const functionURL = lambdaFunction.addFunctionUrl({authType: lambda.FunctionUrlAuthType.NONE, cors});

        new cdk.CfnOutput(this, "URLS", {
            value: functionURL.url
        });

    }
}

const app = new cdk.App();
new LambdaFunctionURLStack(app, "LambdaFunctionURLStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});