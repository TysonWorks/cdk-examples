# Examples using AWS CDK (Cloud Development Kit)

### How to Deploy Examples

Install the CDK CLI globally  
`npm install -g aws-cdk`

Change directory to any example  
`cd sagemaker`

Install dependencies  
`npm install`

Set environment variables  
`vim .env`

Deploy using the CDK CLI   
`cdk deploy`  

or deploy to non-default AWS profile  
`cdk deploy --profile my_profile`  

### Other CLI Commands

- `cdk diff` Prints out the difference in stacks

- `cdk destroy` Removes the stack

- `cdk list` List the applications in given folder

- `cdk synth`  Synthesizes and prints the CloudFormation template for the stack

- `cdk init` Generates a new cdk project

- `cdk doctor` Checks the CDK setup
