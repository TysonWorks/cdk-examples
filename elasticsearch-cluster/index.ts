import * as cdk from "aws-cdk-lib";
import * as es from "aws-cdk-lib/aws-elasticsearch";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";
import { config } from "dotenv";
config();

const DOMAIN_NAME = "es-domain";

export class ElasticSearchStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Comment out for enabling VPC
        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });
        const sg = new ec2.SecurityGroup(this, "sg", {
            vpc,
            allowAllOutbound: true,
            securityGroupName: "es-sg"
        });
        sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), "Allow access to port 80");
        sg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), "Allow access to port 443");

        const domain = new es.CfnDomain(this, "es-domain", {
            vpcOptions: {
                subnetIds: vpc.publicSubnets.slice(0,2).map(subnet=>subnet.subnetId),
                securityGroupIds: [sg.securityGroupId]
            },
            domainName: DOMAIN_NAME,
            elasticsearchVersion: "6.8",
            elasticsearchClusterConfig: {
                instanceType: "t2.medium.elasticsearch",
                dedicatedMasterEnabled: true,
                dedicatedMasterCount: 2,
                dedicatedMasterType: "t2.medium.elasticsearch",
                instanceCount: 2,
                zoneAwarenessEnabled: true,
                zoneAwarenessConfig: {
                    availabilityZoneCount: 2
                }
            },
            ebsOptions: {
                ebsEnabled: true,
                volumeSize: 35,
                volumeType: "io1",
                iops: 1000
            },
            accessPolicies: {
                Version: "2012-10-17",
                Statement: [
                   {
                      Effect: "Allow",
                      Principal: {
                         "AWS": "*"
                      },
                      "Action":"es:*",
                      "Resource":`arn:aws:es:${process.env.AWS_REGION}:${process.env.ACCOUNT_ID}:domain/${DOMAIN_NAME}/*`
                   }
                ]
             }
        });

        new cdk.CfnOutput(this, "domain", {value: domain.attrDomainEndpoint as string})
        new cdk.CfnOutput(this, "kibana", {value: `${domain.attrDomainEndpoint}/_plugin/kibana/` as string})
    }
}

const app = new cdk.App();
new ElasticSearchStack(app, "ElasticSearchStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});