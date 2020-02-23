import * as cdk from "@aws-cdk/core";
import * as sagemaker from "@aws-cdk/aws-sagemaker";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import { config } from "dotenv";
config();

class SagemakerStack extends cdk.Stack {
    constructor(construct: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(construct, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const sg = new ec2.SecurityGroup(this, "sg", {
            vpc
        });

        const role = new iam.Role(this, "service-role", {
            assumedBy: new iam.ServicePrincipal("sagemaker.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("CloudWatchLogsFullAccess")
            ],
        });

        const notebook = new sagemaker.CfnNotebookInstance(this, "notebook", {
            notebookInstanceName: "cdk-notebook",
            directInternetAccess: "Enabled",
            securityGroupIds: [sg.securityGroupId],
            instanceType: "ml.t3.medium",
            roleArn: role.roleArn,
            rootAccess: "Enabled",
            subnetId: vpc.publicSubnets[0].subnetId
        });
        new cdk.CfnOutput(this, "sagemaker", {value: notebook.ref});
    }
}

const app = new cdk.App();
new SagemakerStack(app, "SagemakerStack", {
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});