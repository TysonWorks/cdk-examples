import * as cdk from "@aws-cdk/core";
import { config } from "dotenv";

class EmptyStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);
    }
}

const app = new cdk.App();
new EmptyStack(app, "EmptyStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});