import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { config } from "dotenv";
config();

class TransitGatewayStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc1 = new ec2.Vpc(this, "vpc1", {
            maxAzs: 2,
            cidr: "10.10.0.0/24",
            enableDnsSupport: true,
            natGateways: 1
        });

        const vpc2 = new ec2.Vpc(this, "vpc2", {
            maxAzs: 2,
            cidr: "192.168.1.0/24",
            enableDnsSupport: true,
            natGateways: 1
        });

        const vpc3 = new ec2.Vpc(this, "vpc3", {
            maxAzs: 2,
            cidr: "172.168.1.0/24",
            enableDnsSupport: true,
            natGateways: 1
        });

        const sg1 = new ec2.SecurityGroup(this, 'sg1', {
            vpc: vpc1,
            securityGroupName: "sg1",
        });
        sg1.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow port 80');
        sg1.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow port 22');

        const sg2 = new ec2.SecurityGroup(this, 'sg2', {
            vpc: vpc2,
            securityGroupName: "sg2",
        });
        sg2.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow port 22');

        const sg3 = new ec2.SecurityGroup(this, "sg3", {
            vpc: vpc3,
            securityGroupName: "sg3"
        });
        sg3.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'allow port 80');
        sg3.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow port 22');

        const userData = ec2.UserData.forLinux();
        userData.addCommands("sudo amazon-linux-extras install nginx1.12 -y");
        userData.addCommands("sudo chkconfig nginx on");
        userData.addCommands("sudo service nginx start");

        const instance1 = new ec2.Instance(this, "instance1", {
            instanceName: "instance1",
            vpc: vpc1,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroup: sg1,
            userData
        });

        const instance2 = new ec2.Instance(this, "instance2", {
            instanceName: "instance2",
            vpc: vpc2,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC,
            },
            securityGroup: sg2
        });

        const instance3 = new ec2.Instance(this, "instance3", {
            instanceName: "instance3",
            vpc: vpc3,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroup: sg3,
            userData
        });

        const transitGateway = new ec2.CfnTransitGateway(this, "transit-gateway", {
            autoAcceptSharedAttachments: "enable",
            defaultRouteTableAssociation: "enable",
            dnsSupport: "enable"
        });
        
        const attachment1 = new ec2.CfnTransitGatewayAttachment(this, "tg-attachment1", {
            vpcId: vpc1.vpcId,
            transitGatewayId: transitGateway.ref,
            subnetIds: [vpc1.privateSubnets[0].subnetId, vpc1.privateSubnets[1].subnetId]
        });
        attachment1.addDependsOn(transitGateway);
        const attachment2 = new ec2.CfnTransitGatewayAttachment(this, "tg-attachment2", {
            vpcId: vpc2.vpcId,
            transitGatewayId: transitGateway.ref,
            subnetIds: [vpc2.privateSubnets[0].subnetId, vpc2.privateSubnets[1].subnetId]
        });
        attachment2.addDependsOn(transitGateway);
        const attachment3 = new ec2.CfnTransitGatewayAttachment(this, "tg-attachment3", {
            vpcId: vpc3.vpcId,
            transitGatewayId: transitGateway.ref,
            subnetIds: [vpc3.privateSubnets[0].subnetId, vpc3.privateSubnets[1].subnetId]
        });
        attachment3.addDependsOn(transitGateway);
        
        const vpc1Subnets = [...vpc1.privateSubnets, ...vpc1.publicSubnets];
        const vpc2Subnets = [...vpc2.privateSubnets, ...vpc2.publicSubnets];
        const vpc3Subnets = [...vpc3.privateSubnets, ...vpc3.publicSubnets];

        // Add routes to every subnet
        vpc1Subnets.map((subnet, i)=>{
            new ec2.CfnRoute(this, `vpc1.2-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc2.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment1);

            new ec2.CfnRoute(this, `vpc1.3-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc3.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment1);
        });

        // Add routes to every subnet
        vpc2Subnets.map((subnet, i)=>{
            new ec2.CfnRoute(this, `vpc2.1-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc1.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment2);
            new ec2.CfnRoute(this, `vpc2.3-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc3.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment2);
        });

        // Add routes to every subnet
        vpc3Subnets.map((subnet, i)=>{
            new ec2.CfnRoute(this, `vpc3.1-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc1.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment3);
            new ec2.CfnRoute(this, `vpc3.2-${i}`, {
                routeTableId: subnet.routeTable.routeTableId,
                destinationCidrBlock: vpc2.vpcCidrBlock,
                transitGatewayId: transitGateway.ref
            }).addDependsOn(attachment3);
        });

        new cdk.CfnOutput(this, "instance1-dns", {value: instance1.instancePrivateDnsName});
        new cdk.CfnOutput(this, "instance2-dns", {value: instance2.instancePrivateDnsName});
        new cdk.CfnOutput(this, "instance3-dns", {value: instance3.instancePrivateDnsName});
    }
}

const app = new cdk.App();
new TransitGatewayStack(app, "TransitGatewayStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});