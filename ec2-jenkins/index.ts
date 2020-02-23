import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import { getLatestJenkinsAMI } from "./lib";
import { config } from "dotenv";
config();

interface EC2JenkinsStackProps {
    env: any;
    ami: string;
}

class EC2JenkinsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: EC2JenkinsStackProps) {
        super(scope, id, props);

        // Create a new VPC
        const vpc = new ec2.Vpc(this, 'VPC');

        const mySecurityGroup = new ec2.SecurityGroup(this, 'jenkins-sg', {
            vpc,
            securityGroupName: "jenkins-sg",
            allowAllOutbound: true
        });
        mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')
        mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Jenkins port");

        const region = props.env.region as string;
        const ec2Instance = new ec2.Instance(this, 'Instance', {
            vpc,
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machineImage: ec2.MachineImage.genericLinux({
                [region]: props.ami
          }),
            securityGroup: mySecurityGroup,
            vpcSubnets: {
              subnetType: ec2.SubnetType.PUBLIC
            },
            blockDevices: [{
              deviceName: "/dev/xvdb",
              volume: ec2.BlockDeviceVolume.ebs(100, {
                deleteOnTermination: true,
                encrypted: true
              }),
              mappingEnabled: true
            }]
          });

        new cdk.CfnOutput(this, "EC2 URL", {
            value: ec2Instance.instancePublicDnsName
        });
        
    }
}

(async()=>{
    const jenkinsAMI = await getLatestJenkinsAMI(process.env.AWS_REGION as string);
    const app = new cdk.App();
    new EC2JenkinsStack(app, "EC2JenkinsStack", {
        env: {
            account: process.env.AWS_ACCOUNT_ID,
            region: process.env.AWS_REGION,
        },
        ami: jenkinsAMI
    })
})();