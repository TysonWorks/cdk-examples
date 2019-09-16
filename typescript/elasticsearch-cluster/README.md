## ElasticSearch Cluster
This example will deploy an ElasticSearch cluster using AWS CDK. 


For enabling VPC, you need to comment out necessary lines and create a VPN connection to VPC for interacting with Kibana and ElasticSearch API. 


After the successful deployment you will get an output similiar to this.

```ElasticSearchStack.domain = search-es-domain-zq3r5qgq2b5ecvctp7pry6vupu.us-east-1.es.amazonaws.com```
```ElasticSearchStack.kibana = search-es-domain-zq3r5qgq2b5ecvctp7pry6vupu.us-east-1.es.amazonaws.com/_plugin/kibana/```

Go to Kibana URL, you should see the Kibana setup page.
