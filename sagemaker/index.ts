import cdk = require("@aws-cdk/core");
import sagemaker = require("@aws-cdk/aws-sagemaker");

class SagemakerStack extends cdk.Stack {
    constructor(construct: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(construct, id, props);
        const endpoint = new sagemaker.CfnEndpoint(this, "endpoint", {
            endpointName: "endpoint",
            endpointConfigName: "endpoint"
        });
        
    }
}

const app = new cdk.App();
new SagemakerStack(app, "SagemakerStack", {
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});