import * as cdk from "aws-cdk-lib/core";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import { Construct } from "constructs";
import { config } from "dotenv";
config();

class EcsGoAPIStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps){
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, 'vpc', { maxAzs: 2 });

        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });

        const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, "FargateService", {
            cluster,
            taskImageOptions: {
                image: ecs.ContainerImage.fromAsset(`${__dirname}/api`),
                containerPort: 8080,
                environment: {
                    DEPLOYED_DATE: Date.now().toLocaleString()
                }
            },
            desiredCount: 1
        });

        new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    }
}

const app = new cdk.App();
new EcsGoAPIStack(app, "EcsGoAPIStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION,
    }
});
