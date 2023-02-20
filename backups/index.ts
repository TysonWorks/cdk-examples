import * as cdk from "aws-cdk-lib";
import * as rds from "aws-cdk-lib/aws-rds";
import * as backup from "aws-cdk-lib/aws-backup";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Backup, BackupProps } from "cdk-backup-plan";
import { config } from "dotenv";
import { Construct } from "constructs";
config();

class AWSBackupStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const dynamoTable = new dynamodb.Table(this, "dynamo-table", {
            tableName: "dynamo-table",
            partitionKey: { name: "id", type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const vpc = ec2.Vpc.fromLookup(this, "vpc", {
            isDefault: true,
          });

        // We define the instance details here
        const ec2Instance = new ec2.Instance(this, 'Instance', {
          vpc,
          instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
          machineImage:  new ec2.AmazonLinuxImage({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 })
        });


        const auroraCluster = new rds.ServerlessCluster(this, "rds-cluster", {
            engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
            enableDataApi: true,
            parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'ParameterGroup', "default.aurora-postgresql10"),
        });

        const dynamoBackup = new Backup(this, "dynamo-backup", {
            backupPlanName: "dynamo-backup",
            backupRateHour: 2, 
            backupCompletionWindow: cdk.Duration.hours(2),
            resources: [backup.BackupResource.fromDynamoDbTable(dynamoTable)],
          });

          const auroraBackup = new Backup(this, "aurora-backup", {
            backupPlanName: "aurora-backup",
            backupRateHour: 2,
            backupCompletionWindow: cdk.Duration.hours(2),
            resources: [backup.BackupResource.fromRdsServerlessCluster(auroraCluster)]
          });
        

          const ec2Backup =  new Backup(this, "ec2-backup", {
            backupPlanName: "ec2-backup",
            backupRateHour: 2,
            backupCompletionWindow: cdk.Duration.hours(2),
            resources: [backup.BackupResource.fromEc2Instance(ec2Instance)]
          });

          new cdk.CfnOutput(this, "dynamo-backup-id", {
            value: dynamoBackup.backupPlan.backupPlanId
          });

          new cdk.CfnOutput(this, "aurora-backup-id", {
            value: auroraBackup.backupPlan.backupPlanId
          });

          new cdk.CfnOutput(this, "ec2-backup-id", {
            value: ec2Backup.backupPlan.backupPlanId
          });

    }
}

const app = new cdk.App();
new AWSBackupStack(app, "AWSBackupStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});