## EKS Cluster Example
This example will deploy an EKS cluster, worker nodes, ECR repositories and two services written in Python and NodeJs. Services include Kubernetes resources such as Service, Deployment and Horizontal Pod Scaler templates.

`go-api` folder consist of sample REST API written in Go

`graphql-api` folder consists of GraphQL server written in Nodejs


After the successful deployment you will see two commands. Use first one to setup your `kubectl` config

`aws eks update-kubeconfig --name ekscluster --region us-east-1 --role-arn arn:aws:iam::111111111111:role/EKSClusterStack-masterroleEF831F2F-8ZOJQU6ROPCT --profile your_profile`

This command will set the Kubernetes config needed for you to use `kubectl` to control your cluster

`kubectl get svc`

This will show Service resources and external domain information.

For trying out grapql-api service go to: `{DOMAIN_URL}/graphql`

For trying out go-api service go to : `{DOMAIN_URL}/dogs`

You will need to deploy Metrics Server to get HPA working correctly.  
https://github.com/kubernetes/kubernetes/tree/master/cluster/addons/metrics-server

Destroy resources after you are done with the example  
`cdk destroy --profile your_profile`