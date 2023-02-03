import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { config } from "dotenv";
import { Construct } from 'constructs';
config();

class EC2BasicsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC
    const vpc = new ec2.Vpc(this, 'VPC');

    // Open port 22 for SSH connection from anywhere
    const mySecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: "my-test-sg",
      description: 'Allow ssh access to ec2 instances from anywhere',
      allowAllOutbound: true
    });
    mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')

    // We are using the latest AMAZON LINUX AMI
    const awsAMI = new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 });

    // We define the instance details here
    const ec2Instance = new ec2.Instance(this, 'Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
      machineImage: awsAMI,
      securityGroup: mySecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC
      },
    });

    new cdk.CfnOutput(this, "ip-address", {value: ec2Instance.instancePublicIp});
  }
}

const app = new cdk.App();
new EC2BasicsStack(app, "EC2BasicsStack", {
  env: {
    region: process.env.AWS_REGION,
    account: process.env.AWS_ACCOUNT_ID
  }
});