## EKS Fargate Example
This example will deploy an EKS cluster with Fargate capability.

`go-api` folder consist of sample REST API written in Go  
`graphql-api` folder consists of GraphQL server written in Nodejs

After the successful deployment you will see two commands. Use first one to setup your `kubectl` config  
`aws eks update-kubeconfig --name ekscluster --region us-east-1 --role-arn arn:aws:iam::111111111111:role/EKSClusterStack-masterroleEF831F2F-8ZOJQU6ROPCT --profile your_profile`

This command will set the Kubernetes config needed for you to use `kubectl` to control your cluster

After the initial deployment, pods in all namespaces would stuck in "Pending" state. We need to manually restart all deployments to schedule them on Fargate nodes.  
`kubectl rollout restart deployments -n kube-system`  
`kubectl rollout restart deployments`

After that, try getting the running pods in default namespace  
`kubectl get pods`

Forward ports to localhost  
`kubectl port-forward deployment/go-api 8080:8080`