# Examples using AWS CDK (Cloud Development Kit)
Install CDK CLI globally

```npm install -g aws-cdk```

### How to Deploy Examples

``` cd ec2-basics ```

Install dependencies

``` npm install ```

Set environment variebles

```export ACCOUNT_ID="aws_account_id"```

```export AWS_REGION="us-west-2"```

Deploy using CDK CLI

``` cdk deploy  --profile myprofile```

### Other CLI Commands

- ```cdk diff``` Prints out the difference in stacks

- ```cdk destroy``` Removes the stack

- ```cdk list``` List the applications in given folder

- ```cdk synth```  Synthesizes and prints the CloudFormation for the stack

- ```cdk init``` Generates sample cdk project

- ```cdk doctor``` Checks the app setup
