import cdk = require('@aws-cdk/core');
import lambda = require('@aws-cdk/aws-lambda');
import elbv2 = require('@aws-cdk/aws-elasticloadbalancingv2');
import elbv2Targets = require("@aws-cdk/aws-elasticloadbalancingv2-targets");
import ec2 = require("@aws-cdk/aws-ec2")
import fs = require('fs');

export class ElbLambdaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', { maxAzs: 2 });

    const srcPath = `${__dirname}/lambda-handler.py`;
    const lambdaFunction = new lambda.Function(this, 'random-word-generator', {
      code: new lambda.InlineCode(fs.readFileSync(srcPath, { encoding: 'utf-8' })),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(300),
      runtime: lambda.Runtime.PYTHON_3_7,
      vpc
    });

    const alb = new elbv2.ApplicationLoadBalancer(this, "alb", {
      vpc,
      internetFacing: true
    });

    const lambdaTarget = new elbv2Targets.LambdaTarget(lambdaFunction);

    const listener = alb.addListener("listener", {
      port: 80
    });

    listener.addTargets("targets", {
      targets: [lambdaTarget]
    });

    listener.connections.allowDefaultPortFromAnyIpv4('Open to the world');

    new cdk.CfnOutput(this, "ElbDomain", {value: alb.loadBalancerDnsName});
  }
}


const app = new cdk.App();
new ElbLambdaStack(app, "ElbLambdaStack", {
  env: {
    account: process.env.ACCOUNT_ID,
    region: process.env.AWS_REGION
  }
});