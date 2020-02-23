import * as cdk from "@aws-cdk/core";
import * as cognito from "@aws-cdk/aws-cognito";
import { config } from "dotenv";
config();

class CognitoUserPoolStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userPool = new cognito.CfnUserPool(this, "user-pool", {
            userPoolName: "user-pool",
            usernameAttributes: [
                "email",
                "phone_number"
            ],
            policies: {
                passwordPolicy: {
                    minimumLength: 6,
                    requireLowercase: false,
                    requireNumbers: true,
                    requireUppercase: false,
                    temporaryPasswordValidityDays: 7
                }
            },
        });
        const userPoolClient = new cognito.CfnUserPoolClient(this, "user-pool-client", {
            userPoolId: userPool.ref,
            clientName: "web-client",
            generateSecret: false
        });
        userPoolClient.addDependsOn(userPool);
    }   
}

const app = new cdk.App();
new CognitoUserPoolStack(app, "CognitoUserPoolStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});