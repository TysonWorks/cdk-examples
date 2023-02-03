import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns";
import * as ecs from "aws-cdk-lib/aws-ecs";
import { Construct } from "constructs";
require('dotenv').config();

const DB_PORT = +(process.env["DB_PORT"] as string);
const DB_NAME = process.env["DB_NAME"] as string;
const DB_USER = process.env["DB_USER"] as string
const DB_PASSWORD = process.env["DB_PASSWORD"] as string;

class WordpressHAStack extends cdk.Stack {
    constructor(construct: Construct, id: string, props?: cdk.StackProps) {
        super(construct, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const wordpressSg = new ec2.SecurityGroup(this, "wp-sg", {
            vpc: vpc,
            description: 'Wordpress SG'
        });

        const dbCluster = new rds.DatabaseCluster(this, "db-cluster", {
            clusterIdentifier: "db-cluster",
            defaultDatabaseName: DB_NAME,
            engine: rds.DatabaseClusterEngine.AURORA,
            port: DB_PORT,
            credentials: {
                username: DB_USER,
                password: cdk.SecretValue.plainText(DB_PASSWORD)
            },
            instanceProps: {
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
                vpc,
                securityGroups: [wordpressSg]
            }
        });

        const cluster = new ecs.Cluster(this, "ecs-cluster", {
            vpc,
        });

        cluster.connections.addSecurityGroup(wordpressSg);

        const wordpressService = new ecs_patterns.ApplicationLoadBalancedEc2Service(this, "wordpress-service", {
            cluster,
            memoryLimitMiB: 1024,
            taskImageOptions: {
                image: ecs.ContainerImage.fromRegistry('wordpress'),
                environment: {
                    WORDPRESS_DB_HOST: dbCluster.clusterEndpoint.socketAddress,
                    WORDPRESS_DB_USER: DB_USER,
                    WORDPRESS_DB_PASSWORD: DB_PASSWORD,
                    WORDPRESS_DB_NAME: DB_NAME,
                },
            },
            desiredCount: 2,
        });
        
        const scalableTarget = wordpressService.service.autoScaleTaskCount({
            minCapacity: 2,
            maxCapacity: 5
        });
        scalableTarget.scaleOnCpuUtilization('task-cpu-scaling', {
            targetUtilizationPercent: 20,
        });
    }
}

const app = new cdk.App();
new WordpressHAStack(app, "WordpressStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
})

