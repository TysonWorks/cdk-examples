import cdk = require("@aws-cdk/core");
import cognito = require("@aws-cdk/aws-cognito");

export class CognitoUserPoolStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const userpool = new cognito.UserPool(this, "MyUserPool", {
            userPoolName: "MyUserPool",
            signInType: cognito.SignInType.EMAIL
        })

    }
}
