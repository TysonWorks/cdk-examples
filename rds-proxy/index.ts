import * as cdk from "@aws-cdk/core";
import * as rds from "@aws-cdk/aws-rds";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { config } from "dotenv";
config();

const DB_PORT = process.env["DB_PORT"] as string;
const DB_NAME = process.env["DB_NAME"] as string;
const DB_USER = process.env["DB_USER"] as string
const NUM_OF_LAMBDA_FUNCTIONS = 10;

class RdsProxyStack extends cdk.Stack {
    constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const dbClusterSg = new ec2.SecurityGroup(this, "db-instance-sg", {
            vpc,
            description: 'RDS Cluster SG'
        });

        const lambdaSg = new ec2.SecurityGroup(this, "lambda-sg", {
            vpc,
            description: "Lambda SG"
        });

        const dbProxySg = new ec2.SecurityGroup(this, "db-proxy-sg", {
            vpc,
            description: "RDS Proxy SG"
        });

        dbClusterSg.addIngressRule(lambdaSg, ec2.Port.tcp(+DB_PORT));
        dbProxySg.addIngressRule(lambdaSg, ec2.Port.tcp(+DB_PORT));
        dbClusterSg.addIngressRule(dbProxySg, ec2.Port.tcp(+DB_PORT));
        

        const dbCluster = new rds.DatabaseCluster(this, "db-cluster", {
            clusterIdentifier: "db-cluster",
            defaultDatabaseName: DB_NAME,
            engine: rds.DatabaseClusterEngine.AURORA_MYSQL,
            port: +DB_PORT,
            masterUser: {
                username: DB_USER
            },
            instanceProps: { 
                instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
                vpc,
                securityGroups: [dbClusterSg]
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            instanceIdentifierBase: "dbcluster"
        });
        
        const dbProxy = new rds.DatabaseProxy(this, "db-proxy", {
            vpc,  
            vpcSubnets: {
                subnetType: ec2.SubnetType.PUBLIC
            },
            borrowTimeout: cdk.Duration.seconds(30),
            proxyTarget: rds.ProxyTarget.fromCluster(dbCluster),
            secrets: [dbCluster.secret!],
            dbProxyName: "db-proxy",
            securityGroups: [dbProxySg],
            requireTLS: true,
            iamAuth: true
        });

        const lambdaRole = new iam.Role(this, "lambda-role", {
            roleName: "lambda-role",
            assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
            inlinePolicies: {
                "rds-connect": new iam.PolicyDocument({
                    statements: [
                        new iam.PolicyStatement({
                            actions: [ "rds-db:connect" ],
                            resources: ["*"]
                        }),
                        new iam.PolicyStatement({
                            actions: [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "ec2:CreateNetworkInterface",
                                "ec2:DescribeNetworkInterfaces",
                                "ec2:DeleteNetworkInterface"
                            ],
                            resources: ["*"]
                        })
                    ]
                })
            }
        });

        for(let i=0; i<NUM_OF_LAMBDA_FUNCTIONS; i++){
            const lambdaFunction = new lambda.Function(this, `function-${i}`, {
                functionName: `function-${i}`,
                runtime: lambda.Runtime.NODEJS_12_X,
                vpc,
                code: new lambda.AssetCode("src"),
                handler: "handler.handler",
                timeout: cdk.Duration.seconds(60),
                role: lambdaRole,
                securityGroup: lambdaSg,
                environment: {
                    DB_PORT,
                    DB_USER,
                    DB_NAME,
                    DB_HOST: dbCluster.clusterEndpoint.hostname,
                    PROXY_HOST: dbProxy.endpoint,
                    REGION: process.env.AWS_REGION!
                }
            });
        }

        new cdk.CfnOutput(this, "instance-endpoint", { value: dbCluster.clusterEndpoint.hostname });
        new cdk.CfnOutput(this, "proxy-endpoint", { value: dbProxy.endpoint });
    }
}

const app = new cdk.App();
new RdsProxyStack(app, "RdsProxyStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});