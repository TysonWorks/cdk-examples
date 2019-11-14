const fs = require("fs");
import cdk = require("@aws-cdk/core");
import ec2 = require("@aws-cdk/aws-ec2");
import batch = require("@aws-cdk/aws-batch");
import iam = require("@aws-cdk/aws-iam");
import lambda = require("@aws-cdk/aws-lambda");
import events = require("@aws-cdk/aws-events");
import targets = require("@aws-cdk/aws-events-targets");

const functionName = "batch-lambda";
const jobDefinitionName = "job-definition";
const computeEnvironmentName = "compute-environment";
const jobQueueName = "job-queue";
const srcPath = `${__dirname}/lambdaHandler.js`;

export class BatchStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const sg = new ec2.SecurityGroup(this, "sg", {
            securityGroupName: "batch-sg",
            vpc
        });

        const stsAssumeRoleStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["sts:AssumeRole"],
            resources: ["*"]
        });

        const jobSubmitStatement = new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["batch:SubmitJob"],
            resources: ["*"]
        });

        const batchServiceRole = new iam.Role(this, "service-role", {
            assumedBy: new iam.ServicePrincipal("batch.amazonaws.com"),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSBatchServiceRole")],
        });
        batchServiceRole.addToPolicy(stsAssumeRoleStatement);

        const instanceRole = new iam.Role(this, "instance-role", {
            assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName("service-role/AmazonEC2ContainerServiceforEC2Role")],
        });
        instanceRole.addToPolicy(stsAssumeRoleStatement);

        const instanceProfile = new iam.CfnInstanceProfile(this, "instance-profile", {
            instanceProfileName: "instance-profile",
            roles: [
                instanceRole.roleName
            ]
        });

        const jobDefinition = new batch.CfnJobDefinition(this, "job-definition", {
            jobDefinitionName,
            type: "Container",
            containerProperties: {
                command: ["echo", "hello globe"],
                environment: [
                    {name: "MY_VAR", value: "Good"}
                ],
                image: "docker.io/library/busybox",
                vcpus: 2,
                memory: 4096
            },
            retryStrategy: {
                attempts: 3
            },
            timeout: {
                attemptDurationSeconds: 60
            }
        });

        const computeEnvironemnt = new batch.CfnComputeEnvironment(this, "compute-environment", {
            computeEnvironmentName,
            computeResources: {
                minvCpus: 2,
                desiredvCpus: 2,
                instanceTypes: [
                    "optimal"
                ],
                maxvCpus: 4,
                instanceRole: instanceProfile.attrArn,
                type: "EC2",
                subnets: vpc.publicSubnets.map(x=>x.subnetId),
                securityGroupIds: [sg.securityGroupId]
            },
            serviceRole: batchServiceRole.roleArn,
            type: "MANAGED"
        });
        computeEnvironemnt.addDependsOn(instanceProfile);

        const jobQueue = new batch.CfnJobQueue(this, "job-queue", {
            jobQueueName,
            priority: 1,
            state: "ENABLED",
            computeEnvironmentOrder: [
                {order: 1, computeEnvironment: computeEnvironemnt.computeEnvironmentName as string}
            ]
        });
        jobQueue.addDependsOn(computeEnvironemnt);
        
        const lambdaFunction = new lambda.Function(this, "lambda-function", {
            functionName,
            code: new lambda.InlineCode(fs.readFileSync(srcPath, {encoding: "utf-8"})),
            handler: "index.handler",
            timeout: cdk.Duration.seconds(30),
            runtime: lambda.Runtime.NODEJS_8_10,
            environment: {
                REGION: process.env.AWS_REGION as string,
                JOB_DEFINITION: jobDefinitionName,
                JOB_QUEUE: jobQueueName
            },
            initialPolicy: [jobSubmitStatement]
        });
        const rule = new events.Rule(this, 'event-rule', {
            schedule: events.Schedule.expression('rate(5 minutes)')
        });
        rule.addTarget(new targets.LambdaFunction(lambdaFunction));
    }
}

const app = new cdk.App();
new BatchStack(app, "BatchStack", {
    env: {
        account: process.env.ACCOUNT_ID,
        region: process.env.AWS_REGION,
    }
});