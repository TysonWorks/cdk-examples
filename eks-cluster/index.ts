import * as cdk from "aws-cdk-lib/core";
import * as eks from "aws-cdk-lib/aws-eks";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as ecrAssets from "aws-cdk-lib/aws-ecr-assets";
import { getKubernetesTemplates } from "./templates";
import { Construct } from "constructs";
import { config } from "dotenv";
config();

class EKSClusterStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const mastersRole = new iam.Role(this, 'master-role', {
            assumedBy: new iam.AccountRootPrincipal()
        });

        const cluster = new eks.Cluster(this, "cluster", {
            version: eks.KubernetesVersion.V1_23,
            defaultCapacityInstance: new ec2.InstanceType("m5.large"),
            defaultCapacity: 2,
            clusterName: "ekscluster",
            vpc,
            mastersRole
        });

        const goAPIRepo = new ecrAssets.DockerImageAsset(this, "go-api-repo", {
            directory: "go-api",
        });

        const graphqlAPIRepo = new ecrAssets.DockerImageAsset(this, "graphql-api-repo", {
            directory: "graphql-api"
        });

        const goAPIResource = new eks.KubernetesManifest(this, "go-api-resource", {
            cluster,
            manifest: getKubernetesTemplates(
                goAPIRepo, //repo
                "go-api", //resource name
                8080, //container port
                2, //replica number
                2, // min replicas for hpa
                4, // max replicas for hpa
                70 // hpa cpu util. target
            )
        });

        const graphqlAPIResource = new eks.KubernetesManifest(this, "graphql-api-resource", {
            cluster,
            manifest: getKubernetesTemplates(
                graphqlAPIRepo, //repo
                "graphql-api", //resource name
                8090, //container port
                2, //replica number
                2, // min replicas for hpa
                4, // max replicas for hpa
                70 // hpa cpu util. target
            )
        });

    }
}

const app = new cdk.App();
const stack = new EKSClusterStack(app, "EKSClusterStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.AWS_ACCOUNT_ID
    }
});