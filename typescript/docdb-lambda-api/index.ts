import cdk = require("@aws-cdk/core");
import lambda = require("@aws-cdk/aws-lambda");
import api = require("@aws-cdk/aws-apigateway");
import docdb = require("@aws-cdk/aws-docdb");
import ec2 = require("@aws-cdk/aws-ec2");

export class DocdbLambdaAPIStack extends cdk.Stack {
    constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = new ec2.Vpc(this, "vpc", {
            maxAzs: 3
        });

        const dbCluster = new docdb.CfnDBCluster(this, "db-cluster", {
            storageEncrypted: true,
            availabilityZones: vpc.availabilityZones,
            dbClusterIdentifier: "docdb",
            masterUsername: "admin",
            masterUserPassword: process.env.MASTER_USER_PASSWORD
        });

        const dbInstance = new docdb.CfnDBInstance(this, "db-instance", {
            dbClusterIdentifier: dbCluster.ref,
            autoMinorVersionUpgrade: true,
            dbInstanceClass: "db.m4.large",
            dbInstanceIdentifier: "staging"
        });
        dbInstance.addDependsOn(dbCluster);

        new cdk.CfnOutput(this, "db", {
            value: dbInstance.ref
        })
    }
}

const app = new cdk.App();
new DocdbLambdaAPIStack(app, "DocdbLambdaAPIStack", {
    env: {
        region: process.env.AWS_REGION,
        account: process.env.ACCOUNT_ID
    }
});