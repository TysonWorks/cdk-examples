import * as cdk from "aws-cdk-lib";
import * as cassandra from "aws-cdk-lib/aws-cassandra"
import { config } from "dotenv";
import { Construct } from "constructs";
config();

class CassandraStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const keyspace = new cassandra.CfnKeyspace(this, "keyspace", {
            keyspaceName: "cdkkeyspace"
        });

        const table = new cassandra.CfnTable(this, "table", {
            keyspaceName: keyspace.keyspaceName as string,
            tableName: "cdktable",
            partitionKeyColumns: [
                {columnName: "id", columnType: "text"},
                {columnName: "name", columnType: "text"},
                {columnName: "region", columnType: "text"},
                {columnName: "role", columnType: "text"}
            ]
        });
        
        table.addDependsOn(keyspace);

        new cdk.CfnOutput(this, "keyspace-name", {
            value: keyspace.keyspaceName as string
        });

        new cdk.CfnOutput(this, "table-name", {
            value: table.tableName as string
        });

    }
}

const app = new cdk.App();
new CassandraStack(app, "CassandraStack", {
    env: {
        account: process.env.AWS_ACCOUNT_ID,
        region: process.env.AWS_REGION
    }
});