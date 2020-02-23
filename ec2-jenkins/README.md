## EC2 Jenkins Example
This example will deploy an EC2 instance to a new VPC & default public subnet and a 100 gb EBS volume. It will get the latest `Jenkins Public Bitnami AMI` from the Bitnami website using `cheerio`. 

You will see the output url after the successful deployment. Open the URL in browser and you will see a login screen. In order to get pre-configured user credentials, head over to the EC2 console. Right click on `jenkins-instance` -> Instance Settings -> Get System Log

<img src="https://docs.bitnami.com/images/img/platforms/aws/cm-app-credentials-2.png" width="1000">

<img src="https://docs.bitnami.com/images/img/platforms/aws/cm-app-credentials-3.png" width="1000">

Use these credentials to login.
