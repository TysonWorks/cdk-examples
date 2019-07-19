import cdk = require('@aws-cdk/core');
import ec2 = require('@aws-cdk/aws-ec2');

export class EC2BasicsStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Using default vpc
    const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
      isDefault: true
    });

    // Open port 22 for SSH connection from anywhere
    const mySecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc,
      securityGroupName: "my-test-sg",
      description: 'Allow ssh access to ec2 instances from anywhere',
      allowAllOutbound: true 
    });
    mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')

    // We are using the latest AMAZON LINUX AMI
    const awsAMI = new ec2.AmazonLinuxImage({generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2});


    // We define instance details here
    const ec2Instance = new ec2.CfnInstance(this, "test-instance", {
      imageId: awsAMI.getImage(this).imageId,
      instanceType: "t2.micro",
      monitoring: false,
      tags: [
        {"key": "Name", "value": "test-instance"}
      ],
      networkInterfaces: [
        {
          deviceIndex: "0",
          associatePublicIpAddress: true,
          subnetId: vpc.publicSubnets[0].subnetId,
          groupSet: [mySecurityGroup.securityGroupId]
        }
      ]
    })
  }
}

const app = new cdk.App();
new EC2BasicsStack(app, "EC2BasicsStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.ACCOUNT_ID
    }
});