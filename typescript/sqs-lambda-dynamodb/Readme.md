## SQS Lambda and DynamoDB Stack
This example will deploy a SQS queue, DynamoDB table and a Lambda function written in Javacript. Lambda function will get triggered by incoming SQS messages and it will process the incoming message, after that processed data will be added to DynamoDB table.

<img src="../../assets/sqs-lambda-dynamo.png" width="600">