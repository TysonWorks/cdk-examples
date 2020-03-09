import * as cdk from "@aws-cdk/core";
import * as eks from "@aws-cdk/aws-eks";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import * as ecrAssets from "@aws-cdk/aws-ecr-assets";
import { getKubernetesTemplates } from "./templates";
import { config } from "dotenv";
config();

class ServerlessEKSStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const mastersRole = new iam.Role(this, 'masters-role', {
            assumedBy: new iam.AccountRootPrincipal()
        });

        const fargateProfileRole = new iam.Role(this, "fargate-profile-role", {
            assumedBy: new iam.ServicePrincipal("eks-fargate-pods.amazonaws.com"),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSFargatePodExecutionRolePolicy")
            ]
        })

        const cluster = new eks.FargateCluster(this, "fargate-cluster", {
            clusterName: "sls-eks",
            vpc,
            mastersRole,
            coreDnsComputeType: eks.CoreDnsComputeType.FARGATE,
            defaultProfile: {
                fargateProfileName: "default-profile",
                selectors: [
                    { namespace: "default" },
                    { namespace: "kube-system" }
                ],
                podExecutionRole: fargateProfileRole
            }
        });

        const goAPIRepo = new ecrAssets.DockerImageAsset(this, "go-api-docker", {
            repositoryName: "go-api",
            directory: "go-api"
        });

        const graphqlAPIRepo = new ecrAssets.DockerImageAsset(this, "graphql-docker", {
            repositoryName: "graphql-api",
            directory: "graphql-api"
        });

        const apiTemplates = getKubernetesTemplates(
            goAPIRepo, //repo
            "go-api", //resource name
            8080, //container port,
            2 //replica number
        );
        cluster.addResource("api-resource", ...apiTemplates);

        const graphqlTemplates = getKubernetesTemplates(
            graphqlAPIRepo, //repo
            "graphql-api", //resource name
            8090, //container port,
            2 //replica number
        );
        cluster.addResource("graphql-resource", ...graphqlTemplates);
    }
}

const app = new cdk.App();
const stack = new ServerlessEKSStack(app, "ServerlessEksStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.AWS_ACCOUNT_ID
    }
});