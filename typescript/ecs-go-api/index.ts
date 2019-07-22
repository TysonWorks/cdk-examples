import cdk = require("@aws-cdk/core");
import ecr = require("@aws-cdk/aws-ecr");
import ec2 = require("@aws-cdk/aws-ec2");
import ecs = require('@aws-cdk/aws-ecs');
import ecs_patterns = require('@aws-cdk/aws-ecs-patterns');

export default class EcsGoAPIStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps){
        super(scope, id, props);

        const ecrRepo = new ecr.Repository(this, "GoAPI", {
            repositoryName: "go-api"
        });

        new cdk.CfnOutput(this, "ecrRepoURI", {
            value: ecrRepo.repositoryUri
        });

        const vpc = new ec2.Vpc(this, 'vpc', { maxAzs: 2 });

        const cluster = new ecs.Cluster(this, 'Cluster', { vpc });
        const fargateService = new ecs_patterns.LoadBalancedFargateService(this, "FargateService", {
            cluster,
            image: new ecs.EcrImage(ecrRepo, "latest"),
            containerPort: 8080
        });
        new cdk.CfnOutput(this, 'LoadBalancerDNS', { value: fargateService.loadBalancer.loadBalancerDnsName });
    }
}

const app = new cdk.App();
new EcsGoAPIStack(app, "EcsGoAPIStack", {
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.AWS_REGION,
    }
});