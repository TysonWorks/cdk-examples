import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");

import { getLatestJenkinsAMI } from "./lib";

export interface EC2JenkinsStackProps {
    env: any;
    ami: string;
}

export class EC2JenkinsStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props: EC2JenkinsStackProps) {
        super(scope, id, props);

        const vpc = ec2.Vpc.fromLookup(this, 'VPC', {
            isDefault: true
        });
        const mySecurityGroup = new ec2.SecurityGroup(this, 'jenkins-sg', {
            vpc,
            securityGroupName: "jenkins-sg",
            allowAllOutbound: true
        });
        mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'allow public ssh access')
        mySecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Jenkins port");

        const volume = new ec2.CfnVolume(this, "Volume", {
            availabilityZone: vpc.publicSubnets[0].availabilityZone,
            size: 100
        })

        const ec2Instance = new ec2.CfnInstance(this, "jenkins-instance", {
            imageId: props.ami,
            instanceType: "t3.micro",
            tags: [
                {key: "Name", value: "jenkins-instance"}
            ],
            networkInterfaces: [
                {
                    deviceIndex: "0",
                    subnetId: vpc.publicSubnets[0].subnetId,
                    groupSet: [mySecurityGroup.securityGroupId],
                    associatePublicIpAddress: true
                }
            ],
            volumes: [{device: "/dev/xvdb", volumeId: volume.ref}]
        });
        

        new cdk.CfnOutput(this, "EC2 URL", {
            value: ec2Instance.attrPublicDnsName
        });
        
    }
}

(async()=>{
    const jenkinsAMI = await getLatestJenkinsAMI();
    const app = new cdk.App();
    new EC2JenkinsStack(app, "EC2JenkinsStack", {
        env: {
            account: process.env.ACCOUNT_ID,
            region: process.env.AWS_REGION,
        },
        ami: jenkinsAMI
    })
})();